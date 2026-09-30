import { getOpsStore } from "@/lib/life/ops-store";
import { notFound, withStore } from "@/lib/life/service";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withStore(async () => ((await getOpsStore().deleteFinance(id)) ? { ok: true } : notFound()));
}
