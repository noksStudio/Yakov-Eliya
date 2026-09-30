import { getOpsStore } from "@/lib/life/ops-store";
import { dealPatchSchema } from "@/lib/life/ops-types";
import { notFound, readJson, withStore } from "@/lib/life/service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await readJson(request);
  return withStore(async () => {
    const deal = await getOpsStore().updateDeal(id, dealPatchSchema.parse(body));
    return deal ? { deal } : notFound();
  });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  return withStore(async () => ((await getOpsStore().deleteDeal(id)) ? { ok: true } : notFound()));
}
