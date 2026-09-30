import type { LifeStore } from "./store";
import type { OpsStore } from "./ops-store";
import type { Checkin } from "./types";
import { loadBodyPlan } from "./body";
import { businessSummary } from "./business";
import { financeSummary } from "./finance";
import { learningForDate, loadLearningGoal } from "./learning";
import { addDays, israelToday, restDayOf } from "./time";

// One place for every goal: each metric reports where it stands against its target, whether it
// is due for an update today, a streak where that means something, and a short series for charts.

export type MetricStatus = "good" | "behind" | "due" | "neutral";

export type Metric = {
  key: string;
  label: string;
  value: string;
  target: string;
  status: MetricStatus;
  note?: string;
  streak?: number;
  series?: { date: string; value: number }[];
  href: string;
  owner: string;
};

const fmt = (n: number) => Math.round(n).toLocaleString("he-IL");
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Consecutive days (up to today) meeting `ok`, skipping Shabbat/Yom Tov. Today counts only once met. */
export function streak(byDate: Map<string, Checkin>, today: string, ok: (c: Checkin) => boolean) {
  let count = 0;
  let date = today;
  if (!byDate.get(today) || !ok(byDate.get(today)!)) date = addDays(today, -1);
  for (let i = 0; i < 60; i++) {
    if (restDayOf(date)) {
      date = addDays(date, -1);
      continue;
    }
    const c = byDate.get(date);
    if (!c || !ok(c)) break;
    count++;
    date = addDays(date, -1);
  }
  return count;
}

function weekStart(date: string) {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return addDays(date, -weekday);
}

