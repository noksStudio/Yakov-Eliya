import type { LifeStore } from "./store";
import type { BodyProfile, Meal, MealPlan, Workout, WorkoutPlan } from "./body-types";
import { DEFAULT_BODY_PROFILE, DEFAULT_MEAL_PLAN, DEFAULT_WORKOUT_PLAN } from "./body-plan";
import { addDays, israelToday, toMinutes } from "./time";

export type BodyPlan = { profile: BodyProfile; meals: MealPlan; workouts: WorkoutPlan };

export async function loadBodyPlan(store: LifeStore): Promise<BodyPlan> {
  const [profile, meals, workouts] = await Promise.all([
    store.getDoc<BodyProfile>("body_profile"),
    store.getDoc<MealPlan>("meal_plan"),
    store.getDoc<WorkoutPlan>("workout_plan"),
  ]);
  return {
    profile: profile ?? DEFAULT_BODY_PROFILE,
    meals: meals ?? DEFAULT_MEAL_PLAN,
    workouts: workouts ?? DEFAULT_WORKOUT_PLAN,
  };
}

export function weekdayIndex(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export type BodyActivity = { time: string; title: string; minutes: number; workout: Workout | null };

export type BodyToday = {
  planStart: string;
  /** Days until the plan starts (0 once it has started). */
  daysToStart: number;
  meals: Meal[];
  shabbat: string[] | null;
  activity: BodyActivity | null;
  calories: number;
  protein: number;
};

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
}

export function bodyForDate(plan: BodyPlan, date: string): BodyToday {
  const daysToStart = Math.max(0, daysBetween(date, plan.profile.plan_start));
  const weekday = weekdayIndex(date);
  const started = daysToStart === 0;
  const slot = started ? plan.workouts.schedule.find((s) => s.day === weekday) : undefined;
  const workout = slot?.workout ? (plan.workouts.workouts.find((w) => w.key === slot.workout) ?? null) : null;
  const activity: BodyActivity | null = slot
    ? {
        time: slot.time,
        title: workout?.title ?? slot.activity ?? "פעילות",
        minutes: workout?.minutes ?? slot.minutes ?? 30,
        workout,
      }
    : null;

  return {
    planStart: plan.profile.plan_start,
    daysToStart,
    meals: started ? (plan.meals.days.find((d) => d.day === weekday)?.meals ?? []) : [],
    shabbat: started && weekday === 6 ? plan.meals.shabbat : null,
    activity,
    calories: plan.profile.calories,
    protein: plan.profile.protein,
  };
}

export type WeightPoint = { date: string; weight: number };

/** Weights from check-ins over the last `days` days, starting from the profile's first weigh-in. */
export async function weightSeries(store: LifeStore, profile: BodyProfile, days = 90): Promise<WeightPoint[]> {
  const today = israelToday();
  const from = addDays(today, -(days - 1));
  const checkins = await store.listCheckins(from < profile.start_date ? profile.start_date : from, today);
  const points = checkins.filter((c) => c.weight !== null).map((c) => ({ date: c.date, weight: Number(c.weight) }));
  if (!points.some((p) => p.date === profile.start_date) && profile.start_date >= from) {
    points.unshift({ date: profile.start_date, weight: profile.start_weight });
  }
  return points.sort((a, b) => a.date.localeCompare(b.date));
}

export function bmi(weight: number, heightCm: number) {
  const m = heightCm / 100;
  return Math.round((weight / (m * m)) * 10) / 10;
}

export function activityEnd(activity: BodyActivity) {
  return toMinutes(activity.time) + activity.minutes;
}
