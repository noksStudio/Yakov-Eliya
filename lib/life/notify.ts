import type { LifeStore } from "./store";
import type { OpsStore } from "./ops-store";
import type { DayView } from "./types";
import { businessSummary } from "./business";
import { loadCouple, occasionLabel, reminderDays, upcomingOccasions } from "./couple";
import { financeSummary } from "./finance";
import { computeMetrics } from "./metrics";
import { computeInsights, goalsProgress } from "./growth";
import { getLessonsStore, markLessonShown, pickLesson } from "./lessons";
import { dueReminders, loadReminders, markRemindersSent } from "./reminders";
import { applySeeds } from "./seeds";
import { loadDay } from "./service";
import { escapeHtml, loadTelegram, sendMessage } from "./telegram";
import { addDays, fromMinutes, israelNow, israelToday, restDayOf, toMinutes } from "./time";

// Scheduled Telegram nudges. A cron pings /api/cron/notify every few minutes; each rule fires once
// a day, in the first run inside its 10-minute window. Nothing is sent on Shabbat or Yom Tov, or
// from 14:00 on the eve of one. Fewer, fuller messages: whatever falls within 15 minutes goes out
// as one message, "mute today" silences the rest of the day (reminders he set still come), and a
// day off (Chol HaMoed) gets only the morning message.

export const NOTIFY_RULES = [
  { key: "morning", label: "תכנית בוקר", hint: "5 דקות אחרי הקימה: משימות, אימון, לימוד ותזכורת שקילה", default: true },
  { key: "learning", label: "תחילת לימוד", hint: "בתחילת סשן הלימוד", default: true },
  { key: "deep", label: "עבודה עמוקה", hint: "בתחילת הבלוק: פעילות מכירה ופולואפים", default: true },
  { key: "workout", label: "אימון", hint: "15 דקות לפני", default: true },
  { key: "prayers", label: "מנחה וערבית", hint: "10 דקות לפני, כשהשעה מוגדרת", default: true },
  { key: "close", label: "סגירת יום", hint: "תפילות, מכירות ורווח היום", default: true },
  { key: "hitbodedut", label: "התבודדות", hint: "5 דקות לפני", default: true },
  { key: "screens", label: "מסכים כבויים", hint: "בשעת כיבוי המסכים", default: false },
  { key: "weekly", label: "סיכום שבועי", hint: "יום ראשון אחרי שחרית", default: true },
] as const;

export type NotifyKey = (typeof NOTIFY_RULES)[number]["key"];
export type NotifyPrefs = Record<NotifyKey, boolean>;

const WINDOW_MINUTES = 10;
/** Nudges due within this many minutes of each other go out together, in the earliest one's run. */
export const BATCH_MINUTES = 15;
const EVE_CUTOFF = toMinutes("14:00");

export async function loadNotifyPrefs(store: LifeStore): Promise<NotifyPrefs> {
  const saved = (await store.getDoc<Partial<NotifyPrefs>>("notify_prefs")) ?? {};
  return Object.fromEntries(NOTIFY_RULES.map((r) => [r.key, saved[r.key] ?? r.default])) as NotifyPrefs;
}

type NotifyLog = { date: string; sent: string[] };
type MuteDoc = { date: string | null };

/** "Mute today": silences the scheduled nudges until tomorrow morning. Reminders still come. */
export async function isMuted(store: LifeStore, date = israelToday()) {
  return (await store.getDoc<MuteDoc>("notify_mute"))?.date === date;
}
export async function setMuted(store: LifeStore, muted: boolean, date = israelToday()) {
  await store.saveDoc<MuteDoc>("notify_mute", { date: muted ? date : null });
}

export type Slot = { id: string; rule: NotifyKey; at: string };

