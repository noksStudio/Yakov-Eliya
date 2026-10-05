import { z } from "zod";
import { readJson, withStore } from "@/lib/life/service";
import { goToSleep, sleepStatus, wakeUp } from "@/lib/life/sleep";

/** Sleep status: bedtime, the target, and whether "הולך לישון" is open. */
export async function GET() {
  return withStore(async (store) => ({ sleep: await sleepStatus(store) }));
}

/**
 * {action: "sleep"} when getting into bed, {action: "wake"} on waking up; with slept_at ("23:30")
 * when "הולך לישון" was not tapped at night.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => {
    const { action, slept_at } = z
      .object({ action: z.enum(["sleep", "wake"]), slept_at: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional() })
      .parse(body);
    if (action === "sleep") {
      await goToSleep(store);
      return { sleep: await sleepStatus(store) };
    }
    const r = await wakeUp(store, new Date(), slept_at);
    if ("error" in r) return Response.json({ error: r.error }, { status: 400 });
    return { woke: r, sleep: await sleepStatus(store) };
  });
}
