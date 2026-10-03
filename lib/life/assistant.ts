import type { LifeStore } from "./store";
import type { OpsStore } from "./ops-store";
import type { Insight } from "./rule-types";
import type { AssistantQuestion } from "./assistant-types";
import { capture } from "./capture";
import { loadCouple, occasionLabel, upcomingOccasions } from "./couple";
import { weekOf } from "./growth";
import { dueDate } from "./leads";
import { DEAL_STAGE_LABELS, OPEN_STAGES } from "./ops-types";
import { weekNumbers } from "./review";
import { loadFacts, loadRulePrefs, runRules, type Facts } from "./rules";
import { loadDay } from "./service";
import { addDays, israelNow, israelToday, restDayOf, toMinutes, weekdayName } from "./time";
import { restEndMinutes } from "./shabbat-prep";
import { streak } from "./metrics";

// The rules assistant: what the chat screens answer while the AI is off. Every answer is built
// from his data and the rules engine (the same conclusions the day screen and the morning message
// show), so it is instant and free. Free text is quick capture, like the "+" button.

const ils = (n: number) => `${Math.round(n).toLocaleString("he-IL")} ₪`;
const one = (n: number) => String(Math.round(n * 10) / 10);
const bullet = (lines: string[]) => lines.map((l) => `• ${l}`);
const mark = (i: Insight) => (i.level === "alert" ? "🟠" : i.level === "good" ? "✅" : "💡");
const insightLines = (items: Insight[]) => items.map((i) => `${mark(i)} ${i.text}${i.detail ? `\n   ${i.detail}` : ""}`);

function pickInsights(facts: Facts, off: Set<string>, areas?: Insight["area"][]) {
  return runRules(facts, "assistant", off).filter((i) => !areas || areas.includes(i.area));
}

