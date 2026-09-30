import { NextResponse } from "next/server";
import { z } from "zod";
import { askChief, ChiefNotConfiguredError } from "@/lib/life/chief";
import { readJson, withStore } from "@/lib/life/service";

// A planning turn can take several tool calls; give it room before the platform cuts it off.
export const maxDuration = 120;

export async function GET() {
  return withStore(async (store) => ({
    messages: await store.listMessages(60),
    connected: Boolean(process.env.ANTHROPIC_API_KEY),
  }));
}

const bodySchema = z.object({ message: z.string().trim().min(1).max(4000) });

export async function POST(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => {
    const { message } = bodySchema.parse(body);
    try {
      const reply = await askChief(store, message);
      // Stored only after a successful turn, so a failed call can simply be retried.
      const user = await store.addMessage("user", message);
      const assistant = await store.addMessage("assistant", reply);
      return { messages: [user, assistant] };
    } catch (error) {
      if (error instanceof ChiefNotConfiguredError) {
        return NextResponse.json({ error: error.message }, { status: 503 });
      }
      console.error("[life/chief]", error);
      return NextResponse.json({ error: "המנהל הראשי לא הצליח לענות כרגע. נסה שוב בעוד רגע." }, { status: 502 });
    }
  });
}
