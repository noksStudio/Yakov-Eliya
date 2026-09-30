import { financeSummary } from "@/lib/life/finance";
import { getOpsStore } from "@/lib/life/ops-store";
import { financeEntrySchema } from "@/lib/life/ops-types";
import { readJson, withStore } from "@/lib/life/service";

export async function GET() {
  return withStore(async (store) => ({ finance: await financeSummary(store, getOpsStore()) }));
}

export async function POST(request: Request) {
  const body = await readJson(request);
  return withStore(async () => ({ entry: await getOpsStore().addFinance(financeEntrySchema.parse(body)) }));
}
