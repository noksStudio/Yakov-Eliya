import { DEMO_LEADS } from "@/lib/admin-demo";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { getTrack } from "@/lib/tracks";
import type { OpsStore } from "./ops-store";
import type { LifeStore } from "./store";
import { isOpenLead, leadTitle, whatsappUrl, type Lead, type LeadPatch, type NewLead } from "./lead-types";
import { escapeHtml, loadTelegram, sendMessage } from "./telegram";
import { addDays, cholHamoedOf, israelNow, israelToday, restDayOf, toMinutes, weekdayName } from "./time";

// Leads: people who reached out (the website, or someone he adds by hand). They stay here, apart
// from the deal pipeline, until he decides there is money on the table and opens a deal.
// Stored in the site's "leads" table, the same one the admin panel shows.

export * from "./lead-types";

/** A new lead as stored: what he types, plus what the website chat knows about the visitor. */
export type NewLeadRow = NewLead & {
  source: "site" | "manual";
  pain?: string | null;
  track_slug?: string | null;
  conversation_id?: string | null;
};

export interface LeadsStore {
  list(): Promise<Lead[]>;
  get(id: string): Promise<Lead | null>;
  add(input: NewLeadRow): Promise<Lead>;
  update(id: string, patch: LeadPatch & { deal_id?: string | null }): Promise<Lead | null>;
}

// Columns added after the table was first created (supabase/schema.sql). Until he re-runs that
// file they may be missing, so a new lead is still saved without them.
const LATE_COLUMNS = ["follow_up_date", "source", "deal_id"] as const;
const missingColumn = (message: string) => /column|schema cache/i.test(message);

function supabaseLeads(): LeadsStore {
  const db = getSupabaseAdmin();
  return {
    async list() {
      const { data, error } = await db.from("leads").select("*").order("created_at", { ascending: false }).limit(300);
      if (error) throw new Error(error.message);
      return (data ?? []) as Lead[];
    },
    async get(id) {
      const { data, error } = await db.from("leads").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data as Lead | null;
    },
    async add(input) {
      const row = { status: "new", ...input };
      let result = await db.from("leads").insert(row).select("*").single();
      if (result.error && missingColumn(result.error.message)) {
        const basic = Object.fromEntries(Object.entries(row).filter(([k]) => !(LATE_COLUMNS as readonly string[]).includes(k)));
        result = await db.from("leads").insert(basic).select("*").single();
      }
      if (result.error) throw new Error(result.error.message);
      return result.data as Lead;
    },
    async update(id, patch) {
      const { data, error } = await db.from("leads").update(patch).eq("id", id).select("*").maybeSingle();
      if (error) {
        throw new Error(missingColumn(error.message) ? "צריך להריץ שוב את קוד טבלאות האתר (הגדרות ← חיבור המערכת)" : error.message);
      }
      return data as Lead | null;
    },
  };
}

const globalForLeads = globalThis as unknown as { __lifeLeads?: Lead[] };

function memoryLeads(): LeadsStore {
  const today = israelToday();
  // The admin panel's sample leads, with follow-up dates so the demo shows due and upcoming ones.
  const mem = (globalForLeads.__lifeLeads ??= DEMO_LEADS.map((l, i) => ({
    ...l,
    source: "site",
    deal_id: null,
    follow_up_date: l.status === "new" || l.status === "contacted" ? addDays(today, i === 0 ? 0 : i === 1 ? 1 : -1) : null,
  })));
  return {
    async list() {
      return [...mem].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((l) => ({ ...l }));
    },
    async get(id) {
      const lead = mem.find((l) => l.id === id);
      return lead ? { ...lead } : null;
    },
    async add(input) {
      const lead: Lead = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        name: input.name,
        phone: input.phone ?? null,
        email: null,
        business_type: input.business_type ?? null,
        pain: input.pain ?? null,
        track_slug: input.track_slug ?? null,
        gender: null,
        age: null,
        status: "new",
        notes: input.notes ?? null,
        conversation_id: input.conversation_id ?? null,
        follow_up_date: input.follow_up_date ?? null,
        deal_id: null,
        source: input.source,
      };
      mem.push(lead);
      return { ...lead };
    },
    async update(id, patch) {
      const lead = mem.find((l) => l.id === id);
      if (!lead) return null;
      Object.assign(lead, patch);
      return { ...lead };
    },
  };
}

export function getLeadsStore(): LeadsStore {
  return isSupabaseConfigured() ? supabaseLeads() : memoryLeads();
}

/**
 * When to get back to a new lead: the same day if it came in before 16:00, otherwise the next
 * day; never on Shabbat, Yom Tov, the eve of one after 14:00, or (when he takes it off) Chol HaMoed.
 */
