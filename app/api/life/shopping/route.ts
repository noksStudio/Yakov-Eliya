import { z } from "zod";
import { shoppingSeedSchema } from "@/lib/life/body-types";
import { loadBodyPlan } from "@/lib/life/body";
import { readJson, withStore } from "@/lib/life/service";

export async function GET() {
  return withStore(async (store) => ({ items: await store.listShopping() }));
}

const addSchema = z.union([z.object({ fromPlan: z.literal(true) }), z.object({ items: z.array(shoppingSeedSchema).min(1).max(80) })]);

export async function POST(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => {
    const input = addSchema.parse(body);
    const items = "fromPlan" in input ? (await loadBodyPlan(store)).meals.shopping : input.items;
    return { added: await store.addShopping(items) };
  });
}

/** Clears everything already bought. */
export async function DELETE() {
  return withStore(async (store) => ({ removed: await store.clearCheckedShopping() }));
}
