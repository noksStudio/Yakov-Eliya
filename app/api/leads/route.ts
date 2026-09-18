import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { notifyNewLead } from "@/lib/notify";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : null;
  const phone = typeof body?.phone === "string" ? body.phone.trim() : null;

  if (!name || !phone) {
    return NextResponse.json({ error: "חסרים שם או טלפון" }, { status: 400 });
  }

  const business_type = typeof body?.business_type === "string" ? body.business_type : null;
  const pain = typeof body?.pain === "string" ? body.pain : null;
  const track_slug = typeof body?.track_slug === "string" ? body.track_slug : null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      name,
      phone,
      business_type,
      pain,
      track_slug,
      conversation_id: typeof body?.conversation_id === "string" ? body.conversation_id : null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await notifyNewLead({ name, phone, business_type, pain, track_slug });

  return NextResponse.json({ id: data.id });
}
