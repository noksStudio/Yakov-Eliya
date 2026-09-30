import { z } from "zod";
import "./schemas";
import type { LifeStore } from "./store";
import { DATE_RE, TIME_RE, fromMinutes, hebrewNumeral, toMinutes } from "./time";

// A learning goal with a deadline, counted in amudim (Talmud pages, one side each). The first goal:
// finish Masechet Megillah (2a–32a, 61 amudim) by Yakov's birthday, 10.3.2027 — three sessions a
// week of one amud, which ends around late February and leaves a buffer.

export const learningGoalSchema = z.object({
  title: z.string().min(1).max(60),
  /** Number of amudim in the masechet. */
  total: z.number().int().min(1).max(400),
  /** First daf of the masechet (Talmud tractates start at daf 2). */
  firstDaf: z.number().int().min(1).max(200),
  done: z.number().int().min(0).max(400),
  start_date: z.string().regex(DATE_RE),
  deadline: z.string().regex(DATE_RE),
  /** Session weekdays, 0 = Sunday … 5 = Friday. */
  days: z.array(z.number().int().min(0).max(5)).min(1).max(6),
  time: z.string().regex(TIME_RE),
  minutes: z.number().int().min(10).max(180),
});
export type LearningGoal = z.infer<typeof learningGoalSchema>;

export const DEFAULT_LEARNING_GOAL: LearningGoal = {
  title: "מסכת מגילה",
  total: 61,
  firstDaf: 2,
  done: 0,
  start_date: "2026-10-04",
  deadline: "2027-03-10",
  days: [0, 2, 4],
  time: "08:30",
  minutes: 30,
};

export async function loadLearningGoal(store: LifeStore): Promise<LearningGoal> {
  return (await store.getDoc<LearningGoal>("learning_goal")) ?? DEFAULT_LEARNING_GOAL;
}

/** "דף ה׳ עמוד א׳" for a 0-based amud index. */
export function amudLabel(goal: LearningGoal, index: number) {
  const daf = goal.firstDaf + Math.floor(index / 2);
  return `דף ${hebrewNumeral(daf)} עמוד ${index % 2 ? "ב׳" : "א׳"}`;
}

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
}

export type LearningToday = {
  title: string;
  done: number;
  total: number;
  deadline: string;
  finished: boolean;
  next: string | null;
  /** Amudim still needed per week to finish on time, and what the schedule gives. */
  neededPerWeek: number;
  plannedPerWeek: number;
  daysLeft: number;
  session: { start: string; end: string } | null;
};

export function learningForDate(goal: LearningGoal, date: string): LearningToday {
  const finished = goal.done >= goal.total;
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const daysLeft = Math.max(0, daysBetween(date, goal.deadline));
  const remaining = Math.max(0, goal.total - goal.done);
  const session =
    !finished && date >= goal.start_date && date <= goal.deadline && goal.days.includes(weekday)
      ? { start: goal.time, end: fromMinutes(toMinutes(goal.time) + goal.minutes) }
      : null;
  return {
    title: goal.title,
    done: goal.done,
    total: goal.total,
    deadline: goal.deadline,
    finished,
    next: finished ? null : amudLabel(goal, goal.done),
    neededPerWeek: daysLeft ? Math.round((remaining / (daysLeft / 7)) * 10) / 10 : remaining,
    plannedPerWeek: goal.days.length,
    daysLeft,
    session,
  };
}
