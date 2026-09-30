"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { LIFE_OFFLINE_DATA } from "./api";
import { addDays, israelToday } from "@/lib/life/time";
import { LIFE_PAGES } from "./LifeNav";
import { OFFLINE_WARM_KEY as WARM_KEY } from "./offline-cache";

// Offline use on the phone: saves every screen once in a while (the service worker keeps them),
// and says so when the connection is gone or a screen shows saved data.

const WARM_EVERY_MS = 6 * 3_600_000;

const weekStartOf = (date: string) => addDays(date, -new Date(`${date}T12:00:00Z`).getUTCDay());

/** The same requests the main screens make, so their data is there offline. */
function offlineData() {
  const today = israelToday();
  const week = weekStartOf(today);
  const month = today.slice(0, 7);
  const next = new Date(`${month}-01T12:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const lastDay = addDays(next.toISOString().slice(0, 10), -1);
  const range = (from: string, to: string) => `/api/life/calendar?from=${from}&to=${to}`;
  return [
    "/api/life/day",
    "/api/life/metrics",
    range(week, addDays(week, 6)),
    range(addDays(week, 7), addDays(week, 13)),
    range(weekStartOf(`${month}-01`), addDays(weekStartOf(lastDay), 6)),
    "/api/life/recurring",
    "/api/life/leads",
    "/api/life/business",
    "/api/life/shopping",
  ];
}

function warm() {
  const sw = navigator.serviceWorker?.controller;
  if (!sw || !navigator.onLine) return;
  try {
    const last = Number(localStorage.getItem(WARM_KEY) ?? 0);
    if (Date.now() - last < WARM_EVERY_MS) return;
    localStorage.setItem(WARM_KEY, String(Date.now()));
  } catch {
    // Storage blocked: warm anyway, it is only a few small pages.
  }
  sw.postMessage({ type: "LIFE_WARM", paths: LIFE_PAGES, api: offlineData() });
}

export function OfflineSupport() {
  const [online, setOnline] = useState(true);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) {
        setSavedAt(null);
        warm();
      }
    };
    const onSaved = (e: Event) => setSavedAt((e as CustomEvent<string | null>).detail);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    window.addEventListener(LIFE_OFFLINE_DATA, onSaved);
    // The first visit installs the worker; warm once it takes control.
    navigator.serviceWorker?.addEventListener("controllerchange", warm);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener(LIFE_OFFLINE_DATA, onSaved);
      navigator.serviceWorker?.removeEventListener("controllerchange", warm);
    };
  }, []);

  if (online && savedAt === null) return null;
  // savedAt: null = fresh data, "" = saved data of unknown age, otherwise when it was saved.
  const time = savedAt ? new Date(savedAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }) : null;
  const day = savedAt && new Date(savedAt).toDateString() !== new Date().toDateString() ? new Date(savedAt).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" }) : null;
  return (
    <div role="status" className="sticky top-[max(0.5rem,env(safe-area-inset-top))] z-30 mx-auto mb-3 flex w-fit items-center gap-2 rounded-full border border-amber-400/30 bg-[#1a1405]/95 px-3 py-1.5 text-xs text-amber-100 shadow-lg">
      <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        {online ? "חיבור חלש" : "אין חיבור"}
        {time ? ` · מוצג מה שנשמר ${day ? `ב־${day} ` : ""}ב־${time}` : " · אפשר לעבור בין המסכים ולראות מה שנשמר"}
      </span>
    </div>
  );
}
