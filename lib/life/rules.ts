import type { LifeStore } from "./store";
import type { OpsStore } from "./ops-store";
import type { Checkin, Settings, Task } from "./types";
import type { Lead } from "@/lib/types";
import type { WeeklyReview } from "./growth-types";
import type { Insight, InsightLevel, RuleArea, RuleInfo, RulePlace } from "./rule-types";
import { RULE_AREAS } from "./rule-types";
import { ACTIVITY_TARGETS, OPEN_STAGES, type Activity, type Deal, type FinanceEntry } from "./ops-types";
import { financeSummary } from "./finance";
import { loadReviews } from "./growth";
import { learningForDate, loadLearningGoal, type LearningToday } from "./learning";
import { dueDate, getLeadsStore } from "./leads";
import { isOpenLead } from "./lead-types";
import { streak } from "./metrics";
import { addDays, cholHamoedOf, israelNow, israelToday, restDayOf, toMinutes } from "./time";

// The rules engine: what the agents would have noticed, as plain conditions on his data. Each
// rule reads the facts and either stays quiet or concludes something (an alert, a tip, or
// something good), with a concrete next step. No model calls, so it costs nothing; later, the
// same facts and conclusions are what an AI layer would be given. Notifications read only this.

export type Facts = {
  today: string;
  /** Minutes since midnight, Israel time. */
  now: number;
  settings: Settings;
  /** Today is a day off (Chol HaMoed with the setting on) or Shabbat / Yom Tov: no work rules. */
  offWork: boolean;
  checkins: Checkin[];
  byDate: Map<string, Checkin>;
  /** Working days before today since the routine started, newest first (up to 14). */
  workDays: string[];
  activity: Map<string, Activity>;
  tasks: Task[];
  leads: Lead[];
  deals: Deal[];
  finance: Awaited<ReturnType<typeof financeSummary>>;
  income21: FinanceEntry[];
  learning: LearningToday;
  reviews: WeeklyReview[];
};

export async function loadFacts(store: LifeStore, ops: OpsStore, today = israelToday(), now = toMinutes(israelNow())): Promise<Facts> {
  const [settings, checkins, activity, tasks, leads, deals, finance, entries, goal, reviews] = await Promise.all([
    store.getSettings(),
    store.listCheckins(addDays(today, -30), today),
    ops.listActivity(addDays(today, -21), today),
    store.listTasks(),
    getLeadsStore()
      .list()
      .catch(() => [] as Lead[]),
    ops.listDeals(),
    financeSummary(store, ops, today),
    ops.listFinance(addDays(today, -21), today),
    loadLearningGoal(store),
    loadReviews(store),
  ]);
  const workDays = Array.from({ length: 21 }, (_, i) => addDays(today, -(i + 1)))
    .filter((d) => !restDayOf(d) && !(settings.start_date && d < settings.start_date))
    .slice(0, 14);
  return {
    today,
    now,
    settings,
    offWork: Boolean(restDayOf(today)) || (settings.chol_hamoed_off && Boolean(cholHamoedOf(today))),
    checkins,
    byDate: new Map(checkins.map((c) => [c.date, c])),
    workDays,
    activity: new Map(activity.map((a) => [a.date, a])),
    tasks,
    leads: leads.filter(isOpenLead),
    deals,
    finance,
    income21: entries.filter((e) => e.kind === "income"),
    learning: learningForDate(goal, today),
    reviews,
  };
}

type Rule = {
  id: string;
  area: RuleArea;
  title: string;
  /** When it speaks up, in plain words (shown in settings). */
  when: string;
  places: RulePlace[];
  check: (f: Facts) => Omit<Insight, "rule" | "area"> | null;
};

const outreach = (a: Activity | undefined) => (a ? a.connections + a.followups + a.calls : 0);
const DAILY_OUTREACH = ACTIVITY_TARGETS.connections + ACTIVITY_TARGETS.followups + ACTIVITY_TARGETS.calls;
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const one = (n: number) => String(Math.round(n * 10) / 10);
const ils = (n: number) => `${Math.round(n).toLocaleString("he-IL")} ₪`;
const daysAgo = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
/** The last `n` check-ins that have a value for `pick`, newest first, within the last week. */
const recent = (f: Facts, n: number, pick: (c: Checkin) => number | null) =>
  f.checkins
    .filter((c) => c.date <= f.today && c.date > addDays(f.today, -7) && pick(c) !== null)
    .slice(-n)
    .reverse()
    .map((c) => pick(c)!);

