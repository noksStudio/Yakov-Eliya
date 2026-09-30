import { z } from "zod";
import type { OpsStore } from "./ops-store";
import type { LifeStore } from "./store";
import type { IntegrationKey } from "./integrations";
import { firstFollowUp, getLeadsStore, leadTitle, type Lead } from "./leads";
import { escapeHtml, loadTelegram, sendMessage } from "./telegram";
import { addDays, cholHamoedOf, israelNow, israelToday, restDayOf, toMinutes } from "./time";

// What a connected system (Bossi) sends to /api/intake, and what it does here.
// Bossi sends every lead it creates or updates, and every call made. The filtering is here, so
// the rule can change without touching Bossi: only hot leads (worth a follow-up) and closings
// show up in the leads list; the rest only count as sales activity.

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");
const text = (max: number) => z.string().trim().max(max).nullable().optional();

/** Lead statuses as Bossi sends them. */
export const INTAKE_STATUSES = ["new", "cold", "hot", "won", "lost"] as const;

export const intakeEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("lead"),
    /** Any unique id for this event; a retry with the same id is ignored. */
    event_id: z.string().max(100).optional(),
    lead: z.object({
      external_id: z.string().trim().min(1).max(100),
      name: z.string().trim().min(1).max(80),
      phone: text(30),
      email: text(120),
      business_type: text(120),
      status: z.enum(INTAKE_STATUSES),
      notes: text(2000),
      follow_up_date: date.nullable().optional(),
      /** The deal's value in ₪, with status "won". */
      value: z.number().min(0).max(10_000_000).nullable().optional(),
    }),
  }),
  z.object({
    type: z.literal("call"),
    event_id: z.string().max(100).optional(),
    /** Calls made (default 1). */
    count: z.number().int().min(1).max(100).default(1),
    /** Israel date of the calls (default today). */
    date: date.optional(),
  }),
]);
export type IntakeEventInput = z.infer<typeof intakeEventSchema>;
type LeadInput = Extract<IntakeEventInput, { type: "lead" }>["lead"];

export type IntakeResult = { result: "created" | "updated" | "won" | "ignored" | "counted" | "duplicate"; lead_id?: string; detail?: string };

const quiet = (now: Date) => {
  const today = israelToday(now);
  return restDayOf(today) !== null || (restDayOf(addDays(today, 1)) !== null && toMinutes(israelNow(now)) >= toMinutes("14:00")) || cholHamoedOf(today) !== null;
};

async function celebrate(store: LifeStore, source: string, lead: Lead, value: number | null, origin: string, now: Date) {
  if (quiet(now)) return;
  const telegram = await loadTelegram(store);
  if (!telegram.chat_id) return;
  const lines = [
    `🎉 <b>נסגרה עסקה ב־${escapeHtml(source)}</b>`,
    `<b>${escapeHtml(lead.name ?? "")}</b>${lead.business_type ? ` · ${escapeHtml(lead.business_type)}` : ""}`,
    ...(value ? [`💰 ${Math.round(value).toLocaleString("he-IL")} ₪`] : []),
  ];
  await sendMessage(telegram.chat_id, lines.join("\n"), true, [[{ text: "לוח העסקאות", url: `${origin}/life/business` }]]);
}

async function handleLead(store: LifeStore, ops: OpsStore, integration: IntegrationKey, input: LeadInput, origin: string, now: Date): Promise<IntakeResult> {
  const leads = getLeadsStore();
  const existing = await leads.findExternal(integration.source, input.external_id);
  // Cold and new leads stay in Bossi; they show up here once they turn hot or close.
  if (!existing && (input.status === "new" || input.status === "cold" || input.status === "lost")) {
    return { result: "ignored", detail: `status ${input.status}` };
  }

  const settings = await store.getSettings();
  const fields = {
    name: input.name,
    phone: input.phone ?? existing?.phone ?? null,
    business_type: input.business_type ?? existing?.business_type ?? null,
    notes: input.notes ?? existing?.notes ?? null,
  };
  const followUp = input.follow_up_date ?? existing?.follow_up_date ?? firstFollowUp(now, { cholHamoedOff: settings.chol_hamoed_off });
  // A hot lead he already spoke to; lost and won close it here too. New/cold keep what it had.
  const status = input.status === "hot" ? "contacted" : input.status === "lost" ? "lost" : input.status === "won" ? "customer" : (existing?.status ?? "contacted");

  let lead: Lead | null = existing
    ? await leads.update(existing.id, { ...fields, status, follow_up_date: followUp })
    : await leads.add({ ...fields, follow_up_date: followUp, source: integration.source, external_id: input.external_id });
  if (!lead) return { result: "ignored", detail: "lead vanished" };
  if (!existing && status !== "new") lead = (await leads.update(lead.id, { status })) ?? lead;

  if (input.status !== "won") return { result: existing ? "updated" : "created", lead_id: lead.id };

  // A closing: the deal is marked won (opened now if there was none), and it is worth a message.
  const value = input.value ?? null;
  const deal = lead.deal_id
    ? await ops.updateDeal(lead.deal_id, { stage: "won", ...(value !== null ? { value } : {}) })
    : await ops.addDeal({ name: leadTitle(lead), contact: lead.phone, stage: "won", value, next_action: null, next_date: null, notes: `נסגר ב־${integration.name}` });
  if (deal && !lead.deal_id) await leads.update(lead.id, { deal_id: deal.id });
  const alreadyWon = existing?.status === "customer";
  if (!alreadyWon) await celebrate(store, integration.name, lead, value, origin, now).catch((error) => console.error("[intake] telegram", error));
  return { result: "won", lead_id: lead.id };
}

export async function handleIntake(store: LifeStore, ops: OpsStore, integration: IntegrationKey, event: IntakeEventInput, origin: string, now = new Date()): Promise<IntakeResult> {
  if (event.type === "call") {
    await ops.bumpActivity(event.date ?? israelToday(now), { calls: event.count });
    return { result: "counted", detail: event.count === 1 ? "שיחה אחת" : `${event.count} שיחות` };
  }
  return handleLead(store, ops, integration, event.lead, origin, now);
}
