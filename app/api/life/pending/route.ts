import { getOpsStore } from "@/lib/life/ops-store";
import { pendingItems } from "@/lib/life/pending";
import { dateSchema } from "@/lib/life/schemas";
import { withStore } from "@/lib/life/service";
import { israelToday } from "@/lib/life/time";

/** What fell behind (for the catch-up popup). `?date=` looks from another day (for testing). */
export async function GET(request: Request) {
  const param = new URL(request.url).searchParams.get("date");
  return withStore(async (store) => {
    const date = param ? dateSchema.parse(param) : israelToday();
    return { items: await pendingItems(store, getOpsStore(), date) };
  });
}
