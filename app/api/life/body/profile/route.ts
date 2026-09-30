import { bodyProfileSchema } from "@/lib/life/body-types";
import { loadBodyPlan } from "@/lib/life/body";
import { readJson, withStore } from "@/lib/life/service";

export async function PUT(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => {
    const { profile } = await loadBodyPlan(store);
    const next = bodyProfileSchema.parse({ ...profile, ...body });
    return { profile: await store.saveDoc("body_profile", next) };
  });
}
