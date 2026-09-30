import { withStore } from "@/lib/life/service";
import { spiritSummary } from "@/lib/life/spirit";

export async function GET() {
  return withStore(async (store) => ({ spirit: await spiritSummary(store) }));
}
