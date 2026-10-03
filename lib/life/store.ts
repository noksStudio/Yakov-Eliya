import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { DEFAULT_SETTINGS, type AgentId, type Area, type ChatMessage, type Checkin, type LifeEvent, type Settings, type Task } from "./types";
import type { ShoppingCategory, ShoppingItem, ShoppingSeed } from "./body-types";
import { addDays, israelToday } from "./time";

export type NewTask = {
  title: string;
  area?: Area;
  priority?: number;
  due_date?: string | null;
  scheduled_time?: string | null;
  source?: Task["source"];
  event_id?: string | null;
};
export type TaskPatch = Partial<Pick<Task, "title" | "area" | "priority" | "due_date" | "scheduled_time" | "done" | "event_id">>;
export type NewEvent = Pick<LifeEvent, "date" | "start_time" | "title"> & {
  end_time?: string | null;
  area?: Area;
  source?: LifeEvent["source"];
};
export type CheckinPatch = Partial<Omit<Checkin, "date" | "updated_at">>;
export type ShoppingPatch = Partial<Pick<ShoppingItem, "title" | "qty" | "category" | "checked">>;
export type DocKey =
  | "body_profile"
  | "meal_plan"
  | "workout_plan"
  | "learning_goal"
  | "finance_goal"
  | "memory"
  | "telegram"
  | "notify_prefs"
  | "notify_log"
  | "recurring"
  | "couple"
  | "seeds"
  | "goals"
  | "reviews"
  | "reminders"
  | "cron_seen"
  | "calendar"
  | "notify_mute"
  | "backup_log"
  | "integrations"
  | "intake_log"
  | "event_guests"
  | "shabbat"
  | "weekly_notice"
  | "rules"
  | "ai";

export interface LifeStore {
  getSettings(): Promise<Settings>;
  saveSettings(patch: Partial<Settings>): Promise<Settings>;
  /** Open tasks plus tasks finished in the last two days. */
  listTasks(): Promise<Task[]>;
  addTask(input: NewTask): Promise<Task>;
  updateTask(id: string, patch: TaskPatch): Promise<Task | null>;
  deleteTask(id: string): Promise<boolean>;
  /** Every task (open or done, however old) linked to one of these events. */
  listEventTasks(eventIds: string[]): Promise<Task[]>;
  listEvents(date: string): Promise<LifeEvent[]>;
  /** Events from `from` to `to` inclusive, by date and start time. */
  listEventsRange(from: string, to: string): Promise<LifeEvent[]>;
  addEvent(input: NewEvent): Promise<LifeEvent>;
  deleteEvent(id: string): Promise<boolean>;
  getEvent(id: string): Promise<LifeEvent | null>;
  getCheckin(date: string): Promise<Checkin | null>;
  listCheckins(from: string, to: string): Promise<Checkin[]>;
  saveCheckin(date: string, patch: CheckinPatch): Promise<Checkin>;
  listMessages(agent: AgentId, limit: number): Promise<ChatMessage[]>;
  addMessage(agent: AgentId, role: ChatMessage["role"], content: string): Promise<ChatMessage>;
  /** A stored JSON document, or null when it was never saved (callers fall back to defaults). */
  getDoc<T>(key: DocKey): Promise<T | null>;
  saveDoc<T>(key: DocKey, data: T): Promise<T>;
  listShopping(): Promise<ShoppingItem[]>;
  /** Adds items, skipping titles already on the list and not yet bought. Returns what was added. */
  addShopping(items: ShoppingSeed[]): Promise<ShoppingItem[]>;
  updateShopping(id: string, patch: ShoppingPatch): Promise<ShoppingItem | null>;
  deleteShopping(id: string): Promise<boolean>;
  clearCheckedShopping(): Promise<number>;
}

const EMPTY_CHECKIN: Omit<Checkin, "date" | "updated_at"> = {
  sleep_hours: null,
  weight: null,
  energy: null,
  mood: null,
  shacharit: false,
  mincha: false,
  arvit: false,
  hitbodedut: false,
  workout: false,
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
    // Only sent when set, so inserts keep working before the event_id column is migrated.
    ...(input.event_id ? { event_id: input.event_id } : {}),
    done: false,
    done_at: null,
    source: input.source ?? "user",
  };
}

const normalize = (title: string) => title.trim().replace(/\s+/g, " ");

