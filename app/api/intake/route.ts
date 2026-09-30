import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { handleIntake, intakeEventSchema } from "@/lib/life/intake";
import { logIntake, seenBefore, verifyIntegrationKey } from "@/lib/life/integrations";
import { getOpsStore } from "@/lib/life/ops-store";
import { getLifeStore } from "@/lib/life/store";

// Leads and calls from connected systems (Bossi). Outside the admin login on purpose: each system
// authenticates with its own key ("Authorization: Bearer lk_…"), created in /life/settings.
// The format is documented in docs/intake-api.md.

export async function POST(request: Request) {
  const store = getLifeStore();
  const key = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const integration = key ? await verifyIntegrationKey(store, key).catch(() => null) : null;
  if (!integration) return NextResponse.json({ error: "invalid key" }, { status: 401 });

  let type = "unknown";
  try {
    const body = await request.json().catch(() => null);
    type = typeof body?.type === "string" ? body.type : type;
    const event = intakeEventSchema.parse(body);
    if (await seenBefore(store, event.event_id ? `${integration.source}:${event.event_id}` : undefined)) {
      return NextResponse.json({ result: "duplicate" });
    }
    const result = await handleIntake(store, getOpsStore(), integration, event, new URL(request.url).origin);
    await logIntake(store, { source: integration.name, type, result: result.result, detail: event.type === "lead" ? event.lead.name : result.detail });
    return NextResponse.json(result);
  } catch (error) {
    const detail = error instanceof ZodError ? error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") : (error as Error).message;
    await logIntake(store, { source: integration.name, type, result: "error", detail: detail.slice(0, 200) }).catch(() => {});
    if (error instanceof ZodError) return NextResponse.json({ error: detail }, { status: 400 });
    console.error("[intake]", error);
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