/** Every nudge the day would get, in time order (before prefs, rest days and the send log). */
export function slotsFor(day: DayView): Slot[] {
  const s = day.settings;
  const slot = (id: string, rule: NotifyKey, minutes: number): Slot => ({ id, rule, at: fromMinutes(minutes) });
  const slots: Slot[] = [slot("morning", "morning", toMinutes(s.wake_time) + 5)];
  if (day.learning.session) slots.push(slot("learning", "learning", toMinutes(day.learning.session.start)));
  slots.push(slot("deep", "deep", toMinutes(s.deep_work_start)));
  if (day.body.activity) slots.push(slot("workout", "workout", toMinutes(day.body.activity.time) - 15));
  if (s.mincha_time) slots.push(slot("mincha", "prayers", toMinutes(s.mincha_time) - 10));
  if (s.arvit_time) slots.push(slot("arvit", "prayers", toMinutes(s.arvit_time) - 10));
  slots.push(slot("close", "close", toMinutes(s.day_close_time)));
  slots.push(slot("hitbodedut", "hitbodedut", toMinutes(s.hitbodedut_time) - 5));
  slots.push(slot("screens", "screens", toMinutes(s.screens_off_time)));
  if (new Date(`${day.date}T12:00:00Z`).getUTCDay() === 0) {
    slots.push(slot("weekly", "weekly", toMinutes(s.shacharit_time) + 45));
  }
  return slots.sort((a, b) => toMinutes(a.at) - toMinutes(b.at));
}

/** Why nothing may be sent at this moment, or null when sending is allowed. */
export function quietReason(date: string, nowMinutes: number) {
  const rest = restDayOf(date);
  if (rest) return `${rest.name}: אין התראות`;
  const eve = restDayOf(addDays(date, 1));
  if (eve && nowMinutes >= EVE_CUTOFF) return `ערב ${eve.name}: אין התראות מ־14:00`;
  return null;
}

/**
 * What to send in this run: the nudges whose window is open now, plus any others due within
 * BATCH_MINUTES of the earliest of them (or of `anchor`, a reminder going out now), so they arrive
 * as one message instead of several a few minutes apart.
 */
export function dueSlots(day: DayView, prefs: NotifyPrefs, sent: string[], nowMinutes: number, anchor: number | null = null) {
  // A day off gets only the morning message.
  const open = slotsFor(day).filter((slot) => prefs[slot.rule] && !sent.includes(slot.id) && !(day.dayOff && slot.rule !== "morning"));
  const due = open.filter((slot) => nowMinutes >= toMinutes(slot.at) && nowMinutes < toMinutes(slot.at) + WINDOW_MINUTES);
  const starts = [...due.map((slot) => toMinutes(slot.at)), ...(anchor === null ? [] : [anchor])];
  if (!starts.length) return [];
  const until = Math.min(...starts) + BATCH_MINUTES;
  return open.filter((slot) => due.includes(slot) || (toMinutes(slot.at) > nowMinutes && toMinutes(slot.at) <= until));
}

const ils = (n: number) => `${Math.round(n).toLocaleString("he-IL")} ₪`;
const link = (origin: string, path: string, label: string) => `<a href="${origin}${path}">${label}</a>`;

/** Contextual lessons with their full story (a packing list is only useful in full). */
function contextLines(items: DayView["contextLessons"], only?: "today" | "tomorrow") {
  return items
    .filter((c) => !only || c.when === only)
    .flatMap((c) => [
      "",
      `🎒 <b>${c.when === "today" ? "היום" : "מחר"}: ${escapeHtml(c.match)}</b>`,
      `💡 ${escapeHtml(c.lesson.rule)}`,
      ...(c.lesson.story ? [escapeHtml(c.lesson.story)] : []),
    ]);
}

/** Today's lesson, preferring ones from the areas the day is about (workout, sales, events). */
export async function lessonForDay(day: DayView) {
  const areas = [...new Set(day.timeline.filter((i) => i.kind !== "anchor").map((i) => i.area))];
  return pickLesson(await getLessonsStore().list(), day.date, areas);
}

