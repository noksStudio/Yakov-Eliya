import { z } from "zod";
import { getOpsStore } from "@/lib/life/ops-store";
import { insightsFor, listRules, setRuleEnabled } from "@/lib/life/rules";
import { dateSchema, timeSchema } from "@/lib/life/schemas";
import { notFound, readJson, withStore } from "@/lib/life/service";
import { israelNow, israelToday, toMinutes } from "@/lib/life/time";

/**
 * GET: every rule with its on/off state. `?place=today` instead returns today's conclusions for
 * that place (`&date=&now=HH:MM` look from another moment, for testing).
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  return withStore(async (store) => {
    const place = params.get("place");
    if (place === "today" || place === "assistant" || place === "morning") {
      const date = params.get("date") ? dateSchema.parse(params.get("date")) : israelToday();
      const now = params.get("now") ? timeSchema.parse(params.get("now")) : israelNow();
      return { insights: await insightsFor(store, getOpsStore(), place, date, toMinutes(now)) };
    }
    return { rules: await listRules(store) };
  });
}

/** Turns one rule on or off. */
export async function PUT(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => {
    const { id, enabled } = z.object({ id: z.string().min(1).max(60), enabled: z.boolean() }).parse(body);
    return (await setRuleEnabled(store, id, enabled)) ? { rules: await listRules(store) } : notFound();
  });
}
