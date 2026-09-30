import type { LifeStore } from "./store";
import {
  EMPTY_PROFILE,
  coupleProfileSchema,
  giftPatchSchema,
  newGiftSchema,
  newSpecialDateSchema,
  upcomingOccasions,
  type CoupleDoc,
  type CoupleProfile,
  type Gift,
  type SpecialDate,
} from "./couple-types";
import { israelToday } from "./time";

export * from "./couple-types";

// Stored as one JSON doc ("couple"): a short profile, a few dates and a gift list.

export async function loadCouple(store: LifeStore): Promise<CoupleDoc> {
  const doc = await store.getDoc<Partial<CoupleDoc>>("couple");
  return {
    profile: { ...EMPTY_PROFILE, ...(doc?.profile ?? {}) },
    gifts: doc?.gifts ?? [],
    dates: doc?.dates ?? [],
  };
}

async function save(store: LifeStore, doc: CoupleDoc) {
  return store.saveDoc<CoupleDoc>("couple", doc);
}

export async function saveCoupleProfile(store: LifeStore, patch: Partial<CoupleProfile>) {
  const doc = await loadCouple(store);
  const profile = coupleProfileSchema.parse({ ...doc.profile, ...patch });
  await save(store, { ...doc, profile });
  return profile;
}

export async function addGift(store: LifeStore, input: unknown): Promise<Gift> {
  const parsed = newGiftSchema.parse(input);
  const gift: Gift = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    title: parsed.title,
    occasion: parsed.occasion ?? null,
    price: parsed.price ?? null,
    link: parsed.link ?? null,
    status: "idea",
  };
  const doc = await loadCouple(store);
  await save(store, { ...doc, gifts: [gift, ...doc.gifts] });
  return gift;
}

export async function updateGift(store: LifeStore, id: string, input: unknown): Promise<Gift | null> {
  const patch = giftPatchSchema.parse(input);
  const doc = await loadCouple(store);
  const gift = doc.gifts.find((g) => g.id === id);
  if (!gift) return null;
  const next = { ...gift, ...patch } as Gift;
  await save(store, { ...doc, gifts: doc.gifts.map((g) => (g.id === id ? next : g)) });
  return next;
}

export async function removeGift(store: LifeStore, id: string) {
  const doc = await loadCouple(store);
  if (!doc.gifts.some((g) => g.id === id)) return false;
  await save(store, { ...doc, gifts: doc.gifts.filter((g) => g.id !== id) });
  return true;
}

export async function addSpecialDate(store: LifeStore, input: unknown): Promise<SpecialDate> {
  const parsed = newSpecialDateSchema.parse(input);
  const date: SpecialDate = { id: crypto.randomUUID(), ...parsed };
  const doc = await loadCouple(store);
  await save(store, { ...doc, dates: [...doc.dates, date] });
  return date;
}

export async function removeSpecialDate(store: LifeStore, id: string) {
  const doc = await loadCouple(store);
  if (!doc.dates.some((d) => d.id === id)) return false;
  await save(store, { ...doc, dates: doc.dates.filter((d) => d.id !== id) });
  return true;
}

export async function coupleSummary(store: LifeStore, today = israelToday()) {
  const doc = await loadCouple(store);
  return { ...doc, upcoming: upcomingOccasions(doc, today) };
}

export type CoupleSummary = Awaited<ReturnType<typeof coupleSummary>>;
