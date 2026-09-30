import { addSpecialDate } from "@/lib/life/couple";
import { readJson, withStore } from "@/lib/life/service";

export async function POST(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => ({ date: await addSpecialDate(store, body) }));
}
