import { z } from "zod";
import "./schemas";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { DATE_RE } from "./time";

// Personal writing. Two kinds: the hitbodedut journal is always private (never handed to any
// agent), and daily reflections, which the mental coach may read unless marked private.

export const JOURNAL_KINDS = ["hitbodedut", "reflection"] as const;
export type JournalKind = (typeof JOURNAL_KINDS)[number];

export const newJournalSchema = z.object({
  date: z.string().regex(DATE_RE),
  kind: z.enum(JOURNAL_KINDS),
  text: z.string().trim().min(1).max(5000),
  private: z.boolean().default(false),
});
export type NewJournal = z.input<typeof newJournalSchema>;
export type JournalEntry = z.output<typeof newJournalSchema> & { id: string; created_at: string };

export interface JournalStore {
  list(kind: JournalKind, limit: number): Promise<JournalEntry[]>;
  add(input: NewJournal): Promise<JournalEntry>;
  remove(id: string): Promise<boolean>;
}

/** The hitbodedut journal is private whatever the caller asked for. */
function normalize(input: NewJournal) {
  const parsed = newJournalSchema.parse(input);
  return { ...parsed, private: parsed.kind === "hitbodedut" ? true : parsed.private };
}

function supabaseJournal(): JournalStore {
  const db = getSupabaseAdmin();
  const check = <T>({ data, error }: { data: T; error: { message: string } | null }) => {
    if (error) throw new Error(error.message);
    return data;
  };
  return {
    async list(kind, limit) {
      return check(
        await db.from("life_journal").select("*").eq("kind", kind).order("created_at", { ascending: false }).limit(limit),
      ) as JournalEntry[];
    },
    async add(input) {
      return check(await db.from("life_journal").insert(normalize(input)).select("*").single()) as JournalEntry;
    },
    async remove(id) {
      return (check(await db.from("life_journal").delete().eq("id", id).select("id")) ?? []).length > 0;
    },
  };
}

const globalForJournal = globalThis as unknown as { __lifeJournal?: JournalEntry[] };

function memoryJournal(): JournalStore {
  const entries = (globalForJournal.__lifeJournal ??= []);
  return {
    async list(kind, limit) {
      return entries
        .filter((e) => e.kind === kind)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, limit)
        .map((e) => ({ ...e }));
    },
    async add(input) {
      const entry: JournalEntry = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...normalize(input) };
      entries.push(entry);
      return { ...entry };
    },
    async remove(id) {
      const i = entries.findIndex((e) => e.id === id);
      if (i === -1) return false;
      entries.splice(i, 1);
      return true;
    },
  };
}

export function getJournalStore(): JournalStore {
  return isSupabaseConfigured() ? supabaseJournal() : memoryJournal();
}
