import type { OpsStore } from "./ops-store";
import { ACTIVITY_TARGETS, OPEN_STAGES, type Activity, type Deal } from "./ops-types";
import { israelToday } from "./time";

export type BusinessSummary = {
  deals: Deal[];
  openValue: number;
  openCount: number;
  wonThisMonth: number;
  /** Open deals whose next step is due today or overdue. */
  due: Deal[];
  activity: Activity;
  activityDone: number;
  activityTarget: number;
};

export async function businessSummary(ops: OpsStore, date = israelToday()): Promise<BusinessSummary> {
  const [deals, activity] = await Promise.all([ops.listDeals(), ops.getActivity(date)]);
  const open = deals.filter((d) => OPEN_STAGES.includes(d.stage));
  const month = date.slice(0, 7);
  return {
    deals,
    openValue: open.reduce((s, d) => s + (d.value ?? 0), 0),
    openCount: open.length,
    wonThisMonth: deals.filter((d) => d.stage === "won" && d.updated_at.slice(0, 7) === month).reduce((s, d) => s + (d.value ?? 0), 0),
    due: open.filter((d) => d.next_date && d.next_date <= date).sort((a, b) => (a.next_date ?? "").localeCompare(b.next_date ?? "")),
    activity,
    activityDone: activity.connections + activity.followups + activity.calls,
    activityTarget: ACTIVITY_TARGETS.connections + ACTIVITY_TARGETS.followups + ACTIVITY_TARGETS.calls,
  };
}
