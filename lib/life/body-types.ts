import { z } from "zod";
import { DATE_RE, TIME_RE } from "./time";
import "./schemas"; // applies the Hebrew validation messages

// Shapes of the body plan. They are stored as JSON documents so the body coach agent can rewrite
// them wholesale; the zod schemas validate every write, whether it comes from the UI or the agent.

const time = z.string().regex(TIME_RE);
const date = z.string().regex(DATE_RE);

export const SHOPPING_CATEGORIES = ["חלבי וביצים", "בשר ודגים", "פחמימות", "ירקות", "פירות", "מזווה", "שונות"] as const;
export const shoppingCategorySchema = z.enum(SHOPPING_CATEGORIES);
export type ShoppingCategory = z.infer<typeof shoppingCategorySchema>;

export const shoppingSeedSchema = z.object({
  title: z.string().min(1).max(120),
  qty: z.string().max(60).optional(),
  category: shoppingCategorySchema,
});
export type ShoppingSeed = z.infer<typeof shoppingSeedSchema>;

export const bodyProfileSchema = z.object({
  height_cm: z.number().min(120).max(230),
  start_weight: z.number().min(30).max(300),
  start_date: date,
  goal_weight: z.number().min(30).max(300),
  age: z.number().int().min(12).max(100).nullable(),
  plan_start: date,
  calories: z.number().int().min(1200).max(5000),
  protein: z.number().int().min(40).max(300),
});
export type BodyProfile = z.infer<typeof bodyProfileSchema>;

export const mealSchema = z.object({
  label: z.string().min(1).max(40),
  time,
  kind: z.enum(["dairy", "meat", "parve"]),
  items: z.array(z.string().min(1).max(160)).min(1).max(12),
  kcal: z.number().int().min(0).max(2500).optional(),
  protein: z.number().int().min(0).max(200).optional(),
});
export type Meal = z.infer<typeof mealSchema>;

export const mealPlanSchema = z.object({
  rules: z.array(z.string().max(200)).max(15),
  /** Index 0 = Sunday … 5 = Friday. Shabbat has guidelines instead of a menu. */
  days: z.array(z.object({ day: z.number().int().min(0).max(5), meals: z.array(mealSchema).min(1).max(7) })).max(6),
  shabbat: z.array(z.string().max(200)).max(12),
  shopping: z.array(shoppingSeedSchema).max(80),
});
export type MealPlan = z.infer<typeof mealPlanSchema>;

export const exerciseSchema = z.object({
  name: z.string().min(1).max(80),
  sets: z.string().min(1).max(40),
  note: z.string().max(160).optional(),
});

export const workoutSchema = z.object({
  key: z.string().min(1).max(20),
  title: z.string().min(1).max(60),
  minutes: z.number().int().min(5).max(180),
  warmup: z.string().max(200).optional(),
  exercises: z.array(exerciseSchema).min(1).max(15),
  finisher: z.string().max(200).optional(),
});
export type Workout = z.infer<typeof workoutSchema>;

export const workoutPlanSchema = z.object({
  workouts: z.array(workoutSchema).min(1).max(6),
  /** One entry per weekday that has activity (0 = Sunday … 5 = Friday). */
  schedule: z
    .array(
      z.object({
        day: z.number().int().min(0).max(5),
        time,
        workout: z.string().max(20).nullable(),
        activity: z.string().max(120).optional(),
        minutes: z.number().int().min(5).max(180).optional(),
      }),
    )
    .max(6),
  steps: z.string().max(160),
  progression: z.string().max(300),
});
export type WorkoutPlan = z.infer<typeof workoutPlanSchema>;

export type ShoppingItem = {
  id: string;
  created_at: string;
  title: string;
  qty: string | null;
  category: ShoppingCategory;
  checked: boolean;
};

export const DAY_LABELS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
