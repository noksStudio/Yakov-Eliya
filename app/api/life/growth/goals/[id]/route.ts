import { removeGoal, updateGoal } from "@/lib/life/growth";
import { notFound, readJson, withStore } from "@/lib/life/service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await readJson(request);
  return withStore(async (store) => {
    const goal = await updateGoal(store, id, body);
    return goal ? { goal } : notFound();
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  return withStore(async (store) => ((await removeGoal(store, id)) ? { ok: true } : notFound()));
}
