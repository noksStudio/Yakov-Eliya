import { NextResponse } from "next/server";
import { z } from "zod";
import { MAX_RANGE_DAYS, calendarRange, daysBetween } from "@/lib/life/calendar";
import { getOpsStore } from "@/lib/life/ops-store";
import { dateSchema } from "@/lib/life/schemas";
import { withStore } from "@/lib/life/service";

const rangeSchema = z.object({ from: dateSchema, to: dateSchema });

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  return withStore(async (store) => {
    const { from, to } = rangeSchema.parse(params);
    const span = daysBetween(from, to);
    if (span < 0 || span >= MAX_RANGE_DAYS) {
      return NextResponse.json({ error: `טווח של עד ${MAX_RANGE_DAYS} ימים` }, { status: 400 });
    }
    return { calendar: await calendarRange(store, getOpsStore(), from, to) };
  });
}
