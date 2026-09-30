import { z } from "zod";
import { getOpsStore } from "@/lib/life/ops-store";
import { activityPatchSchema } from "@/lib/life/ops-types";
import { dateSchema } from "@/lib/life/schemas";
import { readJson, withStore } from "@/lib/life/service";
import { israelToday } from "@/lib/life/time";

const bodySchema = z.object({ date: dateSchema.optional(), deltas: activityPatchSchema });

/** Adds to today's outreach counters (negative deltas undo). */
export async function PUT(request: Request) {
  const body = await readJson(request);
  return withStore(async () => {
    const { date, deltas } = bodySchema.parse(body);
    return { activity: await getOpsStore().bumpActivity(date ?? israelToday(), deltas) };
  });
}
