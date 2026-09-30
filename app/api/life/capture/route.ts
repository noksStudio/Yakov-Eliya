import { NextResponse } from "next/server";
import { z } from "zod";
import { capture } from "@/lib/life/capture";
import { getOpsStore } from "@/lib/life/ops-store";
import { readJson, withStore } from "@/lib/life/service";

const bodySchema = z.object({ text: z.string().trim().min(1).max(2000) });

/** The "+" button: one line in, the right record out (task, reminder, lesson, idea, money, weight…). */
export async function POST(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => {
    const { text } = bodySchema.parse(body);
    const result = await capture(store, getOpsStore(), text);
    if (!result || "error" in result) return NextResponse.json({ error: result?.error ?? "לא הבנתי" }, { status: 400 });
    return { result };
  });
}
