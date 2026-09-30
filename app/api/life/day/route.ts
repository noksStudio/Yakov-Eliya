import { dateSchema } from "@/lib/life/schemas";
import { loadDay, withStore } from "@/lib/life/service";
import { israelToday } from "@/lib/life/time";

export async function GET(request: Request) {
  const param = new URL(request.url).searchParams.get("date");
  return withStore(async (store) => {
    const date = param ? dateSchema.parse(param) : israelToday();
    return { day: await loadDay(store, date) };
  });
}
