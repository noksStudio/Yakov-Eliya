import { getOpsStore } from "@/lib/life/ops-store";
import { searchAll } from "@/lib/life/search";
import { withStore } from "@/lib/life/service";

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 100);
  return withStore(async (store) => ({ results: await searchAll(store, getOpsStore(), q) }));
}
