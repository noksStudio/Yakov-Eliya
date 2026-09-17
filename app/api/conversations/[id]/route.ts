import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const EDITABLE_FIELDS = ["messages", "business_type", "pain", "track_slugs"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "גוף בקשה לא תקין" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of EDITABLE_FIELDS) {
    if (field in body) update[field] = body[field];
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("conversations").update(update).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
