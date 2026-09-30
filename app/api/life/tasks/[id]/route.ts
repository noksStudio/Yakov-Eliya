import { taskPatchSchema } from "@/lib/life/schemas";
import { notFound, readJson, withStore } from "@/lib/life/service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await readJson(request);
  return withStore(async (store) => {
    const task = await store.updateTask(id, taskPatchSchema.parse(body));
    return task ? { task } : notFound();
  });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  return withStore(async (store) => ((await store.deleteTask(id)) ? { ok: true } : notFound()));
}