/** Tasks worth doing on `date`: by priority, then the oldest due date; business first on workdays. */
function rankTasks(facts: Facts, date: string) {
  return facts.tasks
    .filter((t) => !t.done && (t.due_date === null || t.due_date <= date))
    .sort(
      (a, b) =>
        a.priority - b.priority ||
        (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") ||
        Number(b.area === "business") - Number(a.area === "business"),
    );
}

export async function answer(store: LifeStore, ops: OpsStore, q: AssistantQuestion, today = israelToday(), now = toMinutes(israelNow())): Promise<string> {
  const [facts, off] = await Promise.all([loadFacts(store, ops, today, now), loadRulePrefs(store)]);
  // Still resting: a rest day, unless it is already out tonight (then "now" looks at tomorrow).
  const out = Boolean(restDayOf(today)) && !restDayOf(addDays(today, 1)) && now >= (await restEndMinutes(store, today));
  const rest = out ? null : restDayOf(today);
  if (out && q === "now") return answer(store, ops, "tomorrow", today, now);

  switch (q) {
    case "now": {
      if (rest) return `${rest.name}: זמן מנוחה. המערכת חוזרת במוצאי ${rest.kind === "shabbat" ? "שבת" : "החג"}.`;
      const day = await loadDay(store, today);
      const nowHm = israelNow();
      const current = day.timeline.find((i) => i.start && i.start <= nowHm && (i.end ?? "") > nowHm);
      const next = day.timeline.find((i) => i.start && i.start > nowHm);
      const top = rankTasks(facts, today).slice(0, 3);
      const alert = pickInsights(facts, off).find((i) => i.level === "alert");
      return [
        current ? `עכשיו: ${current.title}${current.end ? ` (עד ${current.end})` : ""}` : "אין משהו קבוע ביומן כרגע.",
        ...(next ? [`הבא: ${next.start} ${next.title}`] : []),
        ...(top.length ? ["", "הכי חשוב לעשות:", ...top.map((t, i) => `${i + 1}. ${t.title}`)] : ["", "אין משימות פתוחות להיום."]),
        ...(alert ? ["", ...insightLines([alert])] : []),
      ].join("\n");
    }

    case "tomorrow": {
      const tomorrow = addDays(today, 1);
      const r = restDayOf(tomorrow);
      if (r) return `מחר ${r.name}: מנוחה. מה שלא נגמר היום עובר ליום העבודה הבא.`;
      const day = await loadDay(store, tomorrow);
      const events = day.timeline.filter((i) => i.kind === "event" && i.start);
      const planned = facts.tasks.filter((t) => !t.done && t.due_date === tomorrow);
      const suggested = rankTasks(facts, tomorrow).filter((t) => !planned.includes(t)).slice(0, Math.max(0, 3 - planned.length));
      return [
        `מחר, ${weekdayName(tomorrow)}:`,
        ...(events.length ? ["", "ביומן:", ...bullet(events.map((e) => `${e.start} ${e.title}`))] : []),
        "",
        "3 המשימות למחר:",
        ...[...planned.slice(0, 3), ...suggested].map((t, i) => `${i + 1}. ${t.title}${planned.includes(t) ? "" : " (הצעה)"}`),
        ...(planned.length + suggested.length === 0 ? ["אין משימות פתוחות. אפשר להוסיף ב־+."] : []),
        "",
        `בלוק העבודה העמוקה: ${day.settings.deep_work_start}–${day.settings.deep_work_end}. מה שדורש ריכוז הולך לשם.`,
        ...(suggested.length ? ["", "כדי לקבוע הצעה למחר: ״עוד להיום״ במסך היום ← תאריך מחר."] : []),
      ].join("\n");
    }

    case "week": {
      // The current week so far (Sunday to today).
      const n = await weekNumbers(store, ops, addDays(weekOf(today), 7));
      const rows = n.rows.map((r) => `${r.ok === null ? "•" : r.ok ? "✅" : "🟠"} ${r.label}: ${r.actual}${r.target !== "—" ? ` / ${r.target}` : ""}`);
      const insights = pickInsights(facts, off).filter((i) => i.level !== "good").slice(0, 2);
      return [
        "השבוע עד עכשיו (היעדים הם לשבוע שלם):",
        ...rows,
        ...(n.missingDays ? [`⚪️ ${n.missingDays} ימים בלי סיכום יום`] : []),
        ...(insights.length ? ["", ...insightLines(insights)] : []),
      ].join("\n");
    }

    case "stuck": {
      const overdue = facts.tasks.filter((t) => !t.done && t.due_date && t.due_date < today).sort((a, b) => a.due_date!.localeCompare(b.due_date!));
      const waiting = facts.leads.filter((l) => dueDate(l) < today);
      const quiet = facts.deals.filter((d) => OPEN_STAGES.includes(d.stage) && d.next_date && d.next_date < today);
      const lines = [
        ...(overdue.length ? [`משימות באיחור (${overdue.length}):`, ...bullet(overdue.slice(0, 4).map((t) => t.title))] : []),
        ...(waiting.length ? ["", `לידים שמחכים (${waiting.length}):`, ...bullet(waiting.slice(0, 4).map((l) => l.name ?? "ליד"))] : []),
        ...(quiet.length ? ["", "עסקאות שהצעד הבא שלהן עבר:", ...bullet(quiet.slice(0, 4).map((d) => `${d.name} (${DEAL_STAGE_LABELS[d.stage]})`))] : []),
      ];
      if (!lines.length) return "שום דבר לא תקוע כרגע. 👌";
      return [...lines, "", "הכי מהיר: לפתוח את האפליקציה מחדש, והפופ־אפ יעבור על הכל כרטיס אחרי כרטיס."].join("\n").trim();
    }

    case "followups": {
      if (facts.offWork) return "היום לא יום עבודה. הפולואפים מחכים ליום העבודה הבא.";
      const leads = facts.leads.filter((l) => dueDate(l) <= today);
      const deals = facts.deals.filter((d) => OPEN_STAGES.includes(d.stage) && d.next_date && d.next_date <= today);
      if (!leads.length && !deals.length) return "אין פולואפים להיום. זמן טוב לפנות ללידים חדשים.";
      return [
        ...(leads.length ? ["לידים:", ...bullet(leads.map((l) => `${l.name ?? "ליד"}${l.phone ? ` · ${l.phone}` : ""}${dueDate(l) < today ? " (באיחור)" : ""}`))] : []),
        ...(deals.length ? ["", "עסקאות:", ...bullet(deals.map((d) => `${d.name}${d.next_action ? `: ${d.next_action}` : ""}`))] : []),
      ].join("\n");
    }

    case "sales": {
      const ws = weekOf(today);
      const days = facts.workDays.filter((d) => d >= ws);
      const sum = (k: "connections" | "followups" | "calls" | "meetings") => [...days, today].reduce((s, d) => s + (facts.activity.get(d)?.[k] ?? 0), 0);
      const open = facts.deals.filter((d) => OPEN_STAGES.includes(d.stage));
      const insights = pickInsights(facts, off, ["business"]);
      return [
        "המכירות השבוע:",
        `• בקשות חיבור: ${sum("connections")}`,
        `• הודעות המשך: ${sum("followups")}`,
        `• שיחות: ${sum("calls")}`,
        `• פגישות שנקבעו: ${sum("meetings")}`,
        "",
        `צינור פתוח: ${open.length} עסקאות, ${ils(open.reduce((s, d) => s + (d.value ?? 0), 0))}`,
        `לידים פתוחים: ${facts.leads.length}`,
        ...(insights.length ? ["", ...insightLines(insights)] : []),
      ].join("\n");
    }

    case "money": {
      const f = facts.finance;
      const insights = pickInsights(facts, off, ["money"]);
      return [
        `רווח החודש: ${ils(f.profit)} מתוך ${ils(f.goal.monthly_goal)} (${f.pct}%)`,
        `הכנסות ${ils(f.income)} · הוצאות ${ils(f.expenses)}`,
        `צפי לסוף החודש: ${ils(f.projection)}`,
        `צריך ${ils(f.neededPerDay)} ביום ב־${f.daysLeft} הימים שנשארו.`,
        ...(insights.length ? ["", ...insightLines(insights)] : []),
      ].join("\n");
    }

    case "body": {
      const week = facts.checkins.filter((c) => c.date > addDays(today, -7));
      const sleep = week.filter((c) => c.sleep_hours !== null).map((c) => Number(c.sleep_hours));
      const weights = facts.checkins.filter((c) => c.weight !== null);
      const workouts = facts.checkins.filter((c) => c.date >= weekOf(today) && c.workout).length;
      const insights = pickInsights(facts, off, ["body"]);
      return [
        `אימונים השבוע: ${workouts} מתוך 5`,
        sleep.length ? `שינה בממוצע (7 ימים): ${one(sleep.reduce((a, b) => a + b, 0) / sleep.length)} שעות (יעד 7.5)` : "שינה: אין דיווחים השבוע",
        weights.length ? `משקל אחרון: ${weights.at(-1)!.weight} ק״ג` : "משקל: לא נשקלת לאחרונה",
        ...(insights.length ? ["", ...insightLines(insights)] : week.length ? ["", "אין משהו שדורש תשומת לב בתחום הגוף. להמשיך."] : ["", "אין עדיין נתונים השבוע. סיכום יום קצר בערב ממלא את זה."]),
      ].join("\n");
    }

    case "spirit": {
      const days = facts.workDays.filter((d) => d >= weekOf(today));
      const worked = days.map((d) => facts.byDate.get(d)).filter((c) => c !== undefined);
      const all3 = worked.filter((c) => c.shacharit && c.mincha && c.arvit).length;
      const l = facts.learning;
      const insights = pickInsights(facts, off, ["spirit"]);
      return [
        days.length ? `ימים עם 3 תפילות השבוע: ${all3} מתוך ${days.length}` : "השבוע עוד לא היו ימי עבודה למדוד.",
        `רצף התבודדות: ${streak(facts.byDate, today, (c) => c.hitbodedut)} ימים`,
        `לימוד: ${l.title} ${l.done}/${l.total}${l.next ? ` · הבא: ${l.next}` : ""}`,
        ...(insights.length ? ["", ...insightLines(insights)] : []),
      ].join("\n");
    }

    case "procrastinating": {
      const top = rankTasks(facts, today)[0];
      return [
        "בוא נוריד את זה לצעד אחד קטן:",
        "",
        `1. המשימה: ${top ? top.title : "מה שאתה דוחה"}.`,
        "2. מה הפעולה הכי קטנה שמתחילה אותה? (לפתוח את הקובץ, לחייג, לכתוב שורה אחת)",
        "3. טיימר ל־10 דקות. רק 10. אחרי זה מותר להפסיק.",
        "4. הטלפון בחדר אחר עד שהטיימר נגמר.",
        "",
        "בדרך כלל אחרי 10 דקות כבר ממשיכים. ואם לא, עשית 10 דקות יותר מכלום.",
      ].join("\n");
    }

    case "hard_day":
      return [
        "יום קשה קורה. זה לא אומר כלום על השבוע.",
        "",
        "• משהו אחד קטן שעבד היום, גם אם קטן מאוד?",
        `• הערב: בלי להשלים פערים. מסכים כבויים ב־${facts.settings.screens_off_time}, ושינה בזמן.`,
        "• מחר: משימה אחת חשובה בבוקר, והשאר בונוס.",
        "• ההתבודדות היא בדיוק המקום לשפוך את זה.",
        "",
        "אם זה כבד יותר מיום אחד, כדאי לדבר עם מישהו קרוב.",
      ].join("\n");

    case "dates": {
      const list = upcomingOccasions(await loadCouple(store), today, 60);
      if (!list.length) return "אין תאריכים מיוחדים בחודשיים הקרובים. אפשר להוסיף במסך הזוגיות.";
      return ["בחודשיים הקרובים:", ...bullet(list.map((o) => `${occasionLabel(o)}: ${o.daysLeft === 0 ? "היום" : o.daysLeft === 1 ? "מחר" : `בעוד ${o.daysLeft} ימים`}`))].join("\n");
    }

    case "couple_idea": {
      const ideas = [
        "להשאיר פתק קטן עם משפט אחד שאתה מעריך בה.",
        "לסדר את המטבח בערב בלי שתבקש.",
        "לשלוח הודעה באמצע היום: ״חושב עלייך״.",
        "להביא את הדבר הקטן שהיא אוהבת (שתייה, מאפה, פרח).",
        "לשבת 15 דקות בלי טלפונים ולשאול איך היה לה היום, ולהקשיב.",
        "לקחת על עצמך את ההשכבה הערב.",
        "להציע ערב בחוץ השבוע ולסגור בייביסיטר בעצמך.",
      ];
      const n = Math.floor(Date.parse(`${today}T12:00:00Z`) / 86_400_000) % ideas.length;
      return `רעיון להיום: ${ideas[n]}`;
    }
  }
}

/** Free text while the AI is off: quick capture (task, reminder, lead, income…). */
export async function captureText(store: LifeStore, ops: OpsStore, text: string) {
  const r = await capture(store, ops, text, true);
  if (!r) return "לא הצלחתי לרשום. נסה לנסח אחרת.";
  if ("error" in r) return r.error;
  return `✓ ${r.message}`;
}