export async function morningMessage(store: LifeStore, ops: OpsStore, day: DayView, origin: string) {
  const business = await businessSummary(ops, day.date);
  const lines = [`☀️ <b>בוקר טוב!</b> ${day.weekday}, ${day.hebrewDate}`];
  if (day.dayOff) lines.push(`🌿 ${day.dayOff}: חופש מעבודה. מועדים לשמחה!`);
  // On a day off, work tasks wait for the next working day.
  const top = day.openTasks.filter((t) => !(day.dayOff && t.area === "business")).slice(0, 3);
  if (top.length) {
    lines.push("", "<b>המשימות החשובות</b>", ...top.map((t, i) => `${i + 1}. ${escapeHtml(t.title)}`));
  }
  const plan: string[] = day.timeline
    .filter((item) => item.kind === "event" && item.start)
    .map((item) => `📅 ${item.start} ${escapeHtml(item.title)}`);
  if (day.body.activity) plan.push(`🏋️ ${escapeHtml(day.body.activity.title)} ב־${day.body.activity.time}`);
  if (day.learning.session) plan.push(`📖 ${escapeHtml(day.learning.title)}: ${escapeHtml(day.learning.next ?? "")} ב־${day.learning.session.start}`);
  if (!day.dayOff) plan.push(`🎯 עבודה עמוקה מ־${day.settings.deep_work_start} עד ${day.settings.deep_work_end}`);
  if (plan.length) lines.push("", ...plan);
  if (day.dueLeads.length) {
    lines.push(
      "",
      "<b>לידים לחזור אליהם</b>",
      ...day.dueLeads
        .slice(0, 5)
        .map((l) => `🔔 ${escapeHtml(l.name)}${l.business_type ? ` · ${escapeHtml(l.business_type)}` : ""}${l.phone ? ` · ${escapeHtml(l.phone)}` : ""}${l.due < day.date ? " (באיחור)" : ""}`),
      ...(day.dueLeads.length > 5 ? [`ועוד ${day.dueLeads.length - 5}…`] : []),
    );
  }
  if (!day.dayOff && business.due.length) {
    lines.push("", "<b>פולואפים להיום</b>", ...business.due.slice(0, 4).map((d) => `• ${escapeHtml(d.name)}${d.next_action ? `: ${escapeHtml(d.next_action)}` : ""}`));
  }
  // Birthdays and anniversaries: two weeks, a week, three days, the day before and the day itself;
  // big celebrations from three months ahead, so there is time to book and invite.
  const occasions = upcomingOccasions(await loadCouple(store), day.date, 90).filter((o) => reminderDays(o).includes(o.daysLeft));
  if (occasions.length) {
    lines.push(
      "",
      ...occasions.map((o) =>
        o.daysLeft === 0 ? `🎂 היום ${escapeHtml(occasionLabel(o))}!` : `🎁 ${escapeHtml(occasionLabel(o))} ${o.daysLeft === 1 ? "מחר" : `בעוד ${o.daysLeft} ימים`}`,
      ),
    );
  }
  const reminders = (await loadReminders(store)).filter((r) => !r.sent && r.date === day.date);
  if (reminders.length) lines.push("", "<b>תזכורות להיום</b>", ...reminders.map((r) => `⏰ ${r.time} ${escapeHtml(r.text)}`));
  if (day.weekFocus.length) lines.push("", "<b>הפוקוס של השבוע</b>", ...day.weekFocus.map((f) => `• ${escapeHtml(f)}`));
  lines.push(...contextLines(day.contextLessons));
  const lesson = await lessonForDay(day);
  if (lesson) lines.push("", `💡 <b>לקח:</b> ${escapeHtml(lesson.rule)}`);
  if (!day.checkin?.weight) lines.push("", "⚖️ לא לשכוח להישקל: שלח /w ומשקל");
  lines.push("", link(origin, "/life", "לפתוח את היום שלי"), "🔕 יום עמוס? /mute משתיק את שאר ההתראות של היום");
  return lines.join("\n");
}

