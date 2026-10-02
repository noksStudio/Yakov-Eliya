"use client";

/**
 * Fired on each GET: `detail` is when the data shown was saved (served offline by the service
 * worker), or null for fresh data. The offline banner listens to it.
 */
export const LIFE_OFFLINE_DATA = "life:offline-data";

/** A server error the connection screen fixes (tables not created yet, wrong Supabase key or URL). */
export class SetupError extends Error {}

/** Fetch wrapper for /api/life: JSON in and out, Hebrew errors, login redirect on 401. */
export async function lifeApi<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const method = init?.method ?? "GET";
  let res: Response;
  try {
    res = await fetch(`/api/life${path}`, {
      method,
      headers: init?.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
  } catch {
    // No connection (and nothing saved for it).
    throw new Error(method === "GET" ? "אין חיבור לאינטרנט. המסך הזה זמין רק עם חיבור." : "אין חיבור לאינטרנט, זה לא נשמר. נסה שוב כשהחיבור יחזור.");
  }
  if (method === "GET") {
    const offline = res.headers.get("X-Life-Offline") === "1";
    window.dispatchEvent(new CustomEvent(LIFE_OFFLINE_DATA, { detail: offline ? (res.headers.get("X-Life-Saved-At") ?? "") : null }));
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.replace("/admin/login?next=/life");
    throw new Error("נדרשת התחברות");
  }
  if (!res.ok) throw data.setup ? new SetupError(data.error) : new Error(data.error ?? "משהו השתבש");
  return data as T;
}
