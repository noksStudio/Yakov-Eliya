import type { AgentId } from "./types";

// The rules assistant's questions per screen (client-safe: the chat shows them as buttons).
// Each answer is built from his data and the rules engine, with no model call.

export const ASSISTANT_QUESTIONS = {
  now: "מה עכשיו?",
  tomorrow: "תכנן לי את מחר",
  week: "איך אני עומד השבוע?",
  stuck: "מה תקוע?",
  followups: "מה הפולואפים של היום?",
  sales: "איך המכירות השבוע?",
  money: "איך אני מול היעד החודשי?",
  body: "איך הגוף השבוע?",
  spirit: "איך הקביעות שלי?",
  procrastinating: "אני דוחה משהו ולא מצליח להתחיל",
  hard_day: "היה לי יום קשה",
  dates: "מה התאריכים הקרובים?",
  couple_idea: "רעיון לשמח את אשתי היום",
} as const;
export type AssistantQuestion = keyof typeof ASSISTANT_QUESTIONS;

export const AGENT_QUESTIONS: Record<AgentId, AssistantQuestion[]> = {
  chief: ["now", "tomorrow", "week", "stuck"],
  business: ["followups", "sales", "stuck", "money"],
  finance: ["money", "sales"],
  body: ["body", "now"],
  spirit: ["spirit", "now"],
  mind: ["procrastinating", "hard_day", "week"],
  couple: ["dates", "couple_idea"],
};
