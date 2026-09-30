import { mindSummary } from "@/lib/life/mind";
import { withStore } from "@/lib/life/service";

export async function GET() {
  return withStore(async (store) => ({ mind: await mindSummary(store) }));
}
