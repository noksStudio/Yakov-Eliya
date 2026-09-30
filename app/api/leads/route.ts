import { NextResponse, after } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { notifyNewLead } from "@/lib/notify";
import { firstFollowUp, getLeadsStore, notifyLeadTelegram } from "@/lib/life/leads";
import { getLifeStore } from "@/lib/life/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : null;
  const phone = typeof body?.phone === "string" ? body.phone.trim() : null;

  if (!name || !phone) {
    return NextResponse.json({ error: "חסרים שם או טלפון" }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY environment variables" }, { status: 500 });
  }

  const business_type = typeof body?.business_type === "string" ? body.business_type : null;
  const pain = typeof body?.pain === "string" ? body.pain : null;
  const track_slug = typeof body?.track_slug === "string" ? body.track_slug : null;
  const store = getLifeStore();
  const settings = await store.getSettings().catch(() => null);

  let lead;
  try {
    lead = await getLeadsStore().add({
      name,
      phone,
      business_type,
      source: "site",
      // Same day before 16:00, otherwise the next working day.
      follow_up_date: firstFollowUp(new Date(), { cholHamoedOff: settings?.chol_hamoed_off ?? true }),
      pain,
      track_slug,
      conversation_id: typeof body?.conversation_id === "string" ? body.conversation_id : null,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  // After the response: the visitor does not wait for the email or Telegram.
  after(async () => {
    await notifyNewLead({ name, phone, business_type, pain, track_slug });
    await notifyLeadTelegram(store, lead, origin).catch((error) => console.error("[leads] telegram", error));
  });

  return NextResponse.json({ id: lead.id });
}
