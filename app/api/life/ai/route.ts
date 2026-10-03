import { z } from "zod";
import { aiSwitch, setAiEnabled } from "@/lib/life/ai";
import { readJson, withStore } from "@/lib/life/service";

/** The AI switch (off by default): GET state, PUT {enabled}. */
export async function GET() {
  return withStore(async (store) => ({ ai: await aiSwitch(store) }));
}

export async function PUT(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => {
    const { enabled } = z.object({ enabled: z.boolean() }).parse(body);
    try {
      return { ai: await setAiEnabled(store, enabled) };
    } catch (error) {
      return Response.json({ error: (error as Error).message }, { status: 400 });
    }
  });
}
