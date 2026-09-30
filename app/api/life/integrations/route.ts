import { NextResponse } from "next/server";
import { z } from "zod";
import { createIntegrationKey, loadIntegrations, recentIntake, revokeIntegrationKey } from "@/lib/life/integrations";
import { readJson, withStore } from "@/lib/life/service";
import type { LifeStore } from "@/lib/life/store";

// Connected systems in settings (behind the admin login via proxy.ts). Key hashes never leave
// the server; a new key is returned once, when created.

const list = async (store: LifeStore, origin: string) => ({
  endpoint: `${origin}/api/intake`,
  keys: (await loadIntegrations(store)).map(({ id, name, source, prefix, created_at, last_used_at }) => ({ id, name, source, prefix, created_at, last_used_at })),
  recent: await recentIntake(store),
});

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return withStore(async (store) => ({ integrations: await list(store, origin) }));
}

const createSchema = z.object({ name: z.string().trim().min(1, "חסר שם").max(40) });

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const body = await readJson(request);
  return withStore(async (store) => {
    const { name } = createSchema.parse(body);
    const { key } = await createIntegrationKey(store, name);
    return { key, integrations: await list(store, origin) };
  });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  return withStore(async (store) => {
    if (!(await revokeIntegrationKey(store, id))) return NextResponse.json({ error: "המפתח לא נמצא" }, { status: 404 });
    return { integrations: await list(store, url.origin) };
  });
}
