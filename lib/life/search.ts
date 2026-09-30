import type { LifeStore } from "./store";
import type { OpsStore } from "./ops-store";
import { loadCouple, occasionLabel, upcomingOccasions } from "./couple";
import { loadGoals, loadReviews } from "./growth";
import { getIdeasStore, IDEA_STATUS_LABELS } from "./ideas";
import { getLessonsStore } from "./lessons";
import { DEAL_STAGE_LABELS } from "./ops-types";
import { loadRecurring, WEEKDAY_LABELS } from "./recurring";
import { loadReminders } from "./reminders";
import { matchScore, normalize, searchPages, type SearchKind, type SearchResult } from "./search-index";
import { addDays, gregorianLabel, hebrewDateLabel, israelToday, weekdayName } from "./time";

// Search across everything he has written: tasks, events, commitments, reminders, family dates,
// ideas, lessons, goals, deals, gifts, the shopping list, recent money entries and weekly reviews.
// Dates typed as text ("12.10", "מחר", "מרץ") become a jump to that day or month.

const MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
const shortDate = (d: string) => `${Number(d.slice(8, 10))}.${Number(d.slice(5, 7))}`;
const dayTitle = (d: string) => `${weekdayName(d)}, ${gregorianLabel(d)}`;

function dateResults(query: string, today: string): SearchResult[] {
  const q = normalize(query);
  const out: SearchResult[] = [];
  const day = (date: string, score: number) =>
    out.push({ key: `day-${date}`, kind: "day", title: dayTitle(date), subtitle: `${hebrewDateLabel(date)} · לו״ז השבוע`, href: `/life?v=week&date=${date}`, score });

  const rel: Record<string, number> = { היומ: 0, מחר: 1, מחרתיימ: 2, אתמול: -1 };
  if (q in rel) day(addDays(today, rel[q]), 95);

  const dm = query.trim().match(/^(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?$/);
  if (dm) {
    const d = Number(dm[1]);
    const m = Number(dm[2]);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      const y = dm[3] ? Number(dm[3].length === 2 ? `20${dm[3]}` : dm[3]) : Number(today.slice(0, 4));
      const date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      // Without a year, a date already past this year most likely means next year.
      day(!dm[3] && date < addDays(today, -60) ? `${y + 1}${date.slice(4)}` : date, 95);
    }
  }

  const monthIndex = MONTHS.findIndex((m) => normalize(m) === q);
  if (monthIndex >= 0) {
    const year = Number(today.slice(0, 4)) + (monthIndex + 1 < Number(today.slice(5, 7)) ? 1 : 0);
    const first = `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;
    out.push({ key: `month-${first}`, kind: "day", title: `${MONTHS[monthIndex]} ${year}`, subtitle: "לו״ז חודשי", href: `/life?v=month&date=${first}`, score: 95 });
  }
  return out;
}

export async function searchAll(store: LifeStore, ops: OpsStore, query: string, today = israelToday()): Promise<SearchResult[]> {
  const q = query.trim();
  if (normalize(q).length < 2 && !/^\d/.test(q)) return [];

  const [tasks, events, recurring, reminders, couple, ideas, lessons, goals, deals, shopping, finance, reviews] = await Promise.all([
    store.listTasks(),
    store.listEventsRange(addDays(today, -60), addDays(today, 365)),
    loadRecurring(store),
    loadReminders(store),
    loadCouple(store),
    getIdeasStore().list(),
    getLessonsStore().list(),
    loadGoals(store),
    ops.listDeals(),
    store.listShopping(),
    ops.listFinance(addDays(today, -120), today),
    loadReviews(store),
  ]);

  const results: SearchResult[] = [...searchPages(q), ...dateResults(q, today)];
  const add = (kind: SearchKind, key: string, title: string, extra: string, subtitle: string | undefined, href: string) => {
    const score = matchScore(q, title, extra);
    if (score) results.push({ key: `${kind}-${key}`, kind, title, subtitle, href, score });
  };

  for (const t of tasks) {
    add("task", t.id, t.title, "משימה", t.due_date ? `${t.done ? "בוצעה · " : ""}${dayTitle(t.due_date)}` : t.done ? "בוצעה" : "משימה פתוחה", t.due_date ? `/life?v=week&date=${t.due_date}` : "/life");
  }
  for (const e of events) {
    add("event", e.id, e.title, "אירוע", `${dayTitle(e.date)} · ${e.start_time}`, `/life?v=week&date=${e.date}`);
  }
  for (const r of recurring) {
    add("recurring", r.id, r.title, "קבוע שבועי", `כל יום ${WEEKDAY_LABELS[r.weekday]} ב־${r.start_time}`, "/life?v=week");
  }
  for (const r of reminders.filter((x) => !x.sent)) {
    add("reminder", r.id, r.text, "תזכורת", `${dayTitle(r.date)} · ${r.time}`, `/life?v=week&date=${r.date}`);
  }
  for (const o of upcomingOccasions(couple, today)) {
    const words = o.kind === "anniversary" ? "יום נישואין" : o.kind === "birthday" || o.age ? "יום הולדת" : "תאריך";
    add(
      "occasion",
      o.key,
      occasionLabel(o),
      words,
      `${dayTitle(o.date)} · ${o.daysLeft === 0 ? "היום" : o.daysLeft === 1 ? "מחר" : `עוד ${o.daysLeft} ימים`}`,
      `/life?v=month&date=${o.date}`,
    );
  }
  for (const i of ideas) {
    add("idea", i.id, i.title, `רעיון ${i.notes} ${i.steps.map((s) => s.text).join(" ")}`, `${IDEA_STATUS_LABELS[i.status]}${i.steps.length ? ` · ${i.steps.filter((s) => s.done).length}/${i.steps.length} צעדים` : ""}`, `/life/ideas/${i.id}`);
  }
  for (const l of lessons) {
    add("lesson", l.id, l.rule, `לקח ${l.story ?? ""} ${l.source_name ?? ""}`, l.source === "others" ? `מ${l.source_name ?? "אחרים"}` : "טעות שלי", "/life/growth?tab=lessons");
  }
  for (const g of goals) {
    add("goal", g.id, g.title, "יעד חזון 30", `יעד ${g.target.toLocaleString("he-IL")} ${g.unit} עד ${shortDate(g.deadline)}`, "/life/growth");
  }
  for (const d of deals) {
    add("deal", d.id, d.name, `עסקה ${d.contact ?? ""} ${d.notes ?? ""} ${d.next_action ?? ""}`, `${DEAL_STAGE_LABELS[d.stage]}${d.value ? ` · ${d.value.toLocaleString("he-IL")} ₪` : ""}`, "/life/business");
  }
  for (const g of couple.gifts) {
    add("gift", g.id, g.title, `מתנה ${g.occasion ?? ""}`, [g.occasion, g.price ? `כ־${g.price.toLocaleString("he-IL")} ₪` : null].filter(Boolean).join(" · ") || "רעיון למתנה", "/life/couple");
  }
  for (const s of shopping) {
    add("shopping", s.id, s.title, "קניות", `${s.checked ? "נקנה" : "ברשימה"}${s.qty ? ` · ${s.qty}` : ""}`, "/life/shopping");
  }
  for (const f of finance) {
    const title = f.note ? `${f.category}: ${f.note}` : f.category;
    add("finance", f.id, title, f.kind === "income" ? "הכנסה" : "הוצאה", `${f.kind === "income" ? "הכנסה" : "הוצאה"} ${Math.round(f.amount).toLocaleString("he-IL")} ₪ · ${shortDate(f.date)}`, "/life/finance");
  }
  for (const r of reviews) {
    add("review", r.week, `השבוע של ${shortDate(r.week)}`, `סקירה ${r.went_well} ${r.went_badly} ${r.lesson} ${r.focus.join(" ")}`, r.lesson || r.focus.join(" · ") || undefined, "/life/growth?tab=review");
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 40);
}
