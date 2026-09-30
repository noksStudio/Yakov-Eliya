import { settingsPatchSchema } from "@/lib/life/schemas";
import { readJson, withStore } from "@/lib/life/service";

export async function GET() {
  return withStore(async (store) => ({ settings: await store.getSettings() }));
}

export async function PUT(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => ({ settings: await store.saveSettings(settingsPatchSchema.parse(body)) }));
}
