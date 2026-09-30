import { z } from "zod";
import { shoppingCategorySchema } from "@/lib/life/body-types";
import { notFound, readJson, withStore } from "@/lib/life/service";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  qty: z.string().max(60).nullable().optional(),
  category: shoppingCategorySchema.optional(),
  checked: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await readJson(request);
  return withStore(async (store) => {
    const item = await store.updateShopping(id, patchSchema.parse(body));
    return item ? { item } : notFound();
  });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  return withStore(async (store) => ((await store.deleteShopping(id)) ? { ok: true } : notFound()));
}
