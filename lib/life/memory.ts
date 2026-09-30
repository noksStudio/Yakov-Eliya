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
  facts: [
    "הבן שלי אילן נולד ב־25.5.2024 (שבת, י״ז באייר תשפ״ד). ב־2027 הוא בן 3: יום ההולדת העברי ב־24.5.2027 ול״ג בעומר ב־25.5.2027. אני רוצה לעשות לו חלאקה, אירוע בינוני עד גדול.",
    "אני לא עובד בחול המועד (סוכות ופסח).",
    "30.9.2026: אילן קיבל מנה ראשונה של ורמוקס; המנה השנייה אחרי 10 ימים (שבת 10.10).",
    "יום ההולדת שלי 10.3 (נולדתי ב־1997, א׳ באדר ב׳). ב־10.3.2027 אני בן 30, גם העברי וגם הלועזי באותו יום, ואני רוצה אירוע בינוני עד גדול.",
  ],
  open_questions: [
    "באיזו שעה אתה מתפלל מנחה וערבית בדרך כלל?",
    "אילו דברים קבועים יש לך בשבוע (שיעור, איסוף ילדים, פגישות קבועות, ערב משפחה), ומתי?",
    "עד מתי אתה עובד ביום רגיל?",
    "מה שלושת הדברים החשובים ביותר בעסק השבוע?",
    "החלאקה של אילן: באיזה יום (יום ההולדת העברי, ל״ג בעומר או שבת סמוכה), איפה, כמה אנשים ומה התקציב?",
    "יום ההולדת ה־30: איזה סוג אירוע (בית, מסעדה, אולם, טיול), עם מי, ומי מארגן?",
  ],
};

export async function loadMemory(store: LifeStore): Promise<Memory> {
  return (await store.getDoc<Memory>("memory")) ?? DEFAULT_MEMORY;
}
