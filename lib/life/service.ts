import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { buildDay } from "./day";
import { bodyForDate, loadBodyPlan } from "./body";
import { learningForDate, loadLearningGoal } from "./learning";
import { loadRecurring, recurringFor } from "./recurring";
import { weekFocus } from "./growth";
import { contextLessons } from "./lesson-context";
import { getLifeStore, isDemoStore, type LifeStore } from "./store";
import { applySeeds } from "./seeds";

export async function loadDay(store: LifeStore, date: string) {
  const [settings, events, tasks, checkin, plan, goal, recurring, focus, lessons] = await Promise.all([
    store.getSettings(),
    store.listEvents(date),
    store.listTasks(),
    store.getCheckin(date),
    loadBodyPlan(store),
    loadLearningGoal(store),
    loadRecurring(store),
    weekFocus(store, date),
    contextLessons(store, date),
  ]);
  return buildDay(
    date,
    settings,
    events,
    tasks,
    checkin,
    bodyForDate(plan, date),
    learningForDate(goal, date),
    recurringFor(recurring, date),
    focus,
    lessons,
  );
}

/** Runs a life API handler with the store, mapping failures to Hebrew JSON errors. */
export async function withStore(fn: (store: LifeStore) => Promise<unknown>) {
  try {
    const store = getLifeStore();
    // Content told in chat lands in his data on first use (a single doc read once applied).
    await applySeeds(store);
    const result = await fn(store);
    if (result instanceof Response) return result;
    return NextResponse.json({ ...(result as object), demo: isDemoStore() });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "קלט לא תקין" }, { status: 400 });
    }
    console.error("[life]", error);
    return NextResponse.json({ error: "שגיאה בשרת" }, { status: 500 });
  }
}

export function notFound() {
  return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
}

export async function readJson(request: Request) {
  return request.json().catch(() => ({}));
}
