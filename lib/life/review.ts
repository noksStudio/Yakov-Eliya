import type { LifeStore } from "./store";
import type { OpsStore } from "./ops-store";
import { FELL_REASONS, type FellReason, type ReviewContext, type WeekNumbers, type WeekRow } from "./growth-types";
import { loadReviews, reviewWeek } from "./growth";
import { ACTIVITY_TARGETS } from "./ops-types";
import { addDays, cholHamoedOf, israelToday, restDayOf } from "./time";

// The weekly review, done on Motzei Shabbat: the week in numbers against the plan (no model
// calls, plain arithmetic), last week's focus to check, and why things slipped, as a pattern.

const WORKOUTS_PER_WEEK = 5;
const SLEEP_TARGET = 7.5;
/** Reasons are counted over this many recent reviews. */
const REASON_WINDOW = 4;

/** Today is the last day of a rest period that includes Shabbat: the week ends tonight. */
export function endsWeek(date: string) {
  if (!restDayOf(date) || restDayOf(addDays(date, 1))) return false;
  let d = date;
  while (restDayOf(d)) {
    if (new Date(`${d}T12:00:00Z`).getUTCDay() === 6) return true;
    d = addDays(d, -1);
  }
  return false;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const one = (n: number) => String(Math.round(n * 10) / 10);
const ils = (n: number) => `${Math.round(n).toLocaleString("he-IL")} ₪`;

/** The week before `week` (Sunday to Saturday) against the plan. */
export async function weekNumbers(store: LifeStore, ops: OpsStore, week: string): Promise<WeekNumbers> {
  const from = addDays(week, -7);
  const to = addDays(week, -1);
  const [checkins, activity, tasks, finance, settings] = await Promise.all([
    store.listCheckins(from, to),
    ops.listActivity(from, to),
    store.listTasks(),
    ops.listFinance(from, to),
    store.getSettings(),
  ]);
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i)).filter((d) => !restDayOf(d) && !(settings.start_date && d < settings.start_date));
  // Chol HaMoed off: no sales plan on those days.
  const salesDays = days.filter((d) => !(settings.chol_hamoed_off && cholHamoedOf(d)));
  const byDate = new Map(checkins.map((c) => [c.date, c]));
  const worked = days.map((d) => byDate.get(d)).filter((c) => c !== undefined);
  const rows: WeekRow[] = [];
  const share = (n: number, of: number) => of > 0 && n / of >= 0.8;

  const outreach = activity.reduce((s, a) => s + a.connections + a.followups + a.calls, 0);
  const meetings = activity.reduce((s, a) => s + a.meetings, 0);
  const outreachTarget = (ACTIVITY_TARGETS.connections + ACTIVITY_TARGETS.followups + ACTIVITY_TARGETS.calls) * salesDays.length;
  if (salesDays.length) {
    rows.push({
      key: "sales",
      label: "פעילות מכירה",
      actual: String(outreach),
      target: String(outreachTarget),
      ok: share(outreach, outreachTarget),
      note: meetings ? `${meetings} פגישות נקבעו` : undefined,
    });
  }

  const due = tasks.filter((t) => t.due_date && t.due_date >= from && t.due_date <= to);
  if (due.length) {
    const done = due.filter((t) => t.done).length;
    rows.push({ key: "tasks", label: "משימות שתוכננו לשבוע", actual: String(done), target: String(due.length), ok: share(done, due.length) });
  }

  const workouts = checkins.filter((c) => c.workout).length;
  rows.push({ key: "workouts", label: "אימונים", actual: String(workouts), target: String(WORKOUTS_PER_WEEK), ok: workouts >= WORKOUTS_PER_WEEK });

  if (days.length) {
    const prayers = worked.filter((c) => c.shacharit && c.mincha && c.arvit).length;
    const shacharit = worked.filter((c) => c.shacharit).length;
    rows.push({
      key: "prayers",
      label: "ימים עם 3 תפילות",
      actual: String(prayers),
      target: String(days.length),
      ok: share(prayers, days.length),
      note: `שחרית ${shacharit}/${days.length}`,
    });
    const hitbodedut = worked.filter((c) => c.hitbodedut).length;
    rows.push({ key: "hitbodedut", label: "התבודדות", actual: String(hitbodedut), target: String(days.length), ok: share(hitbodedut, days.length) });
  }

  const sleep = avg(checkins.filter((c) => c.sleep_hours !== null).map((c) => Number(c.sleep_hours)));
  if (sleep !== null) rows.push({ key: "sleep", label: "שינה בממוצע", actual: `${one(sleep)} ש׳`, target: `${SLEEP_TARGET} ש׳`, ok: sleep >= SLEEP_TARGET });

  const rating = avg(checkins.filter((c) => c.day_rating !== null).map((c) => c.day_rating!));
  if (rating !== null) rows.push({ key: "rating", label: "דירוג הימים", actual: `${one(rating)}/5`, target: "—", ok: null });

  const weights = checkins.filter((c) => c.weight !== null).map((c) => Number(c.weight));
  if (weights.length >= 2) {
    const change = weights.at(-1)! - weights[0];
    rows.push({ key: "weight", label: "משקל", actual: `${change > 0 ? "+" : ""}${one(change)} ק״ג`, target: "ירידה", ok: change <= 0, note: `${one(weights.at(-1)!)} ק״ג` });
  }

  const income = finance.filter((f) => f.kind === "income" && f.scope === "business").reduce((s, f) => s + f.amount, 0);
  rows.push({ key: "income", label: "הכנסות לעסק", actual: ils(income), target: "—", ok: null });

  return { from, to, workDays: days.length, missingDays: days.filter((d) => !byDate.has(d)).length, rows };
}

/** Everything the review screen shows next to the form. */
export async function reviewContext(store: LifeStore, ops: OpsStore, today = israelToday()): Promise<ReviewContext> {
  const week = reviewWeek(today);
  const [numbers, reviews] = await Promise.all([weekNumbers(store, ops, week), loadReviews(store)]);
  const recent = reviews.filter((r) => r.week < week).slice(0, REASON_WINDOW);
  const counts = new Map<FellReason, number>();
  for (const r of recent) for (const k of r.fell_reasons ?? []) counts.set(k, (counts.get(k) ?? 0) + 1);
  return {
    week,
    numbers,
    lastFocus: reviews.find((r) => r.week === addDays(week, -7))?.focus ?? [],
    reasons: FELL_REASONS.filter((r) => counts.has(r.key))
      .map((r) => ({ key: r.key, count: counts.get(r.key)!, of: recent.length }))
      .sort((a, b) => b.count - a.count),
  };
}

/** Whether this week's review is still open (for the popup and the reminder). */
export async function reviewOpen(store: LifeStore, today = israelToday()) {
  const week = reviewWeek(today);
  return !(await loadReviews(store)).some((r) => r.week === week);
}
