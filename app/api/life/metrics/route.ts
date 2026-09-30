import { computeMetrics } from "@/lib/life/metrics";
import { getOpsStore } from "@/lib/life/ops-store";
import { withStore } from "@/lib/life/service";

export async function GET() {
  return withStore(async (store) => ({ metrics: await computeMetrics(store, getOpsStore()) }));
}
