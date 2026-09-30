import { checkinPatchSchema, dateSchema } from "@/lib/life/schemas";
import { readJson, withStore } from "@/lib/life/service";

export async function PUT(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => {
    const date = dateSchema.parse(body.date);
    return { checkin: await store.saveCheckin(date, checkinPatchSchema.parse(body.patch ?? {})) };
  });
}
