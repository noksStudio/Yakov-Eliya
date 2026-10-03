import { getOpsStore } from "@/lib/life/ops-store";
import { pendingItems } from "@/lib/life/pending";
import { dateSchema, timeSchema } from "@/lib/life/schemas";
import { withStore } from "@/lib/life/service";
import { israelNow, israelToday, toMinutes } from "@/lib/life/time";

/** What fell behind (for the catch-up popup). `?date=&now=HH:MM` look from another moment (testing). */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  return withStore(async (store) => {
    const date = params.get("date") ? dateSchema.parse(params.get("date")) : israelToday();
    const now = params.get("now") ? timeSchema.parse(params.get("now")) : israelNow();
    return { items: await pendingItems(store, getOpsStore(), date, toMinutes(now)) };
  });
}
