import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { ideaPatchSchema, newIdeaSchema, type Idea, type IdeaPatch, type NewIdea } from "./idea-types";

export * from "./idea-types";

// Ideas: systems to build, products, things to try. Each idea keeps free notes (what to connect,
// which API, who it is for) and a list of steps that can each become a task.

export interface IdeasStore {
  list(): Promise<Idea[]>;
  get(id: string): Promise<Idea | null>;
  add(input: NewIdea): Promise<Idea>;
  update(id: string, patch: IdeaPatch): Promise<Idea | null>;
  remove(id: string): Promise<boolean>;
}

function fresh(input: NewIdea) {
  const parsed = newIdeaSchema.parse(input);
  return { title: parsed.title, area: parsed.area ?? "business", status: "idea" as const, notes: parsed.notes ?? "", steps: [] };
}

function supabaseIdeas(): IdeasStore {
  const db = getSupabaseAdmin();
  const check = <T>({ data, error }: { data: T; error: { message: string } | null }) => {
    if (error) throw new Error(error.message);
    return data;
  };
  return {
    async list() {
      return check(await db.from("life_ideas").select("*").order("updated_at", { ascending: false })) as Idea[];
    },
    async get(id) {
      return check(await db.from("life_ideas").select("*").eq("id", id).maybeSingle()) as Idea | null;
    },
    async add(input) {
      return check(await db.from("life_ideas").insert(fresh(input)).select("*").single()) as Idea;
    },
    async update(id, patch) {
      const row = { ...ideaPatchSchema.parse(patch), updated_at: new Date().toISOString() };
      return check(await db.from("life_ideas").update(row).eq("id", id).select("*").maybeSingle()) as Idea | null;
    },
    async remove(id) {
      return (check(await db.from("life_ideas").delete().eq("id", id).select("id")) ?? []).length > 0;
    },
  };
}

const globalForIdeas = globalThis as unknown as { __lifeIdeas?: Idea[] };

function memoryIdeas(): IdeasStore {
  // Starts empty; real starting content comes from seeds.ts, same as with Supabase.
  const ideas = (globalForIdeas.__lifeIdeas ??= []);
  const find = (id: string) => ideas.find((i) => i.id === id);
  return {
    async list() {
      return ideas
        .slice()
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .map((i) => structuredClone(i));
    },
    async get(id) {
      const idea = find(id);
      return idea ? structuredClone(idea) : null;
    },
    async add(input) {
      const now = new Date().toISOString();
      const idea: Idea = { id: crypto.randomUUID(), created_at: now, updated_at: now, ...fresh(input) };
      ideas.push(idea);
      return structuredClone(idea);
    },
    async update(id, patch) {
      const idea = find(id);
      if (!idea) return null;
      Object.assign(idea, ideaPatchSchema.parse(patch), { updated_at: new Date().toISOString() });
      return structuredClone(idea);
    },
    async remove(id) {
      const i = ideas.findIndex((idea) => idea.id === id);
      if (i === -1) return false;
      ideas.splice(i, 1);
      return true;
    },
  };
}

export function getIdeasStore(): IdeasStore {
  return isSupabaseConfigured() ? supabaseIdeas() : memoryIdeas();
}
