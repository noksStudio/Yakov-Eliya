import type { LifeStore } from "./store";
import type { OpsStore } from "./ops-store";
import type { Checkin } from "./types";
import { OPEN_STAGES, type DealStage } from "./ops-types";
import { dueDate, dueLeads, getLeadsStore } from "./leads";
import { addDays, cholHamoedOf, israelToday, restDayOf, weekdayName } from "./time";

// "Things you didn't update": what fell behind, for the catch-up popup that opens with the app.
// Only what a tap can fix (yesterday's check-in, overdue tasks, leads and deals, a missing
// weigh-in). Nothing on Shabbat or Yom Tov; on a day off, only the personal items.

type CheckinFields = Pick<Checkin, "shacharit" | "mincha" | "arvit" | "workout" | "hitbodedut" | "day_rating">;

export type PendingItem =
  | { kind: "checkin"; id: string; date: string; label: string; checkin: CheckinFields }
  | { kind: "task"; id: string; task: { id: string; title: string; due_date: string } }
  | { kind: "lead"; id: string; lead: { id: string; name: string; phone: string | null; business_type: string | null; status: string; due: string } }
  | { kind: "deal"; id: string; deal: { id: string; name: string; stage: DealStage; next_action: string | null; next_date: string } }
  | { kind: "weight"; id: string; date: string; last: { date: string; value: number } | null }
  | { kind: "review"; id: string; week: string };

const MAX_TASKS = 8;
const WEIGH_EVERY_DAYS = 7;

/** "אתמול", or the weekday for an older day. */
export function dayLabel(date: string, today: string) {
  return date === addDays(today, -1) ? "אתמול" : weekdayName(date);
}

/**
 * The last working day before today, if its evening check-in is missing. An eve of Shabbat or
 * Yom Tov is skipped (the day ends before the check-in would), and so is anything before the
 * routine started.
 */
function checkinDay(today: string, start: string | null) {
  for (let d = addDays(today, -1), i = 0; i < 4; d = addDays(d, -1), i++) {
    if (restDayOf(d)) continue;
    if (restDayOf(addDays(d, 1)) || (start && d < start)) return null;
    return d;
  }
  return null;
}

export async function pendingItems(store: LifeStore, ops: OpsStore, today = israelToday(), reviewDue = false): Promise<PendingItem[]> {
  if (restDayOf(today)) return [];
  const settings = await store.getSettings();
  if (settings.start_date && today < settings.start_date) return [];
  const dayOff = settings.chol_hamoed_off && Boolean(cholHamoedOf(today));
  const items: PendingItem[] = [];

  const day = checkinDay(today, settings.start_date);
  const recent = await store.listCheckins(addDays(today, -30), today);
  if (day) {
    const c = recent.find((x) => x.date === day);
    if (!c || c.day_rating === null) {
      items.push({
        kind: "checkin",
        id: `checkin:${day}`,
        date: day,
        label: dayLabel(day, today),
        checkin: {
          shacharit: c?.shacharit ?? false,
          mincha: c?.mincha ?? false,
          arvit: c?.arvit ?? false,
          workout: c?.workout ?? false,
          hitbodedut: c?.hitbodedut ?? false,
          day_rating: c?.day_rating ?? null,
        },
      });
    }
  }

  // Leads and deals carry money, so they come before the tasks.
  if (!dayOff) {
    // A missing leads table (site SQL not run yet) just means no leads.
    const leads = await getLeadsStore()
      .list()
      .catch(() => []);
    for (const l of dueLeads(leads, addDays(today, -1))) {
      items.push({
        kind: "lead",
        id: `lead:${l.id}`,
        lead: { id: l.id, name: l.name ?? "ליד", phone: l.phone, business_type: l.business_type, status: l.status, due: dueDate(l) },
      });
    }

    const deals = (await ops.listDeals()).filter((d) => OPEN_STAGES.includes(d.stage) && d.next_date && d.next_date < today);
    for (const d of deals) {
      items.push({ kind: "deal", id: `deal:${d.id}`, deal: { id: d.id, name: d.name, stage: d.stage, next_action: d.next_action, next_date: d.next_date! } });
    }

    const tasks = (await store.listTasks())
      .filter((t) => !t.done && t.due_date && t.due_date < today)
      .sort((a, b) => b.due_date!.localeCompare(a.due_date!))
      .slice(0, MAX_TASKS);
    for (const t of tasks) items.push({ kind: "task", id: `task:${t.id}`, task: { id: t.id, title: t.title, due_date: t.due_date! } });
  }

  const weighed = recent.filter((c) => c.weight !== null);
  if (!weighed.some((c) => c.date > addDays(today, -WEIGH_EVERY_DAYS))) {
    const last = weighed.at(-1);
    items.push({ kind: "weight", id: `weight:${today}`, date: today, last: last ? { date: last.date, value: Number(last.weight) } : null });
  }

  if (reviewDue) items.unshift({ kind: "review", id: `review:${today}`, week: today });
  return items;
}
