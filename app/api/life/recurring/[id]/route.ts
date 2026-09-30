import { removeRecurring } from "@/lib/life/recurring";
import { notFound, withStore } from "@/lib/life/service";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withStore(async (store) => ((await removeRecurring(store, id)) ? { ok: true } : notFound()));
}