export async function computeMetrics(store: LifeStore, ops: OpsStore, today = israelToday()): Promise<Metric[]> {
  const from = addDays(today, -29);
  const [checkins, plan, goal, finance, business, activity] = await Promise.all([
    store.listCheckins(from, today),
    loadBodyPlan(store),
    loadLearningGoal(store),
    financeSummary(store, ops, today),
    businessSummary(ops, today),
    ops.listActivity(addDays(today, -6), today),
  ]);
  const byDate = new Map(checkins.map((c) => [c.date, c]));
  const todayCheckin = byDate.get(today);
  const isRest = Boolean(restDayOf(today));
  const metrics: Metric[] = [];

  // Weight: weigh in every morning, judge by the 7-day average.
  const weights = checkins.filter((c) => c.weight !== null).map((c) => ({ date: c.date, value: Number(c.weight) }));
  const latest = weights.at(-1)?.value ?? plan.profile.start_weight;
  const weekAvg = avg(weights.filter((w) => w.date > addDays(today, -7)).map((w) => w.value));
  const change = Math.round((latest - plan.profile.start_weight) * 10) / 10;
  metrics.push({
    key: "weight",
    label: "משקל",
    value: `${latest} ק״ג`,
    target: `${plan.profile.goal_weight} ק״ג`,
    status: !todayCheckin?.weight && !isRest ? "due" : change < 0 ? "good" : "neutral",
    note: `${weekAvg ? `ממוצע שבועי ${Math.round(weekAvg * 10) / 10} · ` : ""}${change > 0 ? "+" : ""}${change} מההתחלה${
      !todayCheckin?.weight && !isRest ? " · לא נשקלת היום" : ""
    }`,
    series: weights,
    href: "/life/body",
    owner: "מאמן הגוף",
  });

  // Profit: month to date against the monthly goal.
  const onTrackProfit = finance.projection >= finance.goal.monthly_goal;
  metrics.push({
    key: "profit",
    label: "רווח החודש",
    value: `${fmt(finance.profit)} ₪`,
    target: `${fmt(finance.goal.monthly_goal)} ₪`,
    status: finance.profit >= finance.goal.monthly_goal ? "good" : onTrackProfit ? "good" : "behind",
    note: `צריך ${fmt(finance.neededPerDay)} ₪ ביום · צפי לסוף החודש ${fmt(finance.projection)} ₪`,
    series: finance.cumulative,
    href: "/life/finance",
    owner: "מנהל הכספים",
  });

  // Sales outreach: today's count against the daily plan.
  const weekOutreach = activity.reduce((s, a) => s + a.connections + a.followups + a.calls, 0);
  metrics.push({
    key: "sales",
    label: "פעילות מכירה היום",
    value: `${business.activityDone}`,
    target: `${business.activityTarget}`,
    status: isRest ? "neutral" : business.activityDone >= business.activityTarget ? "good" : "due",
    note: `${weekOutreach} ב־7 הימים האחרונים · ${business.openCount} עסקאות פתוחות (${fmt(business.openValue)} ₪)`,
    series: activity.map((a) => ({ date: a.date, value: a.connections + a.followups + a.calls })),
    href: "/life/business",
    owner: "מנהל העסק",
  });

  // Workouts this week (Sunday to today) against 3 gym sessions + 2 walks/runs.
  const ws = weekStart(today);
  const workoutsThisWeek = checkins.filter((c) => c.date >= ws && c.workout).length;
  metrics.push({
    key: "workouts",
    label: "אימונים השבוע",
    value: `${workoutsThisWeek}`,
    target: "5",
    status: workoutsThisWeek >= 5 ? "good" : "neutral",
    note: "3 חדר כושר ו־2 הליכות או ריצות",
    streak: streak(byDate, today, (c) => c.workout),
    href: "/life/body",
    owner: "מאמן הגוף",
  });

  // Prayers today and the streak of days with all three.
  const prayed = todayCheckin ? [todayCheckin.shacharit, todayCheckin.mincha, todayCheckin.arvit].filter(Boolean).length : 0;
  metrics.push({
    key: "prayers",
    label: "תפילות היום",
    value: `${prayed}/3`,
    target: "3/3",
    status: isRest ? "neutral" : prayed === 3 ? "good" : "due",
    streak: streak(byDate, today, (c) => c.shacharit && c.mincha && c.arvit),
    note: "רצף ימים עם שלוש תפילות",
    href: "/life/spirit",
    owner: "המלווה הרוחני",
  });

  metrics.push({
    key: "hitbodedut",
    label: "התבודדות",
    value: todayCheckin?.hitbodedut ? "בוצע" : "עוד לא",
    target: "שעה בלילה",
    status: isRest ? "neutral" : todayCheckin?.hitbodedut ? "good" : "neutral",
    streak: streak(byDate, today, (c) => c.hitbodedut),
    note: "רצף ימים",
    href: "/life/spirit",
    owner: "המלווה הרוחני",
  });

  // Learning: amudim done against the deadline pace.
  const learning = learningForDate(goal, today);
  metrics.push({
    key: "learning",
    label: `לימוד: ${learning.title}`,
    value: `${learning.done}/${learning.total}`,
    target: `עד ${learning.deadline.split("-").reverse().join(".")}`,
    status: learning.finished || learning.neededPerWeek <= learning.plannedPerWeek ? "good" : "behind",
    note: learning.finished ? "המסכת הושלמה" : `הבא: ${learning.next} · צריך ${learning.neededPerWeek} עמודים בשבוע`,
    href: "/life/spirit",
    owner: "המלווה הרוחני",
  });

  // Sleep: last night and the 7-day average against 7.5 hours.
  const sleeps = checkins.filter((c) => c.sleep_hours !== null).map((c) => ({ date: c.date, value: Number(c.sleep_hours) }));
  const sleepAvg = avg(sleeps.filter((s) => s.date > addDays(today, -7)).map((s) => s.value));
  metrics.push({
    key: "sleep",
    label: "שינה",
    value: todayCheckin?.sleep_hours ? `${todayCheckin.sleep_hours} ש׳` : "—",
    target: "7.5 ש׳",
    status: !todayCheckin?.sleep_hours && !isRest ? "due" : (sleepAvg ?? 0) >= 7.5 ? "good" : "neutral",
    note: sleepAvg ? `ממוצע שבועי ${Math.round(sleepAvg * 10) / 10} ש׳` : "מעדכנים בצ׳ק־אין בוקר",
    series: sleeps,
    href: "/life",
    owner: "מאמן הגוף",
  });

  return metrics;
}
