import type { LifeStore } from "./store";
import type { Settings } from "./types";
import { israelToUtc } from "./ics";
import { addDays, fromMinutes, israelNow, israelToday, toMinutes } from "./time";

// Sleep, without filling anything in: "הולך לישון" at night and "קמתי" in the morning (in the app
// or from the Telegram buttons) give the night's hours, which go straight into the check-in.
// Bedtime is the wake-up time minus the sleep target, and the wind-down half an hour before.

export type Night = { date: string; asleep_at: string; woke_at: string; hours: number };
type SleepDoc = { asleep_at: string | null; nights: Night[] };

const KEEP_NIGHTS = 60;
/** Longer than this between the two taps means a tap was missed, not a real night. */
const MAX_HOURS = 14;

/** Bedtime (settings.sleep_time), the wind-down before it, and the sleep target they imply. */
export function sleepPlan(settings: Settings) {
  const target = ((toMinutes(settings.wake_time) - toMinutes(settings.sleep_time) + 1440) % 1440) / 60;
  return { bedtime: settings.sleep_time, windDown: settings.screens_off_time, wake: settings.wake_time, targetHours: target };
}

const hm = (iso: string) => new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));

export async function loadSleep(store: LifeStore): Promise<SleepDoc> {
  return { asleep_at: null, nights: [], ...((await store.getDoc<Partial<SleepDoc>>("sleep")) ?? {}) };
}

export async function goToSleep(store: LifeStore, at = new Date()) {
  const doc = await loadSleep(store);
  await store.saveDoc<SleepDoc>("sleep", { ...doc, asleep_at: at.toISOString() });
  return { asleep_at: at.toISOString(), time: hm(at.toISOString()) };
}

/**
 * The night is over: its hours go into that morning's check-in. `at` is when he woke (a time
 * picked from the morning question, or now).
 */
export async function wakeUp(
  store: LifeStore,
  at = new Date(),
  /** When "הולך לישון" was not tapped: the bedtime he picks in the morning ("23:30"). */
  sleptAt?: string,
): Promise<{ hours: number; date: string; time: string } | { error: string }> {
  const loaded = await loadSleep(store);
  const doc = loaded.asleep_at || !sleptAt ? loaded : { ...loaded, asleep_at: lastNightAt(sleptAt, at).toISOString() };
  if (!doc.asleep_at) return { error: "לא נרשם מתי הלכת לישון. אפשר לכתוב את שעות השינה בסיכום הבוקר." };
  const hours = Math.round(((at.getTime() - Date.parse(doc.asleep_at)) / 3_600_000) * 4) / 4;
  if (hours <= 0 || hours > MAX_HOURS) {
    await store.saveDoc<SleepDoc>("sleep", { ...doc, asleep_at: null });
    return { error: "נראה שלחיצה התפספסה (הזמנים לא מסתדרים). אפשר לכתוב את שעות השינה בסיכום הבוקר." };
  }
  const date = israelToday(at);
  await store.saveCheckin(date, { sleep_hours: hours });
  const night: Night = { date, asleep_at: doc.asleep_at, woke_at: at.toISOString(), hours };
  await store.saveDoc<SleepDoc>("sleep", { asleep_at: null, nights: [...doc.nights.filter((n) => n.date !== date), night].slice(-KEEP_NIGHTS) });
  return { hours, date, time: hm(at.toISOString()) };
}

/** A bedtime picked in the morning, as a moment: an evening time is yesterday, a small-hours time today. */
export function lastNightAt(time: string, now = new Date()) {
  const today = israelToday(now);
  return israelToUtc(toMinutes(time) >= toMinutes("12:00") ? addDays(today, -1) : today, time);
}

/** "06:30" this morning, as a moment (for the wake-up buttons in the morning message). */
export function todayAt(time: string, date = israelToday()) {
  return israelToUtc(date, time);
}

/** The morning question's choices: around the planned wake-up, never in the future. */
export function wakeChoices(settings: Settings, now = toMinutes(israelNow())) {
  const wake = toMinutes(settings.wake_time);
  return [wake - 30, wake, wake + 30].filter((m) => m >= 0 && m <= now).map(fromMinutes);
}

export async function sleepStatus(store: LifeStore) {
  const [doc, settings] = await Promise.all([loadSleep(store), store.getSettings()]);
  return {
    ...sleepPlan(settings),
    asleep_at: doc.asleep_at,
    since: doc.asleep_at ? hm(doc.asleep_at) : null,
    last: doc.nights.at(-1) ?? null,
  };
}

export const hoursLabel = (h: number) => {
  const whole = Math.floor(h);
  const min = Math.round((h - whole) * 60);
  return min === 30 ? `${whole}.5 שעות` : min ? `${whole} שעות ו־${min} דק׳` : `${whole} שעות`;
};
