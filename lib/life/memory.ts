import { z } from "zod";
import type { LifeStore } from "./store";

// What the agents have learnt about Yakov, plus questions still waiting for an answer. The chief
// manager asks the open questions one at a time, when the moment fits, and records the answers.

export const memorySchema = z.object({
  facts: z.array(z.string().max(300)).max(200),
  open_questions: z.array(z.string().max(300)).max(50),
});
export type Memory = z.infer<typeof memorySchema>;

export const DEFAULT_MEMORY: Memory = {
  facts: [],
  open_questions: [
    "באיזו שעה אתה מתפלל מנחה וערבית בדרך כלל?",
    "אילו דברים קבועים יש לך בשבוע (שיעור, איסוף ילדים, פגישות קבועות, ערב משפחה), ומתי?",
    "עד מתי אתה עובד ביום רגיל?",
    "מה שלושת הדברים החשובים ביותר בעסק השבוע?",
  ],
};

export async function loadMemory(store: LifeStore): Promise<Memory> {
  return (await store.getDoc<Memory>("memory")) ?? DEFAULT_MEMORY;
}
