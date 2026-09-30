import { addGoal } from "@/lib/life/growth";
import { readJson, withStore } from "@/lib/life/service";

export async function POST(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => ({ goal: await addGoal(store, body) }));
}