export const RULES: Rule[] = [
  // ---- Planning ----------------------------------------------------------------------------
  {
    id: "overdue_tasks",
    area: "plan",
    title: "משימות באיחור",
    when: "3 משימות או יותר שהתאריך שלהן עבר",
    places: ["today", "morning", "assistant"],
    check: (f) => {
      const overdue = f.tasks.filter((t) => !t.done && t.due_date && t.due_date < f.today);
      if (overdue.length < 3) return null;
      return { level: "alert", text: `${overdue.length} משימות באיחור`, detail: "2 דקות לעבור עליהן: בוצע, להזיז, או למחוק. מה שנגרר סוחב איתו אנרגיה." };
    },
  },
  {
    id: "plan_tomorrow",
    area: "plan",
    title: "אין תכנון למחר",
    when: "אחרי שעת סגירת היום, כשאין עדיין משימות למחר",
    places: ["today", "assistant"],
    check: (f) => {
      const tomorrow = addDays(f.today, 1);
      if (f.now < toMinutes(f.settings.day_close_time) || restDayOf(tomorrow)) return null;
      if (f.tasks.some((t) => !t.done && t.due_date === tomorrow)) return null;
      return { level: "tip", text: "אין עדיין משימות למחר", detail: "3 משימות למחר נקבעות עכשיו, בסגירת היום. בבוקר כבר יודעים מה עושים." };
    },
  },
  {
    id: "overloaded",
    area: "plan",
    title: "יותר מדי פתוח להיום",
    when: "יותר מ־8 משימות פתוחות להיום",
    places: ["today", "assistant"],
    check: (f) => {
      const open = f.tasks.filter((t) => !t.done && (t.due_date === null || t.due_date <= f.today)).length;
      if (open <= 8) return null;
      return { level: "tip", text: `${open} משימות פתוחות`, detail: "יותר מדי בבת אחת. בוחרים 3 להיום, והשאר לתאריך אחר או למחוק." };
    },
  },
  // ---- Sales and leads ---------------------------------------------------------------------
  {
    id: "sales_gap",
    area: "business",
    title: "יומיים בלי מכירות",
    when: "שני ימי עבודה ברצף בלי שום פעילות מכירה",
    places: ["today", "morning", "assistant"],
    check: (f) => {
      if (f.offWork) return null;
      const last = f.workDays.filter((d) => !(f.settings.chol_hamoed_off && cholHamoedOf(d))).slice(0, 2);
      if (last.length < 2 || last.some((d) => outreach(f.activity.get(d)) > 0)) return null;
      return { level: "alert", text: "יומיים בלי פעילות מכירה", detail: `בלוק המכירות ראשון היום ב־${f.settings.deep_work_start}, לפני מיילים וטלפון. מתחילים מ־5 הודעות.`, href: "/life/business" };
    },
  },
  {
    id: "sales_pace",
    area: "business",
    title: "קצב המכירות השבועי",
    when: "מיום רביעי, כשהשבוע מתחת לחצי מהקצב",
    places: ["today", "assistant"],
    check: (f) => {
      const weekday = new Date(`${f.today}T12:00:00Z`).getUTCDay();
      if (f.offWork || weekday < 3 || weekday > 4) return null;
      const days = f.workDays.filter((d) => d >= addDays(f.today, -weekday));
      const done = days.reduce((s, d) => s + outreach(f.activity.get(d)), 0);
      const target = days.length * DAILY_OUTREACH;
      if (!target || done >= target / 2) return null;
      const left = 5 - weekday;
      return {
        level: "tip",
        text: `קצב המכירות השבוע: ${done} מתוך ${target}`,
        detail: `כדי להשלים את השבוע: ${Math.ceil((5 * DAILY_OUTREACH - done) / Math.max(1, left + 1))} פעולות ביום עד שישי.`,
        href: "/life/business",
      };
    },
  },
  {
    id: "stale_leads",
    area: "business",
    title: "לידים שמחכים",
    when: "ליד שמחכה לחזרה 3 ימים ומעלה",
    places: ["today", "morning", "assistant"],
    check: (f) => {
      if (f.offWork) return null;
      const stale = f.leads.filter((l) => dueDate(l) <= addDays(f.today, -3));
      if (!stale.length) return null;
      const names = stale.slice(0, 3).map((l) => l.name ?? "ליד").join(", ");
      return { level: "alert", text: stale.length === 1 ? `${names} מחכה 3 ימים ומעלה` : `${stale.length} לידים מחכים 3 ימים ומעלה`, detail: `${stale.length > 1 ? `${names}. ` : ""}ליד שמחכה מתקרר. שיחה אחת היום.`, href: "/life/business" };
    },
  },
  {
    id: "quiet_deals",
    area: "business",
    title: "עסקה בלי תזוזה",
    when: "עסקה פתוחה שלא זזה 10 ימים",
    places: ["today", "assistant"],
    check: (f) => {
      const quiet = f.deals
        .filter((d) => OPEN_STAGES.includes(d.stage) && d.updated_at.slice(0, 10) <= addDays(f.today, -10))
        .sort((a, b) => a.updated_at.localeCompare(b.updated_at));
      if (f.offWork || !quiet.length) return null;
      const d = quiet[0];
      return { level: "tip", text: `${d.name}: ${daysAgo(d.updated_at.slice(0, 10), f.today)} ימים בלי תזוזה`, detail: "הודעה קצרה: ״רציתי לבדוק איפה זה עומד אצלך״. או להוריד מהפרק.", href: "/life/business" };
    },
  },
  {
    id: "sales_hit",
    area: "business",
    title: "יעד המכירות היומי",
    when: "כשהפעילות של היום הגיעה ליעד",
    places: ["today", "assistant"],
    check: (f) => (outreach(f.activity.get(f.today)) >= DAILY_OUTREACH ? { level: "good", text: "עמדת ביעד המכירות של היום 💪" } : null),
  },
  // ---- Money -------------------------------------------------------------------------------
  {
    id: "profit_pace",
    area: "money",
    title: "קצב הרווח החודשי",
    when: "מה־10 בחודש, כשהצפי מתחת ליעד",
    places: ["today", "morning", "assistant"],
    check: (f) => {
      const g = f.finance.goal.monthly_goal;
      if (Number(f.today.slice(8, 10)) < 10 || !g || f.finance.projection >= g) return null;
      return {
        level: f.finance.projection < g / 2 ? "alert" : "tip",
        text: `צפי החודש: ${ils(f.finance.projection)} מתוך ${ils(g)}`,
        detail: `צריך ${ils(f.finance.neededPerDay)} ביום עד סוף החודש. מה העסקה הכי קרובה לסגירה?`,
        href: "/life/finance",
      };
    },
  },
  {
    id: "no_income",
    area: "money",
    title: "לא נרשמה הכנסה",
    when: "3 שבועות בלי הכנסה רשומה",
    places: ["today", "assistant"],
    check: (f) => {
      if (f.income21.length || (f.settings.start_date && f.settings.start_date > addDays(f.today, -21))) return null;
      return { level: "tip", text: "3 שבועות בלי הכנסה רשומה", detail: "נכנס כסף? כותבים ״הכנסה 1500 לקוח״ ב־+ או בטלגרם, כדי שהמספרים יהיו אמיתיים.", href: "/life/finance" };
    },
  },
  // ---- Body and sleep ----------------------------------------------------------------------
  {
    id: "short_sleep",
    area: "body",
    title: "שינה קצרה",
    when: "פחות מ־7 שעות שינה בשני הדיווחים האחרונים",
    places: ["today", "morning", "assistant"],
    check: (f) => {
      const s = recent(f, 2, (c) => (c.sleep_hours === null ? null : Number(c.sleep_hours)));
      if (s.length < 2 || s.some((h) => h >= 7)) return null;
      return { level: "alert", text: "שינה קצרה יומיים ברצף", detail: `הערב: מסכים כבויים ב־${f.settings.screens_off_time}, לישון ב־${f.settings.sleep_time}. האנרגיה של מחר נקבעת הלילה.` };
    },
  },
  {
    id: "no_workout",
    area: "body",
    title: "ימים בלי אימון",
    when: "3 ימי עבודה ברצף בלי אימון",
    places: ["today", "assistant"],
    check: (f) => {
      const last = f.workDays.slice(0, 3);
      if (f.offWork || last.length < 3 || last.some((d) => f.byDate.get(d)?.workout) || !last.some((d) => f.byDate.has(d))) return null;
      return { level: "tip", text: "3 ימים בלי אימון", detail: "גם 20 דקות הליכה נחשבות. מה הכי קטן שאפשר היום?", href: "/life/body" };
    },
  },
  {
    id: "weight_up",
    area: "body",
    title: "מגמת משקל",
    when: "הממוצע השבועי עלה בחצי קילו ומעלה מהשבוע שלפני",
    places: ["today", "assistant"],
    check: (f) => {
      const w = (from: number, to: number) =>
        f.checkins.filter((c) => c.weight !== null && c.date > addDays(f.today, -from) && c.date <= addDays(f.today, -to)).map((c) => Number(c.weight));
      const now = w(7, 0);
      const before = w(14, 7);
      if (now.length < 2 || before.length < 2) return null;
      const diff = avg(now) - avg(before);
      if (diff < 0.5) return null;
      return { level: "tip", text: `המשקל עלה ב־${one(diff)} ק״ג בשבוע`, detail: "לבדוק ערבים ונשנושים, ולחזור לתפריט מחר בבוקר.", href: "/life/body" };
    },
  },
  // ---- Spirit ------------------------------------------------------------------------------
  {
    id: "shacharit_slipping",
    area: "spirit",
    title: "שחרית מתפספסת",
    when: "שחרית התפספסה ב־2 מתוך 3 ימי העבודה האחרונים",
    places: ["today", "morning", "assistant"],
    check: (f) => {
      const last = f.workDays.slice(0, 3).map((d) => f.byDate.get(d)).filter((c) => c !== undefined);
      if (last.length < 3) return null;
      const missed = last.filter((c) => !c.shacharit).length;
      if (missed < 2) return null;
      return { level: "tip", text: `שחרית התפספסה ${missed} מתוך 3 הימים האחרונים`, detail: `קימה ב־${f.settings.wake_time}. להכין בגדים ותפילין מהערב, והטלפון רק אחרי התפילה.`, href: "/life/spirit" };
    },
  },
  {
    id: "hitbodedut_streak",
    area: "spirit",
    title: "רצף התבודדות",
    when: "5 ימים ברצף ומעלה",
    places: ["today", "assistant"],
    check: (f) => {
      const n = streak(f.byDate, f.today, (c) => c.hitbodedut);
      return n >= 5 ? { level: "good", text: `${n} ימים ברצף של התבודדות 🌙` } : null;
    },
  },
  {
    id: "learning_behind",
    area: "spirit",
    title: "לימוד בפיגור",
    when: "כשצריך יותר עמודים בשבוע ממה שמתוכנן כדי לסיים בזמן",
    places: ["today", "assistant"],
    check: (f) => {
      const l = f.learning;
      if (l.finished || l.neededPerWeek <= l.plannedPerWeek) return null;
      return { level: "tip", text: `${l.title}: הלימוד בפיגור`, detail: `צריך ${l.neededPerWeek} עמודים בשבוע כדי לסיים בזמן (מתוכנן ${l.plannedPerWeek}). אולי עוד סשן קצר בשבוע.`, href: "/life/spirit" };
    },
  },
  // ---- Mind --------------------------------------------------------------------------------
  {
    id: "phone_pattern",
    area: "mind",
    title: "הטלפון כסיבה חוזרת",
    when: "״הטלפון שאב אותי״ ב־2 מתוך 4 הסקירות האחרונות",
    places: ["today", "morning", "assistant"],
    check: (f) => {
      const last = f.reviews.slice(0, 4);
      const n = last.filter((r) => (r.fell_reasons ?? []).includes("phone")).length;
      if (n < 2) return null;
      return { level: "alert", text: `הטלפון חוזר כסיבה (${n} מתוך ${last.length} שבועות)`, detail: "בבלוק העבודה הטלפון בחדר אחר. בלילה מסכים כבויים בזמן, והטלפון נטען מחוץ לחדר." };
    },
  },
  {
    id: "low_energy",
    area: "mind",
    title: "אנרגיה נמוכה",
    when: "ממוצע אנרגיה 2 ומטה בשלושת הדיווחים האחרונים",
    places: ["today", "assistant"],
    check: (f) => {
      const e = recent(f, 3, (c) => c.energy);
      if (e.length < 3 || avg(e) > 2) return null;
      return { level: "tip", text: "האנרגיה נמוכה כבר כמה ימים", detail: "היום: משימה אחת חשובה, אוויר, ושינה מוקדמת. לא להעמיס." };
    },
  },
  {
    id: "hard_days",
    area: "mind",
    title: "ימים קשים",
    when: "דירוג יום 2 ומטה בשני הימים האחרונים",
    places: ["today", "assistant"],
    check: (f) => {
      const r = recent(f, 2, (c) => c.day_rating);
      if (r.length < 2 || r.some((x) => x > 2)) return null;
      return { level: "tip", text: "יומיים קשים", detail: "מה דבר אחד קטן שיעשה את היום טוב יותר? רק אחד. ואם צריך, לדבר עם מישהו קרוב." };
    },
  },
  {
    id: "data_gap",
    area: "mind",
    title: "חסר סיכום יום",
    when: "שני ימי עבודה ברצף בלי סיכום יום",
    places: ["today", "assistant"],
    check: (f) => {
      const last = f.workDays.slice(0, 2);
      if (last.length < 2 || last.some((d) => f.byDate.has(d))) return null;
      return { level: "tip", text: "יומיים בלי סיכום יום", detail: "30 שניות בערב. בלי נתונים אי אפשר לראות מה עובד ומה לא." };
    },
  },
];

