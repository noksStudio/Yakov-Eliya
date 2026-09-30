import { getOpsStore } from "@/lib/life/ops-store";
import { newDealSchema } from "@/lib/life/ops-types";
import { readJson, withStore } from "@/lib/life/service";

export async function POST(request: Request) {
  const body = await readJson(request);
  return withStore(async () => ({ deal: await getOpsStore().addDeal(newDealSchema.parse(body)) }));
}
