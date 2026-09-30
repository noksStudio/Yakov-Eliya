import { getJournalStore } from "@/lib/life/journal";
import { notFound, withStore } from "@/lib/life/service";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withStore(async () => ((await getJournalStore().remove(id)) ? { ok: true } : notFound()));
}
