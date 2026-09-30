import { NextResponse } from "next/server";
import { buildIcs, calendarToken, parseKinds } from "@/lib/life/ics";
import { getOpsStore } from "@/lib/life/ops-store";
import { applySeeds } from "@/lib/life/seeds";
import { getLifeStore } from "@/lib/life/store";
import { safeEqual } from "@/lib/life/telegram";

// The subscribed calendar feed: /api/calendar/<token>.ics?k=event,reminder,…
// Outside the proxy matcher on purpose: the phone's calendar app can't log in, so the token in
// the path is the key (reset from /life/settings to cut off an old link).

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const store = getLifeStore();
  try {
    if (!process.env.ADMIN_SESSION_SECRET || !safeEqual(token.replace(/\.ics$/, ""), await calendarToken(store))) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    await applySeeds(store);
    const url = new URL(request.url);
    const body = await buildIcs(store, getOpsStore(), parseKinds(url.searchParams.get("k")), url.origin);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="life.ics"',
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("[calendar]", error);
    return NextResponse.json({ error: "calendar failed" }, { status: 500 });
  }
}
