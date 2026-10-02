import type { LifeStore } from "./store";
import type { OpsStore } from "./ops-store";
import type { Area, Checkin } from "./types";
import type { Activity } from "./ops-types";
import { loadBodyPlan } from "./body";
import { financeSummary } from "./finance";
import { loadLearningGoal } from "./learning";
import { getLessonsStore, pickLesson } from "./lessons";
import {
  VISION_DATE,
  goalPatchSchema,
  newGoalSchema,
  reviewSchema,
  type Goal,
  type GoalProgress,
  type GrowthSummary,
  type Insight,
  type WeeklyReview,
} from "./growth-types";
import { addDays, israelToday } from "./time";

export * from "./growth-types";

// ---------------------------------------------------------------------------------------------
// Goals ("חזון 30")

const START = "2026-10-04";

/** The Vision 30 goals agreed in chat; used until the list is first edited. */
export const DEFAULT_GOALS: Goal[] = [
  { id: "weight", title: "משקל", area: "body", metric: "weight", start: 85, target: 78, unit: "ק״ג", start_date: START, deadline: VISION_DATE },
  {
    id: "profit",
    title: "רווח חודשי",
    area: "finance",
    metric: "monthly_profit",
    start: 8000,
    target: 25000,
    unit: "₪",
    start_date: START,
    deadline: VISION_DATE,
  },
  { id: "megillah", title: "סיום מסכת מגילה", area: "spirit", metric: "learning", start: 0, target: 61, unit: "עמודים", start_date: START, deadline: VISION_DATE },
];

type GoalsDoc = { goals: Goal[] };

export async function loadGoals(store: LifeStore): Promise<Goal[]> {
  return (await store.getDoc<GoalsDoc>("goals"))?.goals ?? DEFAULT_GOALS;
}

async function saveGoals(store: LifeStore, goals: Goal[]) {
  await store.saveDoc<GoalsDoc>("goals", { goals });
}

/** Adds a goal told in chat (seeds), unless one with that id is already there. */
export async function appendGoal(store: LifeStore, goal: Goal) {
  const goals = await loadGoals(store);
  if (goals.some((g) => g.id === goal.id)) return;
  await saveGoals(store, [...goals, goal]);
}

export async function addGoal(store: LifeStore, input: unknown, today = israelToday()) {
  const parsed = newGoalSchema.parse(input);
  const goal: Goal = {
    id: crypto.randomUUID(),
    title: parsed.title,
    area: parsed.area ?? "general",
    metric: "custom",
    start: parsed.start,
    target: parsed.target,
    unit: parsed.unit,
    start_date: today,
    deadline: parsed.deadline,
    value: parsed.start,
  };
  await saveGoals(store, [...(await loadGoals(store)), goal]);
  return goal;
}

export async function updateGoal(store: LifeStore, id: string, input: unknown) {
  const patch = goalPatchSchema.parse(input);
  const goals = await loadGoals(store);
  const goal = goals.find((g) => g.id === id);
  if (!goal) return null;
  const next = { ...goal, ...patch };
  await saveGoals(store, goals.map((g) => (g.id === id ? next : g)));
  return next;
}

export async function removeGoal(store: LifeStore, id: string) {
  const goals = await loadGoals(store);
  if (!goals.some((g) => g.id === id)) return false;
  await saveGoals(store, goals.filter((g) => g.id !== id));
  return true;
}

const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
const clamp = (n: number) => Math.max(0, Math.min(100, n));

/** Next end of a calendar quarter before the deadline, or the deadline itself. */
function nextCheckpoint(today: string, deadline: string) {
  const year = Number(today.slice(0, 4));
  const quarterEnds = [0, 1].flatMap((y) => ["03-31", "06-30", "09-30", "12-31"].map((md) => `${year + y}-${md}`));
  return quarterEnds.find((d) => d > today && d < deadline) ?? deadline;
}

