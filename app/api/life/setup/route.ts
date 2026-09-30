import { NextResponse } from "next/server";
import { setupSql, setupStatus, testAnthropicKey } from "@/lib/life/setup";

// The connection screen's checks (behind the admin login via proxy.ts). Not wrapped in withStore:
// it has to answer even when the database is missing or half set up.

export const maxDuration = 30;

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const sql = url.searchParams.get("sql");
    if (sql === "life" || sql === "schema") {
      return new NextResponse(await setupSql(sql), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
    return NextResponse.json({ setup: await setupStatus(url.origin) });
  } catch (error) {
    console.error("[life/setup]", error);
    return NextResponse.json({ error: "הבדיקה נכשלה" }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ ai: await testAnthropicKey() });
}