const LEVEL_ORDER: Record<InsightLevel, number> = { alert: 0, tip: 1, good: 2 };

type RulesDoc = { off: string[] };

export async function loadRulePrefs(store: LifeStore): Promise<Set<string>> {
  return new Set((await store.getDoc<RulesDoc>("rules"))?.off ?? []);
}

export async function setRuleEnabled(store: LifeStore, id: string, enabled: boolean) {
  if (!RULES.some((r) => r.id === id)) return false;
  const off = await loadRulePrefs(store);
  if (enabled) off.delete(id);
  else off.add(id);
  await store.saveDoc<RulesDoc>("rules", { off: [...off] });
  return true;
}

export async function listRules(store: LifeStore): Promise<RuleInfo[]> {
  const off = await loadRulePrefs(store);
  return RULES.map(({ id, area, title, when, places }) => ({ id, area, title, when, places, enabled: !off.has(id) }));
}

/** Every enabled rule's conclusion for `place`, most urgent first. */
export function runRules(facts: Facts, place: RulePlace, off: Set<string> = new Set()): Insight[] {
  const out: Insight[] = [];
  for (const rule of RULES) {
    if (off.has(rule.id) || !rule.places.includes(place)) continue;
    try {
      const result = rule.check(facts);
      if (result) out.push({ ...result, rule: rule.id, area: rule.area });
    } catch (error) {
      // One broken rule must not take the others down.
      console.error("[life/rules]", rule.id, error);
    }
  }
  return out.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || RULE_AREAS.indexOf(a.area) - RULE_AREAS.indexOf(b.area));
}

export async function insightsFor(store: LifeStore, ops: OpsStore, place: RulePlace, today = israelToday(), now?: number) {
  const [facts, off] = await Promise.all([loadFacts(store, ops, today, now), loadRulePrefs(store)]);
  return runRules(facts, place, off);
}
