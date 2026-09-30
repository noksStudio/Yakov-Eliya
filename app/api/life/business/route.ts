import { businessSummary } from "@/lib/life/business";
import { getOpsStore } from "@/lib/life/ops-store";
import { withStore } from "@/lib/life/service";

export async function GET() {
  return withStore(async () => ({ business: await businessSummary(getOpsStore()) }));
}
