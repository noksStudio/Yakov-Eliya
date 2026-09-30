import { z } from "zod";
import { calendarToken, ICS_KINDS, rotateCalendarToken } from "@/lib/life/ics";
import { readJson, withStore } from "@/lib/life/service";

// Settings side of the calendar subscription (behind the admin login via proxy.ts).

const feed = (origin: string, token: string) => `${origin}/api/calendar/${token}.ics`;

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return withStore(async (store) => ({ calendar: { feed: feed(origin, await calendarToken(store)), kinds: ICS_KINDS } }));
}

const actionSchema = z.object({ action: z.literal("rotate") });

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const body = await readJson(request);
  return withStore(async (store) => {
    actionSchema.parse(body);
    return { calendar: { feed: feed(origin, await rotateCalendarToken(store)), kinds: ICS_KINDS } };
  });
}
