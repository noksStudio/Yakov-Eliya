import { getIdeasStore } from "@/lib/life/ideas";
import { notFound, readJson, withStore } from "@/lib/life/service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  return withStore(async () => {
    const idea = await getIdeasStore().get(id);
    return idea ? { idea } : notFound();
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await readJson(request);
  return withStore(async () => {
    const idea = await getIdeasStore().update(id, body);
    return idea ? { idea } : notFound();
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  return withStore(async () => ((await getIdeasStore().remove(id)) ? { ok: true } : notFound()));
}
