import { z } from "zod";
import type { Lead, LeadStatus } from "@/lib/types";

// Client-safe lead helpers (the store is in leads.ts). A lead is someone who reached out; it
// becomes a deal only when he says there is money on the table.

export type { Lead, LeadStatus };

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "חדש",
  contacted: "יצרתי קשר",
  qualified: "מתאים",
  customer: "לקוח",
  lost: "לא רלוונטי",
};
/** Still his to handle: not yet a deal, a customer or dropped. */
export const OPEN_LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "qualified"];
export const isOpenLead = (lead: Lead) => OPEN_LEAD_STATUSES.includes(lead.status) && !lead.deal_id;
export const leadStatusLabel = (lead: Lead) => (lead.deal_id ? "הפך לעסקה" : LEAD_STATUS_LABELS[lead.status]);

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "תאריך לא תקין");

export const newLeadSchema = z.object({
  name: z.string().trim().min(1, "חסר שם").max(80),
  phone: z.string().trim().max(30).nullable().optional(),
  business_type: z.string().trim().max(120).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  follow_up_date: date.nullable().optional(),
});
export type NewLead = z.infer<typeof newLeadSchema>;

export const leadPatchSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "customer", "lost"]).optional(),
  follow_up_date: date.nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  name: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  business_type: z.string().trim().max(120).nullable().optional(),
});
export type LeadPatch = z.infer<typeof leadPatchSchema>;

export const toDealSchema = z.object({
  value: z.number().min(0).max(10_000_000).nullable().optional(),
  next_action: z.string().trim().max(160).nullable().optional(),
});

/** Israeli number → international digits (050-1234567 → 972501234567), or null. */
export function intlPhone(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 9) return null;
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return `972${digits.slice(1)}`;
  return digits;
}
export const whatsappUrl = (phone: string | null | undefined) => {
  const intl = intlPhone(phone);
  return intl ? `https://wa.me/${intl}` : null;
};
export const telUrl = (phone: string | null | undefined) => {
  const intl = intlPhone(phone);
  return intl ? `tel:+${intl}` : null;
};

/** A deal name from a lead: "משה · יבואן כלי בית". */
export const leadTitle = (lead: Pick<Lead, "name" | "business_type">) =>
  [lead.name || "ליד", lead.business_type].filter(Boolean).join(" · ").slice(0, 80);
