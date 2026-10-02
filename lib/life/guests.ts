import { z } from "zod";
import type { LifeStore } from "./store";

// Guests for an event (who he is inviting to Lina's wedding, a birthday…): one doc keyed by
// event id, so no table changes. Each guest goes "להזמין" → "הוזמן" (no answer yet, the "?") →
// "מגיע" / "לא מגיע", with how many people come with them.

export const GUEST_STATUSES = ["todo", "invited", "yes", "no"] as const;
export type GuestStatus = (typeof GUEST_STATUSES)[number];
export type Guest = { id: string; name: string; phone: string | null; status: GuestStatus; count: number; note: string | null };
type EventGuests = { invite_text: string | null; guests: Guest[] };
type GuestsDoc = Record<string, EventGuests>;

export const newGuestSchema = z.object({
  name: z.string().trim().min(1, "חסר שם").max(60),
  phone: z.string().trim().max(30).nullable().optional(),
  count: z.number().int().min(1).max(20).optional(),
});
export const guestPatchSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  status: z.enum(GUEST_STATUSES).optional(),
  count: z.number().int().min(1).max(20).optional(),
  note: z.string().trim().max(200).nullable().optional(),
});

const empty = (): EventGuests => ({ invite_text: null, guests: [] });

async function load(store: LifeStore) {
  return (await store.getDoc<GuestsDoc>("event_guests")) ?? {};
}

export async function eventGuests(store: LifeStore, eventId: string): Promise<EventGuests> {
  return (await load(store))[eventId] ?? empty();
}

async function update(store: LifeStore, eventId: string, fn: (current: EventGuests) => EventGuests) {
  const doc = await load(store);
  doc[eventId] = fn(doc[eventId] ?? empty());
  await store.saveDoc<GuestsDoc>("event_guests", doc);
  return doc[eventId];
}

export const setInviteText = (store: LifeStore, eventId: string, text: string | null) =>
  update(store, eventId, (c) => ({ ...c, invite_text: text?.trim().slice(0, 1000) || null }));

export const addGuest = (store: LifeStore, eventId: string, input: z.infer<typeof newGuestSchema>) =>
  update(store, eventId, (c) => ({
    ...c,
    guests: [...c.guests, { id: crypto.randomUUID(), name: input.name, phone: input.phone ?? null, status: "todo", count: input.count ?? 1, note: null }],
  }));

export const updateGuest = (store: LifeStore, eventId: string, guestId: string, patch: z.infer<typeof guestPatchSchema>) =>
  update(store, eventId, (c) => ({ ...c, guests: c.guests.map((g) => (g.id === guestId ? { ...g, ...patch } : g)) }));

export const removeGuest = (store: LifeStore, eventId: string, guestId: string) =>
  update(store, eventId, (c) => ({ ...c, guests: c.guests.filter((g) => g.id !== guestId) }));

/** "מגיעים 12 · לא 3 · ? 4 · להזמין 2": people coming counts the +1s. */
export function guestSummary(guests: Guest[]) {
  const sum = (s: GuestStatus) => guests.filter((g) => g.status === s);
  return {
    coming: sum("yes").reduce((n, g) => n + g.count, 0),
    no: sum("no").length,
    waiting: sum("invited").length,
    todo: sum("todo").length,
  };
}
