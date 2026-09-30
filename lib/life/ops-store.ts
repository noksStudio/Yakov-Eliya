import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { addDays, israelToday } from "./time";
import {
  ACTIVITY_KEYS,
  type Activity,
  type ActivityKey,
  type Deal,
  type DealPatch,
  type FinanceEntry,
  type NewDeal,
  type NewFinanceEntry,
} from "./ops-types";

// Storage for the finance ledger, the deal pipeline and daily outreach counters. Same two backends
// as the rest of the life OS: Supabase when configured, an in-memory demo store otherwise.

export interface OpsStore {
  listFinance(from: string, to: string): Promise<FinanceEntry[]>;
  addFinance(input: NewFinanceEntry): Promise<FinanceEntry>;
  deleteFinance(id: string): Promise<boolean>;
  listDeals(): Promise<Deal[]>;
  addDeal(input: NewDeal): Promise<Deal>;
  updateDeal(id: string, patch: DealPatch): Promise<Deal | null>;
  deleteDeal(id: string): Promise<boolean>;
  getActivity(date: string): Promise<Activity>;
  listActivity(from: string, to: string): Promise<Activity[]>;
  /** Adds the deltas to the day's counters (never below zero). */
  bumpActivity(date: string, deltas: Partial<Record<ActivityKey, number>>): Promise<Activity>;
}

const emptyActivity = (date: string): Activity => ({ date, connections: 0, followups: 0, calls: 0, meetings: 0 });

function applyDeltas(current: Activity, deltas: Partial<Record<ActivityKey, number>>): Activity {
  const next = { ...current };
  for (const key of ACTIVITY_KEYS) next[key] = Math.max(0, current[key] + (deltas[key] ?? 0));
  return next;
}

function toEntry(input: NewFinanceEntry): Omit<FinanceEntry, "id" | "created_at"> {
  return {
    date: input.date,
    kind: input.kind,
    amount: input.amount,
    category: input.category,
    scope: input.scope ?? "business",
    note: input.note ?? null,
  };
}

function toDeal(input: NewDeal): Omit<Deal, "id" | "created_at" | "updated_at"> {
  return {
    name: input.name,
    contact: input.contact ?? null,
    stage: input.stage ?? "lead",
    value: input.value ?? null,
    next_action: input.next_action ?? null,
    next_date: input.next_date ?? null,
    notes: input.notes ?? null,
  };
}

function supabaseOps(): OpsStore {
  const db = getSupabaseAdmin();
  const check = <T>({ data, error }: { data: T; error: { message: string } | null }) => {
    if (error) throw new Error(error.message);
    return data;
  };
  return {
    async listFinance(from, to) {
      const rows = check(await db.from("life_finance").select("*").gte("date", from).lte("date", to).order("date"));
      return (rows as FinanceEntry[]).map((r) => ({ ...r, amount: Number(r.amount) }));
    },
    async addFinance(input) {
      const row = check(await db.from("life_finance").insert(toEntry(input)).select("*").single()) as FinanceEntry;
      return { ...row, amount: Number(row.amount) };
    },
    async deleteFinance(id) {
      return (check(await db.from("life_finance").delete().eq("id", id).select("id")) ?? []).length > 0;
    },
    async listDeals() {
      const rows = check(await db.from("life_deals").select("*").order("updated_at", { ascending: false })) as Deal[];
      return rows.map((d) => ({ ...d, value: d.value === null ? null : Number(d.value) }));
    },
    async addDeal(input) {
      return check(await db.from("life_deals").insert(toDeal(input)).select("*").single()) as Deal;
    },
    async updateDeal(id, patch) {
      return check(
        await db.from("life_deals").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select("*").maybeSingle(),
      ) as Deal | null;
    },
    async deleteDeal(id) {
      return (check(await db.from("life_deals").delete().eq("id", id).select("id")) ?? []).length > 0;
    },
    async getActivity(date) {
      const row = check(await db.from("life_activity").select("*").eq("date", date).maybeSingle()) as Activity | null;
      return row ?? emptyActivity(date);
    },
    async listActivity(from, to) {
      return check(await db.from("life_activity").select("*").gte("date", from).lte("date", to).order("date")) as Activity[];
    },
    async bumpActivity(date, deltas) {
      const next = applyDeltas(await this.getActivity(date), deltas);
      return check(await db.from("life_activity").upsert(next).select("*").single()) as Activity;
    },
  };
}

type OpsMemory = { finance: FinanceEntry[]; deals: Deal[]; activity: Map<string, Activity> };
const globalForOps = globalThis as unknown as { __lifeOps?: OpsMemory };

function memoryOps(): OpsStore {
  const stamp = () => new Date().toISOString();
  const today = israelToday();
  const seed: OpsMemory = {
    finance: [],
    deals: [
      {
        id: crypto.randomUUID(),
        created_at: stamp(),
        updated_at: stamp(),
        ...toDeal({
          name: "דיבי פלאסט",
          contact: "חברת בדים, עובדים עם דפים",
          stage: "meeting",
          value: 23_500,
          next_action: "לקבוע מחדש את הפגישה שלא התקיימה",
          next_date: addDays(today, 1),
          notes: "יש מערכת מוכנה להדגמה. הצעה: 3 אפשרויות, המומלצת 23,500 ₪ + מע״מ.",
        }),
      },
    ],
    activity: new Map(),
  };
  const mem = (globalForOps.__lifeOps ??= seed);

  return {
    async listFinance(from, to) {
      return mem.finance.filter((e) => e.date >= from && e.date <= to).sort((a, b) => a.date.localeCompare(b.date));
    },
    async addFinance(input) {
      const entry: FinanceEntry = { id: crypto.randomUUID(), created_at: stamp(), ...toEntry(input) };
      mem.finance.push(entry);
      return { ...entry };
    },
    async deleteFinance(id) {
      const before = mem.finance.length;
      mem.finance = mem.finance.filter((e) => e.id !== id);
      return mem.finance.length < before;
    },
    async listDeals() {
      return [...mem.deals].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).map((d) => ({ ...d }));
    },
    async addDeal(input) {
      const deal: Deal = { id: crypto.randomUUID(), created_at: stamp(), updated_at: stamp(), ...toDeal(input) };
      mem.deals.push(deal);
      return { ...deal };
    },
    async updateDeal(id, patch) {
      const deal = mem.deals.find((d) => d.id === id);
      if (!deal) return null;
      Object.assign(deal, patch, { updated_at: stamp() });
      return { ...deal };
    },
    async deleteDeal(id) {
      const before = mem.deals.length;
      mem.deals = mem.deals.filter((d) => d.id !== id);
      return mem.deals.length < before;
    },
    async getActivity(date) {
      return { ...(mem.activity.get(date) ?? emptyActivity(date)) };
    },
    async listActivity(from, to) {
      return [...mem.activity.values()].filter((a) => a.date >= from && a.date <= to).sort((a, b) => a.date.localeCompare(b.date));
    },
    async bumpActivity(date, deltas) {
      const next = applyDeltas(mem.activity.get(date) ?? emptyActivity(date), deltas);
      mem.activity.set(date, next);
      return { ...next };
    },
  };
}

export function getOpsStore(): OpsStore {
  return isSupabaseConfigured() ? supabaseOps() : memoryOps();
}
