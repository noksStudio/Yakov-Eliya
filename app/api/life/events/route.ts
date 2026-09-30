import { NextResponse } from "next/server";
import { anchorConflict } from "@/lib/life/day";
import { newEventSchema } from "@/lib/life/schemas";
import { readJson, withStore } from "@/lib/life/service";
import { restDayOf } from "@/lib/life/time";

export async function POST(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => {
    const input = newEventSchema.parse(body);
    // An important one-off (a family event in the evening) may overlap an anchor once he confirms.
    const force = (body as { force?: unknown }).force === true;
    // Same rules the agents follow: no planning on Shabbat or Yom Tov, and anchors do not move.
    const rest = restDayOf(input.date);
    if (rest) return NextResponse.json({ error: `זה ${rest.name}: לא מתכננים בו.` }, { status: 409 });
    const conflict = anchorConflict(await store.getSettings(), input.start_time, input.end_time ?? null);
    if (conflict && !force) {
      return NextResponse.json({ error: `חופף ל${conflict}.`, conflict }, { status: 409 });
    }
    return { event: await store.addEvent(input) };
  });
}