async function messageFor(slot: Slot, store: LifeStore, ops: OpsStore, day: DayView, origin: string): Promise<string> {
  const s = day.settings;
  switch (slot.rule) {
    case "morning":
      return morningMessage(store, ops, day, origin);
    case "learning": {
      const l = day.learning;
      return `📖 זמן לימוד: <b>${escapeHtml(l.title)}</b>${l.next ? `, ${escapeHtml(l.next)}` : ""} (עד ${l.session?.end ?? ""}).\nנותרו ${l.total - l.done} עמודים עד ${l.deadline.split("-").reverse().join(".")}.`;
    }
    case "deep": {
      const b = await businessSummary(ops, day.date);
      const due = b.due.slice(0, 3).map((d) => `• ${escapeHtml(d.name)}${d.next_action ? `: ${escapeHtml(d.next_action)}` : ""}`);
      return [
        `🎯 <b>עבודה עמוקה</b> עד ${s.deep_work_end}. טלפון על שקט, פנייה ישירה.`,
        `פעילות מכירה היום: ${b.activityDone}/${b.activityTarget}`,
        ...(due.length ? ["", "פולואפים:", ...due] : []),
        "",
        link(origin, "/life/business", "לוח המכירות"),
      ].join("\n");
    }
    case "workout":
      return `🏋️ ב־${day.body.activity?.time ?? ""}: <b>${escapeHtml(day.body.activity?.title ?? "אימון")}</b>.\nאחרי האימון שלח /workout.`;
    case "prayers": {
      const name = slot.id === "mincha" ? "מנחה" : "ערבית";
      const time = slot.id === "mincha" ? s.mincha_time : s.arvit_time;
      return `🕍 ${name} ב־${time}.`;
    }
    case "close": {
      const [b, f] = await Promise.all([businessSummary(ops, day.date), financeSummary(store, ops, day.date)]);
      const c = day.checkin;
      const prayed = c ? [c.shacharit, c.mincha, c.arvit].filter(Boolean).length : 0;
      return [
        "🌙 <b>סגירת יום</b>",
        `תפילות: ${prayed}/3 · התבודדות ב־${s.hitbodedut_time}`,
        `אימון: ${day.body.activity ? (c?.workout ? "בוצע ✓" : "עוד לא סומן") : "יום מנוחה"}`,
        ...(day.dayOff
          ? []
          : [`מכירות: ${b.activityDone}/${b.activityTarget}`, `רווח היום: ${ils(f.todayProfit)} · החודש ${ils(f.profit)} מתוך ${ils(f.goal.monthly_goal)}`]),
        `משימות שנסגרו היום: ${day.doneToday.length}`,
        // The evening before a trip is when to pack: tomorrow's contextual lessons, in full.
        ...contextLines(day.contextLessons, "tomorrow"),
        "",
        link(origin, "/life", "לסגור את היום ולתכנן מחר"),
      ].join("\n");
    }
    case "hitbodedut":
      return `🌌 התבודדות ב־${s.hitbodedut_time}, ${s.hitbodedut_minutes} דקות. הטלפון בצד.`;
    case "screens":
      return `📵 מסכים כבויים. שינה ב־${s.sleep_time}. לילה טוב.`;
    case "weekly":
      return weeklyMessage(store, ops, day.date, origin);
  }
}

export async function metricsMessage(store: LifeStore, ops: OpsStore, date: string, origin: string, title = "📊 <b>המדדים שלי</b>") {
  const metrics = await computeMetrics(store, ops, date);
  const mark = { good: "🟢", behind: "🟠", due: "🔵", neutral: "⚪️" } as const;
  return [
    title,
    "",
    ...metrics.map((m) => `${mark[m.status]} ${escapeHtml(m.label)}: <b>${escapeHtml(m.value)}</b> · יעד ${escapeHtml(m.target)}${m.streak ? ` · רצף ${m.streak}` : ""}`),
    "",
    link(origin, "/life/metrics", "כל המדדים"),
  ].join("\n");
}

const goalNum = (n: number) => (Math.abs(n) >= 1000 ? Math.round(n).toLocaleString("he-IL") : String(Math.round(n * 10) / 10));

/** Sunday after Shacharit: where the goals stand, what the data taught, and the review link. */
async function weeklyMessage(store: LifeStore, ops: OpsStore, date: string, origin: string) {
  const [goals, checkins, activity] = await Promise.all([
    goalsProgress(store, ops, date),
    store.listCheckins(addDays(date, -41), date),
    ops.listActivity(addDays(date, -41), date),
  ]);
  const mark = { done: "✅", on_track: "🟢", behind: "🟠", no_data: "⚪️" } as const;
  const insights = computeInsights(checkins, activity).slice(0, 2);
  return [
    "🗓️ <b>שבוע חדש: סקירה שבועית</b>",
    "",
    "<b>חזון 30</b>",
    ...goals.map((g) => `${mark[g.status]} ${escapeHtml(g.title)}: ${g.current === null ? "—" : goalNum(g.current)} / ${goalNum(g.target)} ${escapeHtml(g.unit)}`),
    ...(insights.length ? ["", "<b>מה למדנו עליך</b>", ...insights.map((i) => `• ${escapeHtml(i.text)}`)] : []),
    "",
    "5 דקות: מה הלך טוב, מה לא, איזה לקח לוקחים, ו־3 פוקוסים לשבוע.",
    link(origin, "/life/growth?tab=review", "לסקירה השבועית"),
  ].join("\n");
}

