import { z } from "zod";
import { readJson, withStore } from "@/lib/life/service";
import { goToSleep, sleepStatus, wakeUp } from "@/lib/life/sleep";

/** Sleep status: bedtime, the target, and whether "הולך לישון" is open. */
export async function GET() {
  return withStore(async (store) => ({ sleep: await sleepStatus(store) }));
}

/** {action: "sleep"} when getting into bed, {action: "wake"} on waking up. */
export async function POST(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => {
    const { action } = z.object({ action: z.enum(["sleep", "wake"]) }).parse(body);
    if (action === "sleep") {
      await goToSleep(store);
      return { sleep: await sleepStatus(store) };
    }
    const r = await wakeUp(store);
    if ("error" in r) return Response.json({ error: r.error }, { status: 400 });
    return { woke: r, sleep: await sleepStatus(store) };
  });
}
