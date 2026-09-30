import { businessSummary } from "@/lib/life/business";
import { migrateLeadDeals } from "@/lib/life/leads";
import { getOpsStore } from "@/lib/life/ops-store";
import { withStore } from "@/lib/life/service";

export async function GET() {
  return withStore(async () => {
    // Old "ליד"-stage deals move to the leads list before the board is shown.
    await migrateLeadDeals(getOpsStore());
    return { business: await businessSummary(getOpsStore()) };
  });
}