function progress(goal: Goal, current: number | null, today: string, currentNote?: string): GoalProgress {
  const span = goal.target - goal.start;
  const total = Math.max(1, daysBetween(goal.start_date, goal.deadline));
  const elapsed = Math.max(0, Math.min(total, daysBetween(goal.start_date, today)));
  const expectedPct = Math.round((elapsed / total) * 100);
  const pct = current === null || span === 0 ? 0 : Math.round(clamp(((current - goal.start) / span) * 100));
  const reached = current !== null && (span >= 0 ? current >= goal.target : current <= goal.target);
  const status = current === null ? "no_data" : reached ? "done" : pct >= expectedPct - 5 ? "on_track" : "behind";
  let checkpoint: GoalProgress["checkpoint"] = null;
  if (!reached && today < goal.deadline) {
    const date = nextCheckpoint(today < goal.start_date ? goal.start_date : today, goal.deadline);
    const share = Math.max(0, Math.min(1, daysBetween(goal.start_date, date) / total));
    const value = goal.start + span * share;
    checkpoint = { date, value: Math.abs(span) >= 100 ? Math.round(value / 100) * 100 : Math.round(value * 10) / 10 };
  }
  return { ...goal, current, currentNote, pct, expectedPct, status, checkpoint, daysLeft: Math.max(0, daysBetween(today, goal.deadline)) };
}

export async function goalsProgress(store: LifeStore, ops: OpsStore, today = israelToday()): Promise<GoalProgress[]> {
  const goals = await loadGoals(store);
  const [checkins, plan, learning, finance] = await Promise.all([
    store.listCheckins(addDays(today, -60), today),
    loadBodyPlan(store),
    loadLearningGoal(store),
    financeSummary(store, ops, today),
  ]);
  const lastWeight = checkins.filter((c) => c.weight !== null).at(-1)?.weight ?? null;
  // Early in the month the month-to-date profit says little: use last month's total until day 7.
  const dayOfMonth = Number(today.slice(8, 10));
  const lastMonth = dayOfMonth < 7 ? await financeSummary(store, ops, addDays(`${today.slice(0, 8)}01`, -1)) : null;

  return goals.map((goal) => {
    switch (goal.metric) {
      case "weight":
        // Start and target follow the body profile, so the two screens never disagree.
        return progress({ ...goal, start: plan.profile.start_weight, target: plan.profile.goal_weight }, lastWeight ?? plan.profile.start_weight, today);
      case "monthly_profit":
        return lastMonth
          ? progress(goal, lastMonth.profit, today, "רווח החודש הקודם")
          : progress(goal, finance.projection, today, "צפי לחודש הנוכחי");
      case "learning":
        return progress({ ...goal, target: learning.total }, learning.done, today);
      default:
        return progress(goal, goal.value ?? null, today);
    }
  });
}

// ---------------------------------------------------------------------------------------------
// Weekly review (Sunday, after Shacharit)

type ReviewsDoc = { items: WeeklyReview[] };

export function weekOf(date: string) {
  return addDays(date, -new Date(`${date}T12:00:00Z`).getUTCDay());
}

export async function loadReviews(store: LifeStore): Promise<WeeklyReview[]> {
  return (await store.getDoc<ReviewsDoc>("reviews"))?.items ?? [];
}

export async function saveReview(store: LifeStore, input: unknown, today = israelToday()) {
  const parsed = reviewSchema.parse(input);
  const week = weekOf(today);
  const review: WeeklyReview = { ...parsed, week, saved_at: new Date().toISOString() };
  const items = (await loadReviews(store)).filter((r) => r.week !== week);
  await store.saveDoc<ReviewsDoc>("reviews", { items: [review, ...items].slice(0, 52) });
  return review;
}

/** This week's focus items, for the day screen and the morning message. */
export async function weekFocus(store: LifeStore, today = israelToday()) {
  return (await loadReviews(store)).find((r) => r.week === weekOf(today))?.focus ?? [];
}

// ---------------------------------------------------------------------------------------------
// Patterns learnt from the data (plain arithmetic, no model calls)

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const fmt = (n: number) => (Math.round(n * 10) / 10).toString();
const MIN_DAYS = 3;
const WEEKDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

/** Compares a 1–5 score between two groups of days; returns an insight when the gap is real. */
function compare(yes: number[], no: number[], text: (a: string, b: string) => string, key: string, area: Area): Insight | null {
  if (yes.length < MIN_DAYS || no.length < MIN_DAYS) return null;
  const a = avg(yes);
  const b = avg(no);
  if (Math.abs(a - b) < 0.5) return null;
  return { key, text: text(fmt(a), fmt(b)), area };
}

