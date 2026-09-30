import { getIdeasStore } from "@/lib/life/ideas";
import { readJson, withStore } from "@/lib/life/service";

export async function GET() {
  return withStore(async () => ({ ideas: await getIdeasStore().list() }));
}

export async function POST(request: Request) {
  const body = await readJson(request);
  return withStore(async () => ({ idea: await getIdeasStore().add(body) }));
}
