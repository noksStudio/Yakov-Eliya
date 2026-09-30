import { NextResponse } from "next/server";
import { z } from "zod";
import { AgentNotConfiguredError, askAgent, isAgentConnected } from "@/lib/life/agents";
import { readJson, withStore } from "@/lib/life/service";
import { AGENTS } from "@/lib/life/types";

// A planning turn can take several tool calls; give it room before the platform cuts it off.
export const maxDuration = 120;

const agentSchema = z.enum(AGENTS).default("chief");

export async function GET(request: Request) {
  const agent = new URL(request.url).searchParams.get("agent") ?? undefined;
  return withStore(async (store) => ({
    messages: await store.listMessages(agentSchema.parse(agent), 60),
    connected: isAgentConnected(),
  }));
}

const bodySchema = z.object({
  message: z.string().trim().min(1).max(4000),
  agent: agentSchema,
  deep: z.boolean().default(false),
});

export async function POST(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => {
    const { message, agent, deep } = bodySchema.parse(body);
    try {
      const reply = await askAgent(store, agent, message, deep);
      // Stored only after a successful turn, so a failed call can simply be retried.
      const user = await store.addMessage(agent, "user", message);
      const assistant = await store.addMessage(agent, "assistant", reply);
      return { messages: [user, assistant] };
    } catch (error) {
      if (error instanceof AgentNotConfiguredError) {
        return NextResponse.json({ error: error.message }, { status: 503 });
      }
      console.error("[life/agent]", agent, error);
      return NextResponse.json({ error: "הסוכן לא הצליח לענות כרגע. נסה שוב בעוד רגע." }, { status: 502 });
    }
  });
}
