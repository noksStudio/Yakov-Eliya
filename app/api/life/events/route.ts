import { newEventSchema } from "@/lib/life/schemas";
import { readJson, withStore } from "@/lib/life/service";

export async function POST(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => ({ event: await store.addEvent(newEventSchema.parse(body)) }));
}
