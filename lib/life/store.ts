import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { DEFAULT_SETTINGS, type Area, type ChatMessage, type Checkin, type LifeEvent, type Settings, type Task } from "./types";
import { addDays, israelToday } from "./time";

export type NewTask = {
  title: string;
  area?: Area;
  priority?: number;
  due_date?: string | null;
  scheduled_time?: string | null;
  source?: Task["source"];
};
export type TaskPatch = Partial<Pick<Task, "title" | "area" | "priority" | "due_date" | "scheduled_time" | "done">>;
export type NewEvent = Pick<LifeEvent, "date" | "start_time" | "title"> & {
  end_time?: string | null;
  area?: Area;
  source?: LifeEvent["source"];
};
export type CheckinPatch = Partial<Omit<Checkin, "date" | "updated_at">>;

export interface LifeStore {
  getSettings(): Promise<Settings>;
  saveSettings(patch: Partial<Settings>): Promise<Settings>;
  /** Open tasks plus tasks finished in the last two days. */
  listTasks(): Promise<Task[]>;
  addTask(input: NewTask): Promise<Task>;
  updateTask(id: string, patch: TaskPatch): Promise<Task | null>;
  deleteTask(id: string): Promise<boolean>;
  listEvents(date: string): Promise<LifeEvent[]>;
  addEvent(input: NewEvent): Promise<LifeEvent>;
  deleteEvent(id: string): Promise<boolean>;
  getCheckin(date: string): Promise<Checkin | null>;
  listCheckins(from: string, to: string): Promise<Checkin[]>;
  saveCheckin(date: string, patch: CheckinPatch): Promise<Checkin>;
  listMessages(limit: number): Promise<ChatMessage[]>;
  addMessage(role: ChatMessage["role"], content: string): Promise<ChatMessage>;
}

export class LifeStoreUnavailableError extends Error {}

const EMPTY_CHECKIN: Omit<Checkin, "date" | "updated_at"> = {
  sleep_hours: null,
  weight: null,
  energy: null,
  mood: null,
  shacharit: false,
  mincha: false,
  arvit: false,
  hitbodedut: false,
  day_rating: null,
  note: null,
};

function recentCutoff() {
  return `${addDays(israelToday(), -2)}T00:00:00Z`;
}

function newTask(input: NewTask): Omit<Task, "id" | "created_at"> {
  return {
    title: input.title,
    area: input.area ?? "general",
    priority: input.priority ?? 2,
    due_date: input.due_date ?? null,
    scheduled_time: input.scheduled_time ?? null,
    done: false,
    done_at: null,
    source: input.source ?? "user",
  };
}

function withDoneAt(patch: TaskPatch) {
  if (patch.done === undefined) return patch;
  return { ...patch, done_at: patch.done ? new Date().toISOString() : null };
}

// ---------------------------------------------------------------------------------------------
// Supabase (production)

function supabaseStore(): LifeStore {
  const db = getSupabaseAdmin();
  const check = <T>({ data, error }: { data: T; error: { message: string } | null }) => {
    if (error) throw new Error(error.message);
    return data;
  };

  return {
    async getSettings() {
      const row = check(await db.from("life_settings").select("*").eq("id", 1).maybeSingle());
      return { ...DEFAULT_SETTINGS, ...(row ?? {}) };
    },
    async saveSettings(patch) {
      const merged = { ...(await this.getSettings()), ...patch };
      const row = check(
        await db.from("life_settings").upsert({ id: 1, ...merged, updated_at: new Date().toISOString() }).select("*").single(),
      );
      return { ...DEFAULT_SETTINGS, ...row };
    },
    async listTasks() {
      return check(
        await db
          .from("life_tasks")
          .select("*")
          .or(`done.eq.false,done_at.gte.${recentCutoff()}`)
          .order("created_at", { ascending: true }),
      ) as Task[];
    },
    async addTask(input) {
      return check(await db.from("life_tasks").insert(newTask(input)).select("*").single()) as Task;
    },
    async updateTask(id, patch) {
      return check(await db.from("life_tasks").update(withDoneAt(patch)).eq("id", id).select("*").maybeSingle()) as Task | null;
    },
    async deleteTask(id) {
      const rows = check(await db.from("life_tasks").delete().eq("id", id).select("id"));
      return (rows ?? []).length > 0;
    },
    async listEvents(date) {
      return check(await db.from("life_events").select("*").eq("date", date).order("start_time")) as LifeEvent[];
    },
    async addEvent(input) {
      const row = { end_time: null, area: "general", source: "user", ...input };
      return check(await db.from("life_events").insert(row).select("*").single()) as LifeEvent;
    },
    async deleteEvent(id) {
      const rows = check(await db.from("life_events").delete().eq("id", id).select("id"));
      return (rows ?? []).length > 0;
    },
    async getCheckin(date) {
      return check(await db.from("life_checkins").select("*").eq("date", date).maybeSingle()) as Checkin | null;
    },
    async listCheckins(from, to) {
      return check(await db.from("life_checkins").select("*").gte("date", from).lte("date", to).order("date")) as Checkin[];
    },
    async saveCheckin(date, patch) {
      const current = (await this.getCheckin(date)) ?? { ...EMPTY_CHECKIN, date };
      const row = { ...current, ...patch, date, updated_at: new Date().toISOString() };
      return check(await db.from("life_checkins").upsert(row).select("*").single()) as Checkin;
    },
    async listMessages(limit) {
      const rows = check(await db.from("life_messages").select("*").order("created_at", { ascending: false }).limit(limit)) as ChatMessage[];
      return rows.reverse();
    },
    async addMessage(role, content) {
      return check(await db.from("life_messages").insert({ role, content }).select("*").single()) as ChatMessage;
    },
  };
}

