import { z } from "zod";
import { areaSchema, dateSchema } from "./schemas";
import type { Area } from "./types";

// Growth: measurable goals ("חזון 30"), lessons that come back at the right moment, the weekly
// review, and patterns learnt from the data. Client-safe (types and schemas only).

export const VISION_DATE = "2027-03-10";

/** Where a goal's current value comes from. "custom" is updated by hand. */
export const GOAL_METRICS = ["weight", "monthly_profit", "learning", "custom"] as const;
export type GoalMetric = (typeof GOAL_METRICS)[number];

export type Goal = {
  id: string;
  title: string;
  area: Area;
  metric: GoalMetric;
  start: number;
  target: number;
  unit: string;
  start_date: string;
  deadline: string;
  /** Hand-entered value, for custom goals. */
  value?: number | null;
};

export const newGoalSchema = z.object({
  title: z.string().trim().min(1).max(120),
  area: areaSchema.optional(),
  start: z.number().min(-1_000_000).max(100_000_000),
  target: z.number().min(-1_000_000).max(100_000_000),
  unit: z.string().trim().max(20).default(""),
  deadline: dateSchema,
});
export const goalPatchSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  target: z.number().min(-1_000_000).max(100_000_000).optional(),
  deadline: dateSchema.optional(),
  value: z.number().min(-1_000_000).max(100_000_000).nullable().optional(),
});

export type GoalStatus = "done" | "on_track" | "behind" | "no_data";

export type GoalProgress = Goal & {
  current: number | null;
  /** Where the current value comes from, when it needs saying ("צפי לחודש הנוכחי"). */
  currentNote?: string;
  pct: number;
  expectedPct: number;
  status: GoalStatus;
  /** The next checkpoint (end of quarter or the deadline) and the value to reach by then. */
  checkpoint: { date: string; value: number } | null;
  daysLeft: number;
};

export const LESSON_SOURCES = ["mine", "others"] as const;
export type LessonSource = (typeof LESSON_SOURCES)[number];

export const newLessonSchema = z.object({
  /** The rule to remember, short: "לא שולחים הצעת מחיר בלי שיחת אבחון". */
  rule: z.string().trim().min(3).max(300),
  /** What happened, optional. */
  story: z.string().trim().max(2000).nullable().optional(),
  source: z.enum(LESSON_SOURCES).default("mine"),
  /** Book, podcast, mentor or client, for lessons from others. */
  source_name: z.string().trim().max(120).nullable().optional(),
  area: areaSchema.optional(),
});
// Spelled out rather than newLessonSchema.partial(): a partial schema still applies `source`'s
// default, which would reset "others" to "mine" on any edit.
export const lessonPatchSchema = z.object({
  rule: z.string().trim().min(3).max(300).optional(),
  story: z.string().trim().max(2000).nullable().optional(),
  source: z.enum(LESSON_SOURCES).optional(),
  source_name: z.string().trim().max(120).nullable().optional(),
  area: areaSchema.optional(),
  archived: z.boolean().optional(),
});

export type Lesson = {
  id: string;
  created_at: string;
  rule: string;
  story: string | null;
  source: LessonSource;
  source_name: string | null;
  area: Area;
  reviews: number;
  next_review: string;
  last_shown: string | null;
  archived: boolean;
};

export const reviewSchema = z.object({
  went_well: z.string().trim().max(1000).default(""),
  went_badly: z.string().trim().max(1000).default(""),
  lesson: z.string().trim().max(300).default(""),
  focus: z.array(z.string().trim().min(1).max(120)).max(3).default([]),
});
export type WeeklyReview = z.output<typeof reviewSchema> & { week: string; saved_at: string };

export type Insight = { key: string; text: string; area: Area };

export type GrowthSummary = {
  visionDate: string;
  daysToVision: number;
  goals: GoalProgress[];
  lessonOfDay: Lesson | null;
  lessons: Lesson[];
  week: string;
  review: WeeklyReview | null;
  pastReviews: WeeklyReview[];
  insights: Insight[];
};