export function firstFollowUp(now = new Date(), { cholHamoedOff = true } = {}) {
  const today = israelToday(now);
  const minutes = toMinutes(israelNow(now));
  const eveLate = restDayOf(addDays(today, 1)) !== null && minutes >= toMinutes("14:00");
  let date = minutes >= toMinutes("16:00") || eveLate ? addDays(today, 1) : today;
  const off = (d: string) => restDayOf(d) !== null || (cholHamoedOff && cholHamoedOf(d) !== null);
  while (off(date)) date = addDays(date, 1);
  return date;
}

/** The date a lead is due, for rows from before follow-up dates existed: the day it came in. */
export const dueDate = (lead: Lead) => lead.follow_up_date ?? lead.created_at.slice(0, 10);

/** Open leads to get back to by `date` (overdue first). */
export function dueLeads(leads: Lead[], date = israelToday()) {
  return leads.filter((l) => isOpenLead(l) && dueDate(l) <= date).sort((a, b) => dueDate(a).localeCompare(dueDate(b)));
}

export const PHONE_RE = /(?:\+?972[-\s]?|0)(?:[2-9]\d?)[-\s]?\d{3}[-\s]?\d{4}/;

/**
 * Deals left in the old "ליד" stage become leads (a lead is not a deal). Runs where deals or
 * leads are loaded; a no-op once there are none. If the leads table is not there yet, the deal
 * moves to "שיחת היכרות" instead of disappearing from the board.
 */
export async function migrateLeadDeals(ops: OpsStore, leads = getLeadsStore()) {
  const old = (await ops.listDeals()).filter((d) => (d.stage as string) === "lead");
  for (const deal of old) {
    try {
      const phone = deal.contact?.match(PHONE_RE)?.[0] ?? null;
      const notes = [phone ? null : deal.contact, deal.next_action, deal.notes].filter(Boolean).join("\n") || null;
      await leads.add({ name: deal.name, phone, notes, follow_up_date: deal.next_date ?? israelToday(), source: "manual" });
      await ops.deleteDeal(deal.id);
    } catch (error) {
      console.error("[leads] migrate", error);
      await ops.updateDeal(deal.id, { stage: "call" });
    }
  }
}

/** "There is money here": opens a deal from the lead and links the two. */
export async function leadToDeal(ops: OpsStore, leads: LeadsStore, id: string, input: { value?: number | null; next_action?: string | null }) {
  const lead = await leads.get(id);
  if (!lead) return null;
  if (lead.deal_id) return { lead, deal: (await ops.listDeals()).find((d) => d.id === lead.deal_id) ?? null };
  const notes = [lead.pain ? `הקושי: ${lead.pain}` : null, lead.notes].filter(Boolean).join("\n") || null;
  const deal = await ops.addDeal({
    name: leadTitle(lead),
    contact: lead.phone,
    stage: "call",
    value: input.value ?? null,
    next_action: input.next_action || "שיחת היכרות",
    next_date: israelToday(),
    notes,
  });
  const updated = await leads.update(id, { status: "qualified", deal_id: deal.id });
  return { lead: updated ?? lead, deal };
}

/**
 * Right away in Telegram: who, what they need, and a WhatsApp button. Same quiet rules as the
 * scheduled nudges (Shabbat, Yom Tov, the eve after 14:00, and Chol HaMoed when he takes it off);
 * then the lead waits for the first working morning's message.
 */
export async function notifyLeadTelegram(store: LifeStore, lead: Lead, origin: string, now = new Date()) {
  const today = israelToday(now);
  if (restDayOf(today) || (restDayOf(addDays(today, 1)) && toMinutes(israelNow(now)) >= toMinutes("14:00"))) return;
  const settings = await store.getSettings().catch(() => null);
  if ((settings?.chol_hamoed_off ?? true) && cholHamoedOf(today)) return;
  const telegram = await loadTelegram(store);
  if (!telegram.chat_id) return;
  const track = lead.track_slug ? getTrack(lead.track_slug)?.title : null;
  const due = dueDate(lead);
  const lines = [
    `🔔 <b>ליד חדש${lead.source === "manual" ? "" : " מהאתר"}</b>`,
    `<b>${escapeHtml(lead.name ?? "בלי שם")}</b>${lead.business_type ? ` · ${escapeHtml(lead.business_type)}` : ""}`,
    ...(lead.pain ? [`הקושי: ${escapeHtml(lead.pain)}`] : []),
    ...(track ? [`מסלול: ${escapeHtml(track)}`] : []),
    ...(lead.phone ? [`📞 ${escapeHtml(lead.phone)}`] : []),
    `לחזור: ${due === today ? "היום" : due === addDays(today, 1) ? "מחר" : `ב${weekdayName(due)} ${Number(due.slice(8, 10))}.${Number(due.slice(5, 7))}`}`,
  ];
  const whatsapp = whatsappUrl(lead.phone);
  await sendMessage(telegram.chat_id, lines.join("\n"), true, [
    [...(whatsapp ? [{ text: "💬 וואטסאפ", url: whatsapp }] : []), { text: "פתיחה במערכת", url: `${origin}/life/business` }],
  ]);
}
