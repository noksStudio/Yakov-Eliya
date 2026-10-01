import { NextResponse } from "next/server";
import { z } from "zod";
import { removeReminder, updateReminder } from "@/lib/life/reminders";
import { dateSchema, timeSchema } from "@/lib/life/schemas";
import { readJson, withStore } from "@/lib/life/service";

const patchSchema = z.object({ date: dateSchema.optional(), time: timeSchema.optional(), text: z.string().trim().max(300).optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await readJson(request);
  return withStore(async (store) => {
    const result = await updateReminder(store, id, patchSchema.parse(body));
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return result;
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withStore(async (store) => {
    if (!(await removeReminder(store, id))) return NextResponse.json({ error: "התזכורת לא נמצאה." }, { status: 404 });
    return { ok: true };
  });
}