// ---------------------------------------------------------------------------------------------
// In-memory (local development and demos only; data is lost on restart)

type Memory = {
  settings: Settings;
  tasks: Task[];
  events: LifeEvent[];
  checkins: Map<string, Checkin>;
  messages: ChatMessage[];
};

const globalForLife = globalThis as unknown as { __lifeMemory?: Memory };

function memoryStore(): LifeStore {
  const initial: Memory = { settings: { ...DEFAULT_SETTINGS }, tasks: [], events: [], checkins: new Map(), messages: [] };
  const mem = (globalForLife.__lifeMemory ??= initial);
  const stamp = () => new Date().toISOString();

  return {
    async getSettings() {
      return { ...mem.settings };
    },
    async saveSettings(patch) {
      mem.settings = { ...mem.settings, ...patch };
      return { ...mem.settings };
    },
    async listTasks() {
      const cutoff = recentCutoff();
      return mem.tasks.filter((t) => !t.done || (t.done_at ?? "") >= cutoff).map((t) => ({ ...t }));
    },
    async addTask(input) {
      const task: Task = { id: crypto.randomUUID(), created_at: stamp(), ...newTask(input) };
      mem.tasks.push(task);
      return { ...task };
    },
    async updateTask(id, patch) {
      const task = mem.tasks.find((t) => t.id === id);
      if (!task) return null;
      Object.assign(task, withDoneAt(patch));
      return { ...task };
    },
    async deleteTask(id) {
      const before = mem.tasks.length;
      mem.tasks = mem.tasks.filter((t) => t.id !== id);
      return mem.tasks.length < before;
    },
    async listEvents(date) {
      return mem.events.filter((e) => e.date === date).map((e) => ({ ...e }));
    },
    async addEvent(input) {
      const event: LifeEvent = {
        id: crypto.randomUUID(),
        created_at: stamp(),
        end_time: null,
        area: "general",
        source: "user",
        ...input,
      };
      mem.events.push(event);
      return { ...event };
    },
    async deleteEvent(id) {
      const before = mem.events.length;
      mem.events = mem.events.filter((e) => e.id !== id);
      return mem.events.length < before;
    },
    async getCheckin(date) {
      const c = mem.checkins.get(date);
      return c ? { ...c } : null;
    },
    async listCheckins(from, to) {
      return [...mem.checkins.values()].filter((c) => c.date >= from && c.date <= to).sort((a, b) => a.date.localeCompare(b.date));
    },
    async saveCheckin(date, patch) {
      const current = mem.checkins.get(date) ?? { ...EMPTY_CHECKIN, date, updated_at: stamp() };
      const next = { ...current, ...patch, date, updated_at: stamp() };
      mem.checkins.set(date, next);
      return { ...next };
    },
    async listMessages(limit) {
      return mem.messages.slice(-limit).map((m) => ({ ...m }));
    },
    async addMessage(role, content) {
      const message: ChatMessage = { id: crypto.randomUUID(), created_at: stamp(), role, content };
      mem.messages.push(message);
      return { ...message };
    },
  };
}

export function isDemoStore() {
  return !isSupabaseConfigured();
}

export function getLifeStore(): LifeStore {
  if (isSupabaseConfigured()) return supabaseStore();
  // Never silently fall back to memory in production: data would vanish between requests.
  if (process.env.NODE_ENV !== "production" || process.env.LIFE_DEMO === "1") return memoryStore();
  throw new LifeStoreUnavailableError("מסד הנתונים לא מחובר — הוסף את פרטי Supabase והרץ את supabase/life.sql");
}
