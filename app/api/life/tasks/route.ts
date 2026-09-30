import { newTaskSchema } from "@/lib/life/schemas";
import { readJson, withStore } from "@/lib/life/service";

export async function POST(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => ({ task: await store.addTask(newTaskSchema.parse(body)) }));
}
