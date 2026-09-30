import type { LifeStore } from "./store";

// Telegram Bot API over plain fetch. The only new secret is TELEGRAM_BOT_TOKEN; the webhook secret
// and the cron token are derived from ADMIN_SESSION_SECRET, so there is nothing else to configure.

// Overridable only so the bot can be exercised against a local mock.
const API = process.env.TELEGRAM_API_URL ?? "https://api.telegram.org";
const MAX_LENGTH = 4000;

export type TelegramDoc = {
  chat_id: number | null;
  bot_username: string | null;
  /** One-time code for the t.me deep link that binds the chat; cleared once used. */
  link_code: string | null;
  linked_at: string | null;
  /** Highest update handled, so Telegram's retries are not processed twice. */
  last_update_id: number | null;
};

const EMPTY: TelegramDoc = { chat_id: null, bot_username: null, link_code: null, linked_at: null, last_update_id: null };

/** Supabase pg_cron job that pings the notification route every 5 minutes. */
export function cronSql(origin: string, token: string) {
  return [
    "create extension if not exists pg_cron;",
    "create extension if not exists pg_net;",
    "select cron.schedule('life-notify', '*/5 * * * *', $$",
    "  select net.http_get(",
    `    url := '${origin}/api/cron/notify',`,
    `    headers := jsonb_build_object('Authorization', 'Bearer ${token}')`,
    "  );",
    "$$);",
  ].join("\n");
}

export function isTelegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

export async function loadTelegram(store: LifeStore): Promise<TelegramDoc> {
  return { ...EMPTY, ...((await store.getDoc<Partial<TelegramDoc>>("telegram")) ?? {}) };
}

export async function saveTelegram(store: LifeStore, patch: Partial<TelegramDoc>) {
  return store.saveDoc<TelegramDoc>("telegram", { ...(await loadTelegram(store)), ...patch });
}

export class TelegramError extends Error {}

export async function telegramCall<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new TelegramError("חסר TELEGRAM_BOT_TOKEN");
  const res = await fetch(`${API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; result?: T; description?: string };
  if (!data.ok) throw new TelegramError(data.description ?? `Telegram ${method} נכשל (${res.status})`);
  return data.result as T;
}

/** Splits on line breaks so long replies stay under Telegram's 4096-character limit. */
function chunks(text: string) {
  if (text.length <= MAX_LENGTH) return [text];
  const out: string[] = [];
  let current = "";
  for (const line of text.split("\n")) {
    if (current && current.length + line.length + 1 > MAX_LENGTH) {
      out.push(current);
      current = "";
    }
    current = current ? `${current}\n${line}` : line;
    while (current.length > MAX_LENGTH) {
      out.push(current.slice(0, MAX_LENGTH));
      current = current.slice(MAX_LENGTH);
    }
  }
  if (current) out.push(current);
  return out;
}

/** `html`: our own templates use HTML formatting; agent replies go as plain text. */
export async function sendMessage(chatId: number, text: string, html = false) {
  for (const part of chunks(text)) {
    await telegramCall("sendMessage", {
      chat_id: chatId,
      text: part,
      ...(html ? { parse_mode: "HTML" } : {}),
      link_preview_options: { is_disabled: true },
    });
  }
}

export function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function derive(label: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("Missing ADMIN_SESSION_SECRET environment variable");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(label)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 40);
}

/** Sent by Telegram in X-Telegram-Bot-Api-Secret-Token on every webhook call. */
export const webhookSecret = () => derive("life-telegram-webhook");
/** Bearer token for the notification cron (/api/cron/notify). */
export const cronToken = () => derive("life-notify-cron");

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// One list of every command, grouped: the bot's command menu and /all are both built from it.
type BotCommand = { command: string; usage?: string; description: string };
const COMMAND_GROUPS: { title: string; commands: BotCommand[] }[] = [
  {
    title: "📅 היום והשבוע",
    commands: [
      { command: "today", description: "התכנית של היום" },
      { command: "plan", description: "המנהל מתכנן איתי את היום" },
      { command: "focus", description: "הפוקוס של השבוע" },
    ],
  },
  {
    title: "✍️ רישום מהיר",
    commands: [
      { command: "w", usage: "84.6", description: "שקילה" },
      { command: "in", usage: "1500 לקוח", description: "הכנסה" },
      { command: "out", usage: "300 שיווק", description: "הוצאה" },
      { command: "workout", description: "אימון בוצע" },
    ],
  },
  {
    title: "🌱 זיכרון וצמיחה",
    commands: [
      { command: "lesson", usage: "לא שולחים מחיר בלי אבחון", description: "שמירת לקח (עם #טיול: רק בהקשר)" },
      { command: "idea", usage: "מערכת הזמנות", description: "שמירת רעיון" },
      { command: "remind", usage: "מחר 10:00 להתקשר לדני", description: "תזכורת" },
      { command: "reminders", description: "התזכורות הפתוחות" },
      { command: "cancel", usage: "1", description: "ביטול תזכורת לפי המספר ברשימה" },
    ],
  },
  {
    title: "🎯 יעדים ומדדים",
    commands: [
      { command: "goals", description: "חזון 30: היעדים" },
      { command: "metrics", description: "כל המדדים" },
    ],
  },
  {
    title: "❔ עזרה",
    commands: [
      { command: "all", description: "כל הפקודות ומה כל אחת עושה" },
      { command: "help", description: "הסבר קצר" },
    ],
  },
];

/** For setMyCommands: the menu shown when typing "/" (descriptions carry the example). */
export const BOT_COMMANDS = [
  ...COMMAND_GROUPS.flatMap((g) => g.commands).filter((c) => c.command === "all"),
  ...COMMAND_GROUPS.flatMap((g) => g.commands).filter((c) => c.command !== "all"),
].map((c) => ({ command: c.command, description: (c.usage ? `${c.description}: /${c.command} ${c.usage}` : c.description).slice(0, 256) }));

/** /all: every command with what it does, by group. */
export const ALL_TEXT = [
  "<b>כל הפקודות</b>",
  ...COMMAND_GROUPS.flatMap((g) => [
    "",
    `<b>${g.title}</b>`,
    ...g.commands.map((c) => `/${c.command}${c.usage ? ` ${c.usage}` : ""} · ${c.description}`),
  ]),
  "",
  "<b>💬 בלי פקודות</b>",
  "״לקח: …״ · שמירת לקח",
  "״רעיון: …״ · שמירת רעיון",
  "״תזכיר לי מחר ב־10:00 …״ · תזכורת",
  "״הכנסה 1500״ · ״משקל 84.6״ · ״קניות: חלב, ביצים״",
  "כל טקסט אחר · המנהל הראשי עונה, מתכנן ומעדכן משימות ולו״ז",
].join("\n");

export const HELP_TEXT = [
  "<b>מה אפשר לעשות כאן</b>",
  "סתם לכתוב לי: המנהל הראשי עונה, מתכנן ומעדכן משימות ולו״ז.",
  "רישום מהיר: שקילה, הכנסות, לקחים, רעיונות ותזכורות, גם בעברית רגילה (״תזכיר לי מחר ב־10:00 …״).",
  "",
  "/today · התכנית של היום",
  "/all · כל הפקודות ומה כל אחת עושה",
].join("\n");
