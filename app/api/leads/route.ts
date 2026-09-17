import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : null;
  const phone = typeof body?.phone === "string" ? body.phone.trim() : null;

  if (!name || !phone) {
    return NextResponse.json({ error: "חסרים שם או טלפון" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      name,
      phone,
      business_type: typeof body?.business_type === "string" ? body.business_type : null,
      pain: typeof body?.pain === "string" ? body.pain : null,
      track_slug: typeof body?.track_slug === "string" ? body.track_slug : null,
      conversation_id: typeof body?.conversation_id === "string" ? body.conversation_id : null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
