import { NextResponse } from "next/server";
import { upcomingTimes } from "./shabbat-prep";
import { addDays, restDayOf } from "./time";
import { loadReminders } from "./reminders";
import { dueDate, dueLeads, getLeadsStore } from "./leads";
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
  const day = buildDay(
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
  if (!day.restDay && restDayOf(addDays(date, 1))) {
    const { prefs, city, eve, times } = await upcomingTimes(store, date);
    if (city && times && eve === date) {
      day.shabbat = { title: times.title, city: city.name, candles: times.candles, end: times.end, endRabbeinuTam: times.endRabbeinuTam, checklist: prefs.checklist };
    }
  }
  day.reminders = (await loadReminders(store)).filter((r) => r.date === date).map(({ id, time, text, sent }) => ({ id, time, text, sent }));
  // Work waits on a day off; a missing leads table (site SQL not run yet) just means none.
  if (!day.dayOff && !day.restDay) {
    const leads = await getLeadsStore()
      .list()
      .catch(() => []);
    day.dueLeads = dueLeads(leads, date).map((l) => ({ id: l.id, name: l.name ?? "ליד", business_type: l.business_type, phone: l.phone, due: dueDate(l) }));
  }
  return day;
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
