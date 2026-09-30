import type { LifeStore } from "./store";
import type { OpsStore } from "./ops-store";
import type { Area, RestDay } from "./types";
import { activityEnd, bodyForDate, loadBodyPlan } from "./body";
import { learningForDate, loadLearningGoal } from "./learning";
import { OPEN_STAGES } from "./ops-types";
import { loadRecurring, recurringFor } from "./recurring";
import { loadCouple, occasionLabel, upcomingOccasions } from "./couple";
import { addDays, fromMinutes, hebrewDayMonth, israelToday, restDayOf } from "./time";

// The week and month views: only what changes from day to day (events, weekly commitments,
// workouts, learning, dated tasks and deal follow-ups). The fixed anchors live in the day view.

export const MAX_RANGE_DAYS = 42;

export type CalItemKind = "event" | "recurring" | "workout" | "learning" | "task" | "followup" | "occasion";

export type CalItem = {
  key: string;
  kind: CalItemKind;
  time: string | null;
  end: string | null;
  title: string;
  note?: string;
  area: Area;
  /** Event or task id, for delete / done. */
  id?: string;
  done?: boolean;
  /** Prep tasks linked to an event (clothes, gift, invitations). */
  prep?: { done: number; total: number };
};

export type CalDay = {
  date: string;
  weekday: number;
  day: number;
  hebrewDay: string;
  hebrewMonth: string;
  /** True on the first day of a Hebrew month, so cells can print the month name there. */
  hebrewMonthStart: boolean;
  rest: RestDay | null;
  items: CalItem[];
};

export type CalSummary = {
  workoutsDone: number;
  workoutsPlanned: number;
  prayersDone: number;
  prayersPossible: number;
  /** Business profit (income minus business expenses) in the range. */
  profit: number;
  events: number;
};

export function weekStart(date: string) {
  return addDays(date, -new Date(`${date}T12:00:00Z`).getUTCDay());
}

export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
}

function byTime(a: CalItem, b: CalItem) {
  if (a.time === b.time) return 0;
  if (a.time === null) return 1;
  if (b.time === null) return -1;
  return a.time.localeCompare(b.time);
}

export async function calendarRange(store: LifeStore, ops: OpsStore, from: string, to: string, today = israelToday()) {
  const [events, recurring, tasks, plan, goal, deals, checkins, finance, couple] = await Promise.all([
    store.listEventsRange(from, to),
    loadRecurring(store),
    store.listTasks(),
    loadBodyPlan(store),
    loadLearningGoal(store),
    ops.listDeals(),
    store.listCheckins(from, to),
    ops.listFinance(from, to),
    loadCouple(store),
  ]);
  const occasions = upcomingOccasions(couple, from, daysBetween(from, to));
  const prepTasks = await store.listEventTasks(events.map((e) => e.id));
  const checkinByDate = new Map(checkins.map((c) => [c.date, c]));
  const openDeals = deals.filter((d) => OPEN_STAGES.includes(d.stage) && d.next_date);
  const summary: CalSummary = { workoutsDone: 0, workoutsPlanned: 0, prayersDone: 0, prayersPossible: 0, profit: 0, events: 0 };

  const days: CalDay[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    const rest = restDayOf(date);
    const checkin = checkinByDate.get(date);
    const items: CalItem[] = [];

    for (const e of events.filter((ev) => ev.date === date)) {
      const prep = prepTasks.filter((t) => t.event_id === e.id);
      items.push({
        key: `event-${e.id}`,
        kind: "event",
        id: e.id,
        time: e.start_time,
        end: e.end_time,
        title: e.title,
        area: e.area,
        ...(prep.length ? { prep: { done: prep.filter((t) => t.done).length, total: prep.length } } : {}),
      });
    }
    for (const r of recurringFor(recurring, date)) {
      items.push({ key: `rec-${r.id}-${date}`, kind: "recurring", time: r.start_time, end: r.end_time, title: r.title, area: r.area });
    }
    const activity = rest ? null : bodyForDate(plan, date).activity;
    if (activity) {
      items.push({
        key: `workout-${date}`,
        kind: "workout",
        time: activity.time,
        end: fromMinutes(activityEnd(activity)),
        title: activity.title,
        area: "body",
        done: checkin?.workout ?? false,
      });
    }
    const learning = rest ? null : learningForDate(goal, date);
    if (learning?.session) {
      items.push({
        key: `learning-${date}`,
        kind: "learning",
        time: learning.session.start,
        end: learning.session.end,
        title: `לימוד: ${learning.title}`,
        area: "spirit",
      });
    }
    for (const t of tasks.filter((task) => task.due_date === date)) {
      items.push({ key: `task-${t.id}`, kind: "task", id: t.id, time: t.scheduled_time, end: null, title: t.title, area: t.area, done: t.done });
    }
    for (const d of openDeals.filter((deal) => deal.next_date === date)) {
      items.push({
        key: `deal-${d.id}`,
        kind: "followup",
        time: null,
        end: null,
        title: `פולואפ: ${d.name}`,
        note: d.next_action ?? undefined,
        area: "business",
      });
    }
    for (const o of occasions.filter((occ) => occ.date === date)) {
      items.push({ key: `occasion-${o.key}-${date}`, kind: "occasion", time: null, end: null, title: occasionLabel(o), area: "couple" });
    }
    items.sort(byTime);

    if (!rest) {
      if (activity) summary.workoutsPlanned++;
      if (date <= today) summary.prayersPossible += 3;
    }
    if (checkin?.workout) summary.workoutsDone++;
    if (checkin) summary.prayersDone += [checkin.shacharit, checkin.mincha, checkin.arvit].filter(Boolean).length;
    summary.events += items.filter((i) => i.kind === "event" || i.kind === "recurring").length;

    const hebrew = hebrewDayMonth(date);
    days.push({
      date,
      weekday: new Date(`${date}T12:00:00Z`).getUTCDay(),
      day: Number(date.slice(8, 10)),
      hebrewDay: hebrew.day,
      hebrewMonth: hebrew.month,
      hebrewMonthStart: hebrew.dayNumber === 1,
      rest,
      items,
    });
  }

  summary.profit = finance
    .filter((e) => e.scope === "business")
    .reduce((s, e) => s + (e.kind === "income" ? e.amount : -e.amount), 0);

  return { from, to, today, days, summary };
}

export type CalendarRange = Awaited<ReturnType<typeof calendarRange>>;
