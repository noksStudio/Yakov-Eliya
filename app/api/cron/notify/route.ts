import { NextResponse } from "next/server";
import { runNotifications } from "@/lib/life/notify";
import { getOpsStore } from "@/lib/life/ops-store";
import { getLifeStore, isDemoStore } from "@/lib/life/store";
import { cronToken, safeEqual } from "@/lib/life/telegram";

// Pinged every 5 minutes by a Supabase pg_cron job (the SQL is shown in /life/settings).
// Outside the proxy matcher on purpose: it authenticates with a token derived from
// ADMIN_SESSION_SECRET, sent as "Authorization: Bearer <token>" or ?token=.

export const maxDuration = 60;

async function handle(request: Request) {
  const url = new URL(request.url);
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("token") ?? "";
  if (!process.env.ADMIN_SESSION_SECRET || !safeEqual(given, await cronToken())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // ?dry=1 previews what would go out now (or at ?now=<ISO time>) without sending anything.
  const dry = url.searchParams.get("dry") === "1";
  const nowParam = url.searchParams.get("now");
  const now = dry && nowParam ? new Date(nowParam) : undefined;
  if (now && Number.isNaN(now.getTime())) return NextResponse.json({ error: "bad now" }, { status: 400 });

  if (!dry && isDemoStore()) {
    // The in-memory demo store forgets the linked chat and the send log between calls.
    return NextResponse.json({ skipped: "Supabase לא מחובר", sent: [] });
  }
  if (!dry && !process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ skipped: "חסר TELEGRAM_BOT_TOKEN", sent: [] });
  }

  try {
    return NextResponse.json(await runNotifications(getLifeStore(), getOpsStore(), url.origin, { dry, now }));
  } catch (error) {
    console.error("[life/notify]", error);
    return NextResponse.json({ error: "notify failed" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
