import { z } from "zod";
import { AREAS } from "./types";

// Validation messages in Hebrew, for every schema in the life OS (the UI shows them as-is).
z.config(z.locales.he());
import { DATE_RE, TIME_RE } from "./time";

export const timeSchema = z.string().regex(TIME_RE, "שעה בפורמט HH:MM");
export const dateSchema = z.string().regex(DATE_RE, "תאריך בפורמט YYYY-MM-DD");
export const areaSchema = z.enum(AREAS);

export const newTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  area: areaSchema.optional(),
  priority: z.number().int().min(1).max(3).optional(),
  due_date: dateSchema.nullable().optional(),
  scheduled_time: timeSchema.nullable().optional(),
  /** Links a prep task to the event it prepares for. */
  event_id: z.string().uuid().nullable().optional(),
});

export const taskPatchSchema = newTaskSchema.partial().extend({ done: z.boolean().optional() });

export const newEventSchema = z.object({
  date: dateSchema,
  start_time: timeSchema,
  end_time: timeSchema.nullable().optional(),
  title: z.string().trim().min(1).max(200),
  area: areaSchema.optional(),
});

const scale = z.number().int().min(1).max(5).nullable();

export const checkinPatchSchema = z.object({
  sleep_hours: z.number().min(0).max(24).nullable().optional(),
  weight: z.number().min(20).max(400).nullable().optional(),
  energy: scale.optional(),
  mood: scale.optional(),
  shacharit: z.boolean().optional(),
  mincha: z.boolean().optional(),
  arvit: z.boolean().optional(),
  hitbodedut: z.boolean().optional(),
  workout: z.boolean().optional(),
  day_rating: scale.optional(),
  note: z.string().max(2000).nullable().optional(),
});

export const settingsPatchSchema = z
  .object({
    wake_time: timeSchema,
    shacharit_time: timeSchema,
    mincha_time: timeSchema.nullable(),
    arvit_time: timeSchema.nullable(),
    deep_work_start: timeSchema,
    deep_work_end: timeSchema,
    day_close_time: timeSchema,
    hitbodedut_time: timeSchema,
    hitbodedut_minutes: z.number().int().min(10).max(180),
    screens_off_time: timeSchema,
    sleep_time: timeSchema,
    shabbat_silence: z.boolean(),
  })
  .partial();
