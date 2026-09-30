import type { LifeStore } from "./store";
import { addDays, fromMinutes, israelNow, israelToday, restDayOf, toMinutes } from "./time";

// One-off reminders ("מחר ב־10:00 להתקשר לדני"), sent by the notification cron within five minutes
// of their time. Written from Telegram, the chief manager, or the app.

export type Reminder = { id: string; date: string; time: string; text: string; created_at: string; sent: boolean };
type RemindersDoc = { items: Reminder[] };

export async function loadReminders(store: LifeStore): Promise<Reminder[]> {
  const items = (await store.getDoc<RemindersDoc>("reminders"))?.items ?? [];
  return items.slice().sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

async function save(store: LifeStore, items: Reminder[], today = israelToday()) {
  // Sent reminders are kept two weeks, then dropped.
  const cutoff = addDays(today, -14);
  await store.saveDoc<RemindersDoc>("reminders", { items: items.filter((r) => !r.sent || r.date >= cutoff) });
}

/** Nothing is sent on Shabbat or Yom Tov, or from 14:00 on the eve of one (same rule as all nudges). */
export function quietFor(date: string, time: string): string | null {
  const rest = restDayOf(date);
  if (rest) return `זה יוצא ב${rest.name}, ואז אין התראות. בחר זמן אחר.`;
  const eve = restDayOf(addDays(date, 1));
  if (eve && toMinutes(time) >= toMinutes("14:00")) return `בערב ${eve.name} אין התראות מ־14:00. בחר שעה מוקדמת יותר.`;
  return null;
}

export async function addReminder(store: LifeStore, input: { date: string; time: string; text: string }) {
  const reminder: Reminder = { id: crypto.randomUUID(), ...input, text: input.text.trim().slice(0, 300), created_at: new Date().toISOString(), sent: false };
  await save(store, [...(await loadReminders(store)), reminder]);
  return reminder;
}

export async function removeReminder(store: LifeStore, id: string) {
  const items = await loadReminders(store);
  if (!items.some((r) => r.id === id)) return false;
  await save(store, items.filter((r) => r.id !== id));
  return true;
}

export async function upcomingReminders(store: LifeStore) {
  return (await loadReminders(store)).filter((r) => !r.sent);
}

/** Reminders whose time has come (not yet sent). */
export function dueReminders(items: Reminder[], date: string, minutes: number) {
  return items.filter((r) => !r.sent && (r.date < date || (r.date === date && toMinutes(r.time) <= minutes)));
}

export async function markRemindersSent(store: LifeStore, ids: string[]) {
  const items = await loadReminders(store);
  await save(store, items.map((r) => (ids.includes(r.id) ? { ...r, sent: true } : r)));
}

// ---------------------------------------------------------------------------------------------
// Hebrew "when" parsing, no model needed: "מחר 10:00 …", "בעוד 20 דקות …", "ביום חמישי ב־9:30 …",
// "12.10 בשעה 18 …", "18:30 …" (today, or tomorrow if that time has passed).

const B = "(?:^|\\s)";
const E = "(?=\\s|$|[,.!?])";
const WEEKDAYS: Record<string, number> = { ראשון: 0, שני: 1, שלישי: 2, רביעי: 3, חמישי: 4, שישי: 5, שבת: 6 };

/** `explicitTime`: the line named a time (not the 09:00 default for a bare day). */
export type ParsedWhen = { date: string; time: string; text: string; explicitTime: boolean } | { error: string };

/**
 * `forTask`: a task may be dated in the past (it is simply overdue) and on any day; a reminder
 * must be in the future and outside Shabbat and Yom Tov, when nothing is sent.
 */
export function parseWhen(input: string, now = new Date(), { forTask = false }: { forTask?: boolean } = {}): ParsedWhen {
  let text = ` ${input.trim()} `;
  const today = israelToday(now);
  const nowMin = toMinutes(israelNow(now));
  let date: string | null = null;
  let time: string | null = null;

  const take = (re: RegExp) => {
    const m = text.match(re);
    if (m) text = text.replace(m[0], " ");
    return m;
  };

  // Relative: "בעוד 20 דקות", "בעוד שעה", "בעוד שעתיים", "בעוד חצי שעה", "בעוד 3 ימים".
  const rel = take(new RegExp(`${B}בעוד\\s+(?:(\\d+)\\s*)?(חצי שעה|דקה|דקות|שעה|שעות|שעתיים|יום|יומיים|ימים)${E}`));
  if (rel) {
    const n = rel[1] ? Number(rel[1]) : 1;
    const unit = rel[2];
    let add = 0;
    if (unit === "חצי שעה") add = 30;
    else if (unit.startsWith("דק")) add = n;
    else if (unit === "שעתיים") add = 120;
    else if (unit.startsWith("שע")) add = n * 60;
    if (add) {
      const total = nowMin + add;
      date = addDays(today, Math.floor(total / 1440));
      time = fromMinutes(total);
    } else {
      date = addDays(today, unit === "יומיים" ? 2 : n);
    }
  }

  // Day words.
  const day = take(new RegExp(`${B}(היום|מחרתיים|מחר)${E}`));
  if (day) date = addDays(today, day[1] === "היום" ? 0 : day[1] === "מחר" ? 1 : 2);
  const wd = take(new RegExp(`${B}(?:ב?יום\\s+(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)|ב(ראשון|שלישי|רביעי|חמישי|שישי|שבת))${E}`));
  if (wd) {
    const target = WEEKDAYS[wd[1] ?? wd[2]];
    const current = new Date(`${today}T12:00:00Z`).getUTCDay();
    date = addDays(today, (target - current + 7) % 7 || 7);
  }
  // "12.10", "12/10/2026", "ב־12.10".
  const dm = take(new RegExp(`${B}ב?[-־]?(\\d{1,2})[./](\\d{1,2})(?:[./](\\d{2,4}))?${E}`));
  if (dm) {
    const d = Number(dm[1]);
    const m = Number(dm[2]);
    let y = dm[3] ? Number(dm[3].length === 2 ? `20${dm[3]}` : dm[3]) : Number(today.slice(0, 4));
    const candidate = (yy: number) => `${yy}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (!dm[3] && candidate(y) < today) y++;
    if (m < 1 || m > 12 || d < 1 || d > 31) return { error: "התאריך לא תקין." };
    date = candidate(y);
  }

  // Time: "10:00", "ב־9:30", "בשעה 18:30", "בשעה 18".
  const hm = take(new RegExp(`${B}(?:בשעה\\s+|ב[-־\\s]?)?(\\d{1,2}):(\\d{2})${E}`));
  const hOnly = hm ? null : take(new RegExp(`${B}בשעה\\s+(\\d{1,2})${E}`));
  const h = hm ? Number(hm[1]) : hOnly ? Number(hOnly[1]) : null;
  const min = hm ? Number(hm[2]) : 0;
  if (h !== null) {
    if (h > 23 || min > 59) return { error: "השעה לא תקינה." };
    time = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }

  if (!date && !time) {
    return { error: "לא הבנתי מתי. למשל: ״מחר 10:00 להתקשר לדני״, ״בעוד 20 דקות לצאת״, ״ביום חמישי ב־9:30 פגישה״." };
  }
  const explicitTime = time !== null;
  if (!time) time = "09:00";
  if (!date) date = toMinutes(time) > nowMin ? today : addDays(today, 1);
  if (!forTask && (date < today || (date === today && toMinutes(time) <= nowMin))) return { error: "הזמן הזה כבר עבר." };

  const quiet = forTask ? null : quietFor(date, time);
  if (quiet) return { error: quiet };

  const cleaned = text.replace(/\s+/g, " ").trim().replace(/^[-־:,]\s*/, "");
  if (!cleaned) return { error: "על מה להזכיר? למשל: ״מחר 10:00 להתקשר לדני״." };
  return { date, time, text: cleaned, explicitTime };
}
