import { z } from "zod";
import { areaSchema } from "./schemas";
import type { Area } from "./types";

// Client-safe part of the ideas feature (types, labels, schemas); the store lives in ideas.ts.

export const IDEA_STATUSES = ["idea", "exploring", "doing", "done", "parked"] as const;
export type IdeaStatus = (typeof IDEA_STATUSES)[number];

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  idea: "רעיון",
  exploring: "בבדיקה",
  doing: "בביצוע",
  done: "הושלם",
  parked: "נגנז",
};

export type IdeaStep = { id: string; text: string; done: boolean; task_id?: string | null };

export type Idea = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  area: Area;
  status: IdeaStatus;
  notes: string;
  steps: IdeaStep[];
};

const stepSchema = z.object({
  id: z.string().min(1).max(64),
  text: z.string().trim().min(1).max(300),
  done: z.boolean(),
  task_id: z.string().nullable().optional(),
});

export const newIdeaSchema = z.object({
  title: z.string().trim().min(1).max(200),
  area: areaSchema.optional(),
  notes: z.string().max(20_000).optional(),
});

export const ideaPatchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  area: areaSchema.optional(),
  status: z.enum(IDEA_STATUSES).optional(),
  notes: z.string().max(20_000).optional(),
  steps: z.array(stepSchema).max(100).optional(),
});

export type NewIdea = z.input<typeof newIdeaSchema>;
export type IdeaPatch = z.output<typeof ideaPatchSchema>;
