import { z } from "zod";
import "./schemas";
import { DATE_RE } from "./time";

// Money and sales: the finance manager's ledger and the business manager's pipeline and daily
// outreach counters.

const date = z.string().regex(DATE_RE);

export const INCOME_CATEGORIES = ["מכירה", "ריטיינר", "אחר"] as const;
export const EXPENSE_CATEGORIES = ["שיווק", "תוכנות וכלים", "קבלני משנה", "אחר"] as const;

export const financeEntrySchema = z.object({
  date,
  kind: z.enum(["income", "expense"]),
  amount: z.number().positive().max(10_000_000),
  category: z.string().trim().min(1).max(40),
  scope: z.enum(["business", "personal"]).default("business"),
  note: z.string().trim().max(200).nullable().optional(),
});
export type NewFinanceEntry = z.input<typeof financeEntrySchema>;
export type FinanceEntry = z.output<typeof financeEntrySchema> & { id: string; created_at: string; note: string | null };

export const financeGoalSchema = z.object({
  /** Monthly business profit target (income minus business expenses). */
  monthly_goal: z.number().int().min(0).max(10_000_000),
  /** Where things stood when the goal was set, for context. */
  baseline: z.number().int().min(0).max(10_000_000),
});
export type FinanceGoal = z.infer<typeof financeGoalSchema>;
export const DEFAULT_FINANCE_GOAL: FinanceGoal = { monthly_goal: 25_000, baseline: 8_000 };

// A lead is not a deal: leads live in their own list (lib/life/leads.ts) and become a deal only
// when there is money on the table.
export const DEAL_STAGES = ["call", "meeting", "diagnosis", "proposal", "won", "lost"] as const;
export type DealStage = (typeof DEAL_STAGES)[number];
export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  call: "שיחת היכרות",
  meeting: "פגישה",
  diagnosis: "אבחון",
  proposal: "הצעת מחיר",
  won: "נסגר",
  lost: "לא רלוונטי",
};
export const OPEN_STAGES: DealStage[] = ["call", "meeting", "diagnosis", "proposal"];

export const newDealSchema = z.object({
  name: z.string().trim().min(1).max(80),
  contact: z.string().trim().max(80).nullable().optional(),
  stage: z.enum(DEAL_STAGES).default("call"),
  value: z.number().min(0).max(10_000_000).nullable().optional(),
  next_action: z.string().trim().max(160).nullable().optional(),
  next_date: date.nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});
// Spelled out: Zod's .partial() keeps the stage default, so a patch without a stage would reset it.
export const dealPatchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  contact: z.string().trim().max(80).nullable().optional(),
  stage: z.enum(DEAL_STAGES).optional(),
  value: z.number().min(0).max(10_000_000).nullable().optional(),
  next_action: z.string().trim().max(160).nullable().optional(),
  next_date: date.nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});
export type NewDeal = z.input<typeof newDealSchema>;
export type DealPatch = z.infer<typeof dealPatchSchema>;
export type Deal = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  contact: string | null;
  stage: DealStage;
  value: number | null;
  next_action: string | null;
  next_date: string | null;
  notes: string | null;
};

export const ACTIVITY_KEYS = ["connections", "followups", "calls", "meetings"] as const;
export type ActivityKey = (typeof ACTIVITY_KEYS)[number];
export const ACTIVITY_LABELS: Record<ActivityKey, string> = {
  connections: "בקשות חיבור",
  followups: "הודעות המשך",
  calls: "שיחות / וואטסאפ",
  meetings: "פגישות שנקבעו",
};
/** Daily outreach targets from the sales plan (meetings has no daily quota). */
export const ACTIVITY_TARGETS: Record<ActivityKey, number> = { connections: 20, followups: 10, calls: 10, meetings: 0 };
export type Activity = { date: string } & Record<ActivityKey, number>;
export const activityPatchSchema = z.object(
  Object.fromEntries(ACTIVITY_KEYS.map((k) => [k, z.number().int().min(-50).max(500).optional()])) as Record<
    ActivityKey,
    z.ZodOptional<z.ZodNumber>
  >,
);
