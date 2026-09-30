import { NextResponse } from "next/server";
import { getLeadsStore, leadPatchSchema } from "@/lib/life/leads";
import { readJson, withStore } from "@/lib/life/service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await readJson(request);
  return withStore(async () => {
    const lead = await getLeadsStore().update(id, leadPatchSchema.parse(body));
    return lead ? { lead } : NextResponse.json({ error: "הליד לא נמצא" }, { status: 404 });
  });
}