function uniqueNew(items: ShoppingSeed[], existing: Set<string>) {
  const seen = new Set(existing);
  return items.filter((item) => {
    const key = normalize(item.title);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toShoppingRow(seed: ShoppingSeed): Omit<ShoppingItem, "id" | "created_at"> {
  return { title: normalize(seed.title), qty: seed.qty ?? null, category: seed.category as ShoppingCategory, checked: false };
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
    async listEventTasks(eventIds) {
      if (!eventIds.length) return [];
      return check(await db.from("life_tasks").select("*").in("event_id", eventIds).order("due_date")) as Task[];
    },
    async listEvents(date) {
      return check(await db.from("life_events").select("*").eq("date", date).order("start_time")) as LifeEvent[];
    },
    async listEventsRange(from, to) {
      return check(
        await db.from("life_events").select("*").gte("date", from).lte("date", to).order("date").order("start_time"),
      ) as LifeEvent[];
    },
    async addEvent(input) {
      const row = { end_time: null, area: "general", source: "user", ...input };
      return check(await db.from("life_events").insert(row).select("*").single()) as LifeEvent;
    },
    async getEvent(id) {
      return check(await db.from("life_events").select("*").eq("id", id).maybeSingle()) as LifeEvent | null;
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
    async listMessages(agent, limit) {
      const rows = check(
        await db.from("life_messages").select("*").eq("agent", agent).order("created_at", { ascending: false }).limit(limit),
      ) as ChatMessage[];
      return rows.reverse();
    },
    async addMessage(agent, role, content) {
      return check(await db.from("life_messages").insert({ agent, role, content }).select("*").single()) as ChatMessage;
    },
    async getDoc<T>(key: DocKey) {
      const row = check(await db.from("life_docs").select("data").eq("key", key).maybeSingle()) as { data: T } | null;
      return row?.data ?? null;
    },
    async saveDoc<T>(key: DocKey, data: T) {
      check(await db.from("life_docs").upsert({ key, data, updated_at: new Date().toISOString() }));
      return data;
    },
    async listShopping() {
      return check(await db.from("life_shopping").select("*").order("created_at")) as ShoppingItem[];
    },
    async addShopping(items) {
      const open = new Set((await this.listShopping()).filter((i) => !i.checked).map((i) => normalize(i.title)));
      const fresh = uniqueNew(items, open);
      if (!fresh.length) return [];
      return check(await db.from("life_shopping").insert(fresh.map(toShoppingRow)).select("*")) as ShoppingItem[];
    },
    async updateShopping(id, patch) {
      return check(await db.from("life_shopping").update(patch).eq("id", id).select("*").maybeSingle()) as ShoppingItem | null;
    },
    async deleteShopping(id) {
      const rows = check(await db.from("life_shopping").delete().eq("id", id).select("id"));
      return (rows ?? []).length > 0;
    },
    async clearCheckedShopping() {
      const rows = check(await db.from("life_shopping").delete().eq("checked", true).select("id"));
      return (rows ?? []).length;
    },
  };
}

// ---------------------------------------------------------------------------------------------
// In-memory demo store, used while Supabase is not connected. Data lives in the server process
// only (and on serverless hosting may reset between requests); the UI marks this as demo mode.

type Memory = {
  settings: Settings;
  tasks: Task[];
  events: LifeEvent[];
  checkins: Map<string, Checkin>;
  messages: ChatMessage[];
  docs: Map<DocKey, unknown>;
  shopping: ShoppingItem[];
};

const globalForLife = globalThis as unknown as { __lifeMemory?: Memory };

function memoryStore(): LifeStore {
  const today = israelToday();
  const sample = (title: string, area: Area, priority: number, scheduled_time: string | null = null): Task => ({
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...newTask({ title, area, priority, due_date: today, scheduled_time }),
  });
  const initial: Memory = {
    settings: { ...DEFAULT_SETTINGS },
    tasks: [
      sample("20 בקשות חיבור בלינקדאין ליבואנים", "business", 1, "09:00"),
      sample("פולואפ לדיבי פלאסט: לקבוע פגישה", "business", 1, "11:15"),
      sample("קניות לשבוע לפי התפריט", "home", 2),
      sample("להקליט סרטון הדגמה של 30 שניות", "business", 2),
    ],
    events: [],
    checkins: new Map(),
    messages: [],
    docs: new Map(),
    shopping: [],
  };
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
    async listEventTasks(eventIds) {
      return mem.tasks.filter((t) => t.event_id && eventIds.includes(t.event_id)).map((t) => ({ ...t }));
    },
    async listEvents(date) {
      return mem.events.filter((e) => e.date === date).map((e) => ({ ...e }));
    },
    async listEventsRange(from, to) {
      return mem.events
        .filter((e) => e.date >= from && e.date <= to)
        .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
        .map((e) => ({ ...e }));
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
    async getEvent(id) {
      const event = mem.events.find((e) => e.id === id);
      return event ? { ...event } : null;
    },
    async deleteEvent(id) {
      const before = mem.events.length;
      mem.events = mem.events.filter((e) => e.id !== id);
      // Mirrors "on delete set null" on life_tasks.event_id.
      for (const t of mem.tasks) if (t.event_id === id) t.event_id = null;
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
    async listMessages(agent, limit) {
      return mem.messages.filter((m) => m.agent === agent).slice(-limit).map((m) => ({ ...m }));
    },
    async addMessage(agent, role, content) {
      const message: ChatMessage = { id: crypto.randomUUID(), created_at: stamp(), agent, role, content };
      mem.messages.push(message);
      return { ...message };
    },
    async getDoc<T>(key: DocKey) {
      const doc = mem.docs.get(key);
      return doc === undefined ? null : (structuredClone(doc) as T);
    },
    async saveDoc<T>(key: DocKey, data: T) {
      mem.docs.set(key, structuredClone(data));
      return data;
    },
    async listShopping() {
      return mem.shopping.map((i) => ({ ...i }));
    },
    async addShopping(items) {
      const open = new Set(mem.shopping.filter((i) => !i.checked).map((i) => normalize(i.title)));
      const added = uniqueNew(items, open).map((seed) => ({ id: crypto.randomUUID(), created_at: stamp(), ...toShoppingRow(seed) }));
      mem.shopping.push(...added);
      return added.map((i) => ({ ...i }));
    },
    async updateShopping(id, patch) {
      const item = mem.shopping.find((i) => i.id === id);
      if (!item) return null;
      Object.assign(item, patch);
      return { ...item };
    },
    async deleteShopping(id) {
      const before = mem.shopping.length;
      mem.shopping = mem.shopping.filter((i) => i.id !== id);
      return mem.shopping.length < before;
    },
    async clearCheckedShopping() {
      const before = mem.shopping.length;
      mem.shopping = mem.shopping.filter((i) => !i.checked);
      return before - mem.shopping.length;
    },
  };
}

export function isDemoStore() {
  return !isSupabaseConfigured();
}

export function getLifeStore(): LifeStore {
  // Without Supabase the area runs as a clearly-labelled demo (see isDemoStore) instead of failing.
  return isSupabaseConfigured() ? supabaseStore() : memoryStore();
}
