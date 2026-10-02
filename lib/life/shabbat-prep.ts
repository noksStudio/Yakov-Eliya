import { z } from "zod";
import type { LifeStore } from "./store";
import { escapeHtml } from "./telegram";
import { addDays, israelToday, restDayOf, weekdayName } from "./time";
import { CITIES, cityById, restTimes } from "./zmanim";

// Erev Shabbat (and erev Yom Tov) at 10:00: candle lighting and end times for his city, and the
// home checklist he keeps (air conditioners on the Shabbat timer, fridges on Shabbat mode).

export type ShabbatPrefs = { city: string | null; candle_minutes: number | null; checklist: string[] };

export const DEFAULT_CHECKLIST = ["מזגנים על שעון שבת", "מקררים על מצב שבת"];
const DEFAULTS: ShabbatPrefs = { city: null, candle_minutes: null, checklist: DEFAULT_CHECKLIST };

export const shabbatPrefsSchema = z.object({
  city: z.enum(CITIES.map((c) => c.id) as [string, ...string[]]).nullable().optional(),
  candle_minutes: z.number().int().min(0).max(60).nullable().optional(),
  checklist: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
});

export async function loadShabbatPrefs(store: LifeStore): Promise<ShabbatPrefs> {
  return { ...DEFAULTS, ...((await store.getDoc<Partial<ShabbatPrefs>>("shabbat")) ?? {}) };
}

export async function saveShabbatPrefs(store: LifeStore, patch: z.infer<typeof shabbatPrefsSchema>) {
  const next = { ...(await loadShabbatPrefs(store)), ...patch };
  await store.saveDoc<ShabbatPrefs>("shabbat", next);
  return next;
}

/** The next eve (a non-rest day followed by a rest day), from `from` on. */
export function nextEve(from = israelToday()) {
  for (let d = from, i = 0; i < 14; d = addDays(d, 1), i++) {
    if (!restDayOf(d) && restDayOf(addDays(d, 1))) return d;
  }
  return null;
}

export async function upcomingTimes(store: LifeStore, from = israelToday()) {
  const prefs = await loadShabbatPrefs(store);
  const city = cityById(prefs.city);
  const eve = nextEve(from);
  if (!city || !eve) return { prefs, city, eve, times: null };
  return { prefs, city, eve, times: restTimes(eve, city, prefs.candle_minutes ?? city.candles) };
}

/** The 10:00 message on the eve (also /shabbat in Telegram). */
export async function shabbatMessage(store: LifeStore, date = israelToday(), origin = "") {
  const { prefs, city, eve, times } = await upcomingTimes(store, date);
  const settingsLink = origin ? `\n<a href="${origin}/life/settings#shabbat-title">לבחירת העיר</a>` : "";
  if (!city) return `🕯️ כדי לקבל זמני כניסה ויציאה, בחר עיר בהגדרות ← שבת.${settingsLink}`;
  if (!eve || !times) return "🕯️ אין שבת או חג בשבועיים הקרובים.";
  const when = eve === date ? "היום" : `${weekdayName(eve)} ${Number(eve.slice(8, 10))}.${Number(eve.slice(5, 7))}`;
  const lines = [
    times.title === "שבת"
      ? `🕯️ <b>שבת שלום!</b> (${escapeHtml(city.name)})`
      : `🕯️ <b>${times.title.includes("שבת") ? "שבת שלום וחג שמח" : "חג שמח"}!</b> ${escapeHtml(times.title)} · ${escapeHtml(city.name)}`,
    "",
    `הדלקת נרות ${when}: <b>${times.candles}</b>`,
    `יציאה: <b>${times.end}</b> · ר״ת ${times.endRabbeinuTam}`,
  ];
  if (times.days.length > 1) lines.push(`(${times.days.map((d) => `${weekdayName(d.date)}: ${escapeHtml(d.name)}`).join(" · ")})`);
  if (prefs.checklist.length) lines.push("", `<b>לפני ${times.title.includes("שבת") ? "שבת" : "החג"}</b>`, ...prefs.checklist.map((item) => `☐ ${escapeHtml(item)}`));
  return lines.join("\n");
}
