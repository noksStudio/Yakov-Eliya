import { growthSummary } from "@/lib/life/growth";
import { getOpsStore } from "@/lib/life/ops-store";
import { withStore } from "@/lib/life/service";

export async function GET() {
  return withStore(async (store) => ({ growth: await growthSummary(store, getOpsStore()) }));
}
