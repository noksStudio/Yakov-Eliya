import { guestPatchSchema, removeGuest, updateGuest } from "@/lib/life/guests";
import { readJson, withStore } from "@/lib/life/service";

type Params = { params: Promise<{ id: string; gid: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id, gid } = await params;
  const body = await readJson(request);
  return withStore(async (store) => await updateGuest(store, id, gid, guestPatchSchema.parse(body)));
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, gid } = await params;
  return withStore(async (store) => await removeGuest(store, id, gid));
}