export type NotifyResult = {
  date: string;
  now: string;
  skipped?: string;
  sent: { id: string; at: string; text?: string }[];
};

/**
 * Sends whatever is due now. `dry`: returns the messages without sending or logging (for testing;
 * works without Supabase or a linked chat).
 */
export async function runNotifications(store: LifeStore, ops: OpsStore, origin: string, opts: { dry?: boolean; now?: Date } = {}): Promise<NotifyResult> {
  const nowDate = opts.now ?? new Date();
  const date = israelToday(nowDate);
  const now = israelNow(nowDate);
  const nowMinutes = toMinutes(now);
  const base = { date, now, sent: [] as NotifyResult["sent"] };

  const quiet = quietReason(date, nowMinutes);
  if (quiet) return { ...base, skipped: quiet };

  await applySeeds(store);
  const telegram = await loadTelegram(store);
  const canSend = opts.dry || telegram.chat_id !== null;
  // Everything due in this run becomes one message; `ids` are what it covers.
  const parts: { ids: { id: string; at: string }[]; text: string }[] = [];

  // Reminders he set himself go out even before the routine starts, and even when muted.
  const due = canSend ? dueReminders(await loadReminders(store), date, nowMinutes) : [];
  if (due.length) {
    parts.push({
      ids: due.map((r) => ({ id: `reminder-${r.id}`, at: r.time })),
      text: due.map((r) => `⏰ <b>תזכורת:</b> ${escapeHtml(r.text)}`).join("\n"),
    });
  }

  const settings = await store.getSettings();
  let skipped: string | undefined;
  let slots: Slot[] = [];
  let day: DayView | null = null;
  const [prefs, savedLog, muted] = await Promise.all([loadNotifyPrefs(store), store.getDoc<NotifyLog>("notify_log"), isMuted(store, date)]);
  const log: NotifyLog = savedLog?.date === date ? savedLog : { date, sent: [] };
  if (settings.start_date && date < settings.start_date) {
    skipped = `השגרה מתחילה ב־${settings.start_date.split("-").reverse().join(".")}`;
  } else if (!canSend) {
    skipped = "הבוט עוד לא מחובר לצ׳אט";
  } else if (muted) {
    skipped = "הושתק להיום";
  } else {
    day = await loadDay(store, date);
    const anchor = due.length ? Math.min(...due.map((r) => toMinutes(r.time))) : null;
    slots = dueSlots(day, prefs, opts.dry ? [] : log.sent, nowMinutes, anchor);
    for (const slot of slots) parts.push({ ids: [{ id: slot.id, at: slot.at }], text: await messageFor(slot, store, ops, day, origin) });
  }

  if (parts.length) {
    const text = parts.map((p) => p.text).join("\n\n━━━━━━━━\n\n");
    if (opts.dry) {
      base.sent.push(...parts.flatMap((p) => p.ids).map((x, i) => ({ ...x, ...(i === 0 ? { text } : {}) })));
    } else {
      await sendMessage(telegram.chat_id!, text, true);
      if (due.length) await markRemindersSent(store, due.map((r) => r.id));
      if (slots.length) {
        log.sent.push(...slots.map((slot) => slot.id));
        await store.saveDoc("notify_log", log);
      }
      if (day && slots.some((slot) => slot.rule === "morning")) {
        // The lesson in this morning's message counts as seen; it comes back later on its schedule.
        const lesson = await lessonForDay(day);
        if (lesson) await markLessonShown(lesson, date);
      }
      base.sent.push(...parts.flatMap((p) => p.ids));
    }
  }
  return skipped ? { ...base, skipped } : base;
}