export function computeInsights(checkins: Checkin[], activity: Activity[]): Insight[] {
  const byDate = new Map(checkins.map((c) => [c.date, c]));
  const next = (c: Checkin) => byDate.get(addDays(c.date, 1));
  const out: (Insight | null)[] = [];

  // Sleep and the same day's energy (sleep is reported for the night before).
  const slept = checkins.filter((c) => c.sleep_hours !== null && c.energy !== null);
  out.push(
    compare(
      slept.filter((c) => Number(c.sleep_hours) >= 7).map((c) => c.energy!),
      slept.filter((c) => Number(c.sleep_hours) < 7).map((c) => c.energy!),
      (a, b) => `אחרי לילה של 7 שעות שינה ומעלה האנרגיה שלך ${a} בממוצע, ואחרי פחות מזה ${b}.`,
      "sleep-energy",
      "body",
    ),
  );

  // A workout day and the next morning's mood.
  const withNext = checkins.filter((c) => next(c)?.mood != null);
  out.push(
    compare(
      withNext.filter((c) => c.workout).map((c) => next(c)!.mood!),
      withNext.filter((c) => !c.workout).map((c) => next(c)!.mood!),
      (a, b) => `בבוקר שאחרי אימון מצב הרוח שלך ${a}, ובבוקר שאחרי יום בלי אימון ${b}.`,
      "workout-mood",
      "body",
    ),
  );

  // Hitbodedut and the next morning's mood.
  out.push(
    compare(
      withNext.filter((c) => c.hitbodedut).map((c) => next(c)!.mood!),
      withNext.filter((c) => !c.hitbodedut).map((c) => next(c)!.mood!),
      (a, b) => `אחרי ערב עם התבודדות מצב הרוח בבוקר ${a}, ובלעדיה ${b}.`,
      "hitbodedut-mood",
      "spirit",
    ),
  );

  // All three prayers and how he rates the day.
  const rated = checkins.filter((c) => c.day_rating !== null);
  out.push(
    compare(
      rated.filter((c) => c.shacharit && c.mincha && c.arvit).map((c) => c.day_rating!),
      rated.filter((c) => !(c.shacharit && c.mincha && c.arvit)).map((c) => c.day_rating!),
      (a, b) => `ביום עם שלוש תפילות אתה מדרג את היום ${a}, וביום בלי ${b}.`,
      "prayers-rating",
      "spirit",
    ),
  );

  // Strongest sales weekday (Sunday to Thursday), when there is enough of a difference.
  const counts = new Map<number, number[]>();
  for (const a of activity) {
    const wd = new Date(`${a.date}T12:00:00Z`).getUTCDay();
    if (wd > 4) continue;
    counts.set(wd, [...(counts.get(wd) ?? []), a.connections + a.followups + a.calls]);
  }
  const days = [...counts.entries()].filter(([, v]) => v.length >= 2).map(([wd, v]) => ({ wd, avg: avg(v) }));
  if (days.length >= 3) {
    const overall = avg(days.map((d) => d.avg));
    const best = days.reduce((a, b) => (b.avg > a.avg ? b : a));
    const worst = days.reduce((a, b) => (b.avg < a.avg ? b : a));
    if (overall > 0 && best.avg >= overall * 1.3) {
      out.push({
        key: "sales-weekday",
        text: `יום ${WEEKDAYS[best.wd]} הוא יום המכירות החזק שלך (${Math.round(best.avg)} פניות בממוצע), ויום ${WEEKDAYS[worst.wd]} החלש (${Math.round(worst.avg)}).`,
        area: "business",
      });
    }
  }

  return out.filter((i): i is Insight => i !== null);
}

// ---------------------------------------------------------------------------------------------

export async function growthSummary(store: LifeStore, ops: OpsStore, today = israelToday()): Promise<GrowthSummary> {
  const [goals, lessons, reviews, checkins, activity] = await Promise.all([
    goalsProgress(store, ops, today),
    getLessonsStore().list(),
    loadReviews(store),
    store.listCheckins(addDays(today, -41), today),
    ops.listActivity(addDays(today, -41), today),
  ]);
  const week = weekOf(today);
  return {
    visionDate: VISION_DATE,
    daysToVision: Math.max(0, daysBetween(today, VISION_DATE)),
    goals,
    lessonOfDay: pickLesson(lessons, today),
    lessons,
    week,
    review: reviews.find((r) => r.week === week) ?? null,
    pastReviews: reviews.filter((r) => r.week !== week).slice(0, 8),
    insights: computeInsights(checkins, activity),
  };
}
