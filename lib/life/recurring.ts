import { z } from "zod";
import { areaSchema, timeSchema } from "./schemas";
import { anchorConflict } from "./day";
import type { LifeStore } from "./store";
import type { Area } from "./types";
import { israelToday, restDayOf, toMinutes } from "./time";

// Weekly fixed commitments (a class, a standing meeting). Kept as one small JSON doc; they show up
// in the day, week and month views on their weekday, never on Shabbat or Yom Tov.

export const WEEKDAY_LABELS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export const newRecurringSchema = z
  .object({
    /** 0 = Sunday … 5 = Friday. Shabbat is never scheduled. */
    weekday: z.number().int().min(0).max(5, "בשבת לא קובעים התחייבויות"),
    start_time: timeSchema,
    end_time: timeSchema.nullable().optional(),
    title: z.string().trim().min(1).max(120),
    area: areaSchema.optional(),
  })
  .refine((r) => !r.end_time || toMinutes(r.end_time) > toMinutes(r.start_time), {
    message: "שעת הסיום חייבת להיות אחרי ההתחלה",
    path: ["end_time"],
  });

export type Recurring = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string | null;
  title: string;
  area: Area;
  /** First date it applies to (the day it was added), so past weeks are not rewritten. */
  since?: string;
};

type RecurringDoc = { items: Recurring[] };

export async function loadRecurring(store: LifeStore): Promise<Recurring[]> {
  const doc = await store.getDoc<RecurringDoc>("recurring");
  return (doc?.items ?? []).slice().sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time));
}

export class RecurringConflictError extends Error {}

export async function addRecurring(store: LifeStore, input: z.input<typeof newRecurringSchema>): Promise<Recurring> {
  const parsed = newRecurringSchema.parse(input);
  const conflict = anchorConflict(await store.getSettings(), parsed.start_time, parsed.end_time ?? null);
  if (conflict) throw new RecurringConflictError(`חופף ל${conflict}. בחר שעה אחרת.`);
  const item: Recurring = {
    id: crypto.randomUUID(),
    weekday: parsed.weekday,
    start_time: parsed.start_time,
    end_time: parsed.end_time ?? null,
    title: parsed.title,
    area: parsed.area ?? "general",
    since: israelToday(),
  };
  await store.saveDoc<RecurringDoc>("recurring", { items: [...(await loadRecurring(store)), item] });
  return item;
}

export async function removeRecurring(store: LifeStore, id: string): Promise<boolean> {
  const items = await loadRecurring(store);
  const next = items.filter((r) => r.id !== id);
  if (next.length === items.length) return false;
  await store.saveDoc<RecurringDoc>("recurring", { items: next });
  return true;
}

/** The commitments that fall on `date`. */
export function recurringFor(items: Recurring[], date: string): Recurring[] {
  if (restDayOf(date)) return [];
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return items.filter((r) => r.weekday === weekday && (!r.since || date >= r.since));
}
