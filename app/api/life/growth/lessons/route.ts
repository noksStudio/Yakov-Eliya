import { getLessonsStore } from "@/lib/life/lessons";
import { readJson, withStore } from "@/lib/life/service";

export async function POST(request: Request) {
  const body = await readJson(request);
  return withStore(async () => ({ lesson: await getLessonsStore().add(body) }));
}
