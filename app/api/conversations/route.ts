import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("conversations")
    .insert({})
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
