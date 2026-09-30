import { coupleSummary, saveCoupleProfile } from "@/lib/life/couple";
import { readJson, withStore } from "@/lib/life/service";

export async function GET() {
  return withStore(async (store) => ({ couple: await coupleSummary(store) }));
}

export async function PUT(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => {
    await saveCoupleProfile(store, (body as { profile?: object }).profile ?? {});
    return { couple: await coupleSummary(store) };
  });
}
