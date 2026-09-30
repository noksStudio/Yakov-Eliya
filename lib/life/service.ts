import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { buildDay } from "./day";
import { getLifeStore, isDemoStore, LifeStoreUnavailableError, type LifeStore } from "./store";

export async function loadDay(store: LifeStore, date: string) {
  const [settings, events, tasks, checkin] = await Promise.all([
    store.getSettings(),
    store.listEvents(date),
    store.listTasks(),
    store.getCheckin(date),
  ]);
  return buildDay(date, settings, events, tasks, checkin);
}

/** Runs a life API handler with the store, mapping failures to Hebrew JSON errors. */
export async function withStore(fn: (store: LifeStore) => Promise<unknown>) {
  try {
    const result = await fn(getLifeStore());
    if (result instanceof Response) return result;
    return NextResponse.json({ ...(result as object), demo: isDemoStore() });
  } catch (error) {
    if (error instanceof LifeStoreUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
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
