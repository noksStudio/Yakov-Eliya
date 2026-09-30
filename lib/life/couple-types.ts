import { z } from "zod";
import { dateSchema } from "./schemas";
import { addDays } from "./time";

// Relationship: what the couple advisor knows about his wife, the dates that matter, and gift
// ideas. Client-safe (types, schemas, date maths); the store lives in couple.ts.

export const coupleProfileSchema = z.object({
  partner_name: z.string().trim().max(60).nullable(),
  birthday: dateSchema.nullable(),
  anniversary: dateSchema.nullable(),
  likes: z.array(z.string().trim().min(1).max(80)).max(40),
  dislikes: z.array(z.string().trim().min(1).max(80)).max(40),
  /** Clothes, shoes, ring: whatever helps buy a gift that fits. */
  sizes: z.string().trim().max(200).nullable(),
  gift_budget: z.number().int().min(0).max(100_000).nullable(),
  /** What makes her feel loved (words, time together, gifts, help, touch), in his words. */
  love_language: z.string().trim().max(200).nullable(),
  notes: z.string().trim().max(2000).nullable(),
});
export type CoupleProfile = z.infer<typeof coupleProfileSchema>;

export const GIFT_STATUSES = ["idea", "bought", "given"] as const;
export type GiftStatus = (typeof GIFT_STATUSES)[number];
export const GIFT_STATUS_LABELS: Record<GiftStatus, string> = { idea: "רעיון", bought: "נקנה", given: "ניתן" };

export const newGiftSchema = z.object({
  title: z.string().trim().min(1).max(120),
  occasion: z.string().trim().max(60).nullable().optional(),
  price: z.number().int().min(0).max(100_000).nullable().optional(),
  link: z.string().trim().url().max(500).nullable().optional(),
});
export const giftPatchSchema = newGiftSchema.partial().extend({ status: z.enum(GIFT_STATUSES).optional() });
export type Gift = {
  id: string;
  created_at: string;
  title: string;
  occasion: string | null;
  price: number | null;
  link: string | null;
  status: GiftStatus;
};

export const newSpecialDateSchema = z.object({
  title: z.string().trim().min(1).max(80),
  date: dateSchema,
  /** Every year on the same day (a birthday), or once. */
  yearly: z.boolean().default(true),
  /** A birthday: the label shows the age. */
  age: z.boolean().default(false),
  /** A big celebration (a party, a chalakah): reminders start three months ahead. */
  big: z.boolean().default(false),
});
export type SpecialDate = { id: string; title: string; date: string; yearly: boolean; age?: boolean; big?: boolean };

/** Family dates known from the start (told in chat); used until the list is first edited. */
export const DEFAULT_DATES: SpecialDate[] = [
  { id: "ilan-birthday", title: "יום ההולדת של אילן", date: "2024-05-25", yearly: true, age: true, big: true },
  { id: "my-birthday", title: "יום ההולדת שלי", date: "1997-03-10", yearly: true, age: true, big: true },
];

export type CoupleDoc = { profile: CoupleProfile; gifts: Gift[]; dates: SpecialDate[] };

export const EMPTY_PROFILE: CoupleProfile = {
  partner_name: null,
  birthday: null,
  anniversary: null,
  likes: [],
  dislikes: [],
  sizes: null,
  gift_budget: null,
  love_language: null,
  notes: null,
};

export type Occasion = {
  key: string;
  kind: "birthday" | "anniversary" | "custom";
  title: string;
  /** The next date it falls on (on or after the reference day). */
  date: string;
  daysLeft: number;
  /** Years since the original date (her age, years married), when the year is known. */
  years: number | null;
  /** Show the age in the label (birthdays). */
  age: boolean;
  /** Big celebration: reminders start earlier. */
  big: boolean;
};

/** Days before an occasion when the morning summary mentions it. */
export function reminderDays(o: Occasion) {
  return o.big ? [90, 60, 45, 30, 21, 14, 7, 3, 1, 0] : [14, 7, 3, 1, 0];
}

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
}

function isLeap(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Next occurrence of a yearly date on or after `from` (29 February falls on the 28th otherwise). */
export function nextYearly(original: string, from: string) {
  const [, m, d] = original.split("-").map(Number);
  let year = Number(from.slice(0, 4));
  for (let i = 0; i < 2; i++, year++) {
    const day = m === 2 && d === 29 && !isLeap(year) ? 28 : d;
    const candidate = `${year}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (candidate >= from) return candidate;
  }
  return addDays(from, 366);
}

/** Birthday, anniversary and custom dates, soonest first, within `horizon` days of `from`. */
export function upcomingOccasions(doc: CoupleDoc, from: string, horizon = 366): Occasion[] {
  const name = doc.profile.partner_name ?? "אשתי";
  const list: Occasion[] = [];
  const push = (key: string, kind: Occasion["kind"], title: string, original: string, yearly: boolean, extra = { age: false, big: false }) => {
    const date = yearly ? nextYearly(original, from) : original;
    const daysLeft = daysBetween(from, date);
    if (daysLeft < 0 || daysLeft > horizon) return;
    const years = yearly ? Number(date.slice(0, 4)) - Number(original.slice(0, 4)) : null;
    list.push({ key, kind, title, date, daysLeft, years: years && years > 0 ? years : null, ...extra });
  };
  if (doc.profile.birthday) push("birthday", "birthday", `יום ההולדת של ${name}`, doc.profile.birthday, true, { age: true, big: false });
  if (doc.profile.anniversary) push("anniversary", "anniversary", "יום הנישואין", doc.profile.anniversary, true);
  for (const d of doc.dates) push(`date-${d.id}`, "custom", d.title, d.date, d.yearly, { age: Boolean(d.age), big: Boolean(d.big) });
  return list.sort((a, b) => a.daysLeft - b.daysLeft);
}

/** Label with the round number when known: "יום ההולדת של נועה (30)", "יום הנישואין (5 שנים)". */
export function occasionLabel(o: Occasion) {
  if (!o.years) return o.title;
  if (o.kind === "anniversary") return `${o.title} (${o.years === 1 ? "שנה" : `${o.years} שנים`})`;
  return o.age ? `${o.title} (${o.years})` : o.title;
}
