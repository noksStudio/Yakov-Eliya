import { addGuest, newGuestSchema } from "@/lib/life/guests";
import { notFound, readJson, withStore } from "@/lib/life/service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await readJson(request);
  return withStore(async (store) => {
    if (!(await store.getEvent(id))) return notFound();
    return await addGuest(store, id, newGuestSchema.parse(body));
  });
}
