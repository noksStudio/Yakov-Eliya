"use client";

/** Fetch wrapper for /api/life: JSON in and out, Hebrew errors, login redirect on 401. */
export async function lifeApi<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`/api/life${path}`, {
    method: init?.method ?? "GET",
    headers: init?.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.replace("/admin/login?next=/life");
    throw new Error("נדרשת התחברות");
  }
  if (!res.ok) throw new Error(data.error ?? "משהו השתבש");
  return data as T;
}
