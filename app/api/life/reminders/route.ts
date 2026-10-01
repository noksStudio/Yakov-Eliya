import { NextResponse } from "next/server";
import { z } from "zod";
import { addReminder, loadReminders, parseWhen } from "@/lib/life/reminders";
import { readJson, withStore } from "@/lib/life/service";

// The reminders screen (behind the admin login via proxy.ts).

export async function GET() {
  return withStore(async (store) => {
    const items = await loadReminders(store);
    return { upcoming: items.filter((r) => !r.sent), sent: items.filter((r) => r.sent).reverse() };
  });
}

const addSchema = z.object({ text: z.string().trim().min(1, "כתוב מתי ועל מה, למשל: מחר ב־10:00 להתקשר לדני").max(400) });

/** One line in Hebrew: "מחר ב־10:00 להתקשר לדני". */
export async function POST(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => {
    const { text } = addSchema.parse(body);
    const parsed = parseWhen(text);
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    return { reminder: await addReminder(store, { date: parsed.date, time: parsed.time, text: parsed.text }) };
  });
}
