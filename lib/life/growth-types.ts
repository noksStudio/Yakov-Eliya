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
  /** The full plan behind the goal (an idea with notes and steps), e.g. the digital course funnel. */
  plan_idea_id?: string | null;
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
  /**
   * Words that make it relevant ("טיול", "פארק"). With triggers the lesson is contextual: it comes
   * up only when today's or tomorrow's schedule mentions one of them, never in the daily rotation.
   */
  triggers: z.array(z.string().trim().min(2).max(40)).max(20).default([]),
});
// Spelled out rather than newLessonSchema.partial(): a partial schema still applies `source`'s
// default, which would reset "others" to "mine" on any edit.
export const lessonPatchSchema = z.object({
  rule: z.string().trim().min(3).max(300).optional(),
  story: z.string().trim().max(2000).nullable().optional(),
  source: z.enum(LESSON_SOURCES).optional(),
  source_name: z.string().trim().max(120).nullable().optional(),
  area: areaSchema.optional(),
  triggers: z.array(z.string().trim().min(2).max(40)).max(20).optional(),
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
  triggers: string[];
};

/** A contextual lesson matched to something on the schedule today or tomorrow. */
export type ContextLesson = { lesson: Lesson; when: "today" | "tomorrow"; match: string; trigger: string };

/** Why a week slipped: the answers come back as a pattern over the weeks ("the phone, 3 of 4"). */
export const FELL_REASONS = [
  { key: "phone", label: "הטלפון שאב אותי", tip: "טלפון בחדר אחר בזמן בלוק העבודה העמוקה" },
  { key: "sleep", label: "עייפות / שינה", tip: "מסכים כבויים בזמן, לישון בשעה קבועה" },
  { key: "no_plan", label: "לא תכננתי מראש", tip: "3 משימות למחר נקבעות בסגירת היום" },
  { key: "distractions", label: "הסחות ובלת״מים", tip: "בלוק עבודה אחד מוגן בבוקר, לפני הכל" },
  { key: "mood", label: "מצב רוח / מוטיבציה", tip: "להתחיל מ־10 דקות בלבד, רק להתחיל" },
  { key: "family", label: "עומס משפחתי / אירועים", tip: "לתכנן את השבוע סביב האירועים מראש" },
  { key: "unclear", label: "לא היה ברור מה לעשות", tip: "צעד ראשון קטן וברור לכל משימה" },
] as const;
export type FellReason = (typeof FELL_REASONS)[number]["key"];

export const FOCUS_KEPT = ["yes", "partly", "no"] as const;

export const reviewSchema = z.object({
  went_well: z.string().trim().max(1000).default(""),
  went_badly: z.string().trim().max(1000).default(""),
  lesson: z.string().trim().max(300).default(""),
  focus: z.array(z.string().trim().min(1).max(120)).max(3).default([]),
  fell_reasons: z.array(z.enum(FELL_REASONS.map((r) => r.key) as [FellReason, ...FellReason[]])).max(FELL_REASONS.length).default([]),
  /** Last week's focus items and whether he kept them. */
  focus_check: z
    .array(z.object({ text: z.string().trim().min(1).max(120), kept: z.enum(FOCUS_KEPT) }))
    .max(3)
    .default([]),
});
export type WeeklyReview = z.output<typeof reviewSchema> & { week: string; saved_at: string };

/** One line of the week in numbers: what was done against the plan. */
export type WeekRow = { key: string; label: string; actual: string; target: string; ok: boolean | null; note?: string };

export type WeekNumbers = {
  /** The week reviewed, Sunday to Saturday. */
  from: string;
  to: string;
  workDays: number;
  /** Working days with no check-in at all (nothing to judge by). */
  missingDays: number;
  rows: WeekRow[];
};

export type ReviewContext = {
  /** The week the review (and its focus) is for. */
  week: string;
  numbers: WeekNumbers;
  /** Last week's focus, to check. */
  lastFocus: string[];
  /** How often each reason came up in the last reviews. */
  reasons: { key: FellReason; count: number; of: number }[];
};

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
