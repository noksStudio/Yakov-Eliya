import { removeGift, updateGift } from "@/lib/life/couple";
import { notFound, readJson, withStore } from "@/lib/life/service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await readJson(request);
  return withStore(async (store) => {
    const gift = await updateGift(store, id, body);
    return gift ? { gift } : notFound();
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  return withStore(async (store) => ((await removeGift(store, id)) ? { ok: true } : notFound()));
}
