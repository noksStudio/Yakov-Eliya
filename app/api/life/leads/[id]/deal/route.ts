import { NextResponse } from "next/server";
import { getLeadsStore, leadToDeal, toDealSchema } from "@/lib/life/leads";
import { getOpsStore } from "@/lib/life/ops-store";
import { readJson, withStore } from "@/lib/life/service";

/** "יש כאן עסקה": opens a deal from the lead. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await readJson(request);
  return withStore(async () => {
    const result = await leadToDeal(getOpsStore(), getLeadsStore(), id, toDealSchema.parse(body ?? {}));
    return result ? result : NextResponse.json({ error: "הליד לא נמצא" }, { status: 404 });
  });
}
