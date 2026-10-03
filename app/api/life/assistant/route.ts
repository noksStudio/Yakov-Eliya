import { z } from "zod";
import { answer, captureText } from "@/lib/life/assistant";
import { ASSISTANT_QUESTIONS, type AssistantQuestion } from "@/lib/life/assistant-types";
import { getOpsStore } from "@/lib/life/ops-store";
import { readJson, withStore } from "@/lib/life/service";
import { AGENTS } from "@/lib/life/types";

// The rules assistant (while the AI is off): a question button gets an answer from the data and
// the rules; free text is quick capture. Both land in the same chat history as the agents'.

const bodySchema = z
  .object({
    agent: z.enum(AGENTS).default("chief"),
    ask: z.enum(Object.keys(ASSISTANT_QUESTIONS) as [AssistantQuestion, ...AssistantQuestion[]]).optional(),
    text: z.string().trim().min(1).max(1000).optional(),
  })
  .refine((b) => b.ask || b.text, "שאלה או טקסט");

export async function POST(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => {
    const { agent, ask, text } = bodySchema.parse(body);
    const ops = getOpsStore();
    const reply = ask ? await answer(store, ops, ask) : await captureText(store, ops, text!);
    const user = await store.addMessage(agent, "user", ask ? ASSISTANT_QUESTIONS[ask] : text!);
    const assistant = await store.addMessage(agent, "assistant", reply);
    return { messages: [user, assistant] };
  });
}
