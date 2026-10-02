import { NextResponse } from "next/server";
import { z } from "zod";
import { NOTIFY_RULES, isMuted, loadNotifyPrefs, setMuted } from "@/lib/life/notify";
import { readJson, withStore } from "@/lib/life/service";
import type { LifeStore } from "@/lib/life/store";
import {
  BOT_COMMANDS,
  type BotTest,
  TelegramError,
  cronSql,
  cronToken,
  isTelegramConfigured,
  loadTelegram,
  saveTelegram,
  sendMessage,
  telegramCall,
  webhookSecret,
} from "@/lib/life/telegram";

// Settings-side control of the Telegram bot (behind the admin login via proxy.ts).

async function status(store: LifeStore, origin: string) {
  const [telegram, prefs, token, muted] = await Promise.all([loadTelegram(store), loadNotifyPrefs(store), cronToken(), isMuted(store)]);
  return {
    configured: isTelegramConfigured(),
    linked: telegram.chat_id !== null,
    linked_at: telegram.linked_at,
    bot_username: telegram.bot_username,
    deep_link: telegram.bot_username && telegram.link_code ? `https://t.me/${telegram.bot_username}?start=${telegram.link_code}` : null,
    rules: NOTIFY_RULES,
    prefs,
    muted,
    cron_sql: cronSql(origin, token),
  };
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return withStore(async (store) => ({ telegram: await status(store, origin) }));
}

/** Points the bot's webhook here, sets its command menu, and issues a link code if no chat is bound. */
async function connectBot(store: LifeStore, origin: string) {
  const me = await telegramCall<{ username: string }>("getMe");
  await telegramCall("setWebhook", {
    url: `${origin}/api/telegram/webhook`,
    secret_token: await webhookSecret(),
    allowed_updates: ["message"],
    drop_pending_updates: true,
  });
  await telegramCall("setMyCommands", { commands: BOT_COMMANDS });
  const telegram = await loadTelegram(store);
  await saveTelegram(store, {
    bot_username: me.username,
    // Keep an existing binding; issue a fresh one-time code only when there is none.
    link_code: telegram.chat_id ? null : crypto.randomUUID().replace(/-/g, "").slice(0, 20),
  });
  return me.username;
}

/**
 * The "is it connected?" button: checks the token, makes sure the webhook points here, and sends
 * a message to his chat. Each failure says what to do next instead of a bare error.
 */
async function testBot(store: LifeStore, origin: string): Promise<BotTest> {
  if (!isTelegramConfigured()) {
    return { ok: false, step: "token", message: "חסר TELEGRAM_BOT_TOKEN ב־Vercel. מוסיפים אותו ועושים Redeploy." };
  }
  let bot: string;
  try {
    const info = await telegramCall<{ url: string }>("getWebhookInfo");
    bot = info.url === `${origin}/api/telegram/webhook` ? (await telegramCall<{ username: string }>("getMe")).username : await connectBot(store, origin);
  } catch (error) {
    const message = error instanceof TelegramError ? error.message : String(error);
    return { ok: false, step: "token", message: `טלגרם לא מקבל את הטוקן (${message}). בדוק ב־Vercel שהעתקת את כל הטוקן מ־BotFather, ועשה Redeploy.` };
  }
  const telegram = await loadTelegram(store);
  if (!telegram.chat_id) {
    if (!telegram.link_code) await connectBot(store, origin);
    const fresh = await loadTelegram(store);
    return {
      ok: false,
      step: "link",
      message: `הבוט @${bot} עובד, אבל עוד לא קושר לצ׳אט שלך. פותחים אותו מהכפתור, לוחצים Start, וחוזרים לבדוק שוב.`,
      deep_link: fresh.link_code ? `https://t.me/${bot}?start=${fresh.link_code}` : null,
    };
  }
  const time = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit" }).format(new Date());
  try {
    await sendMessage(telegram.chat_id, `✅ הבוט מחובר ועובד (${time}).\nמכאן יגיעו התזכורות, הודעת הבוקר וזמני השבת.`);
  } catch (error) {
    const message = error instanceof TelegramError ? error.message : String(error);
    return {
      ok: false,
      step: "send",
      message: /blocked|chat not found|deactivated/i.test(message)
        ? "הבוט לא יכול לשלוח לך: כנראה חסמת אותו או מחקת את הצ׳אט. לוחצים ״ניתוק״, ואז ״חיבור הבוט״ ו־Start מחדש."
        : `השליחה נכשלה: ${message}`,
    };
  }
  return { ok: true, bot };
}

const actionSchema = z.object({ action: z.enum(["setup", "test", "unlink", "mute", "unmute"]) });

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const body = await readJson(request);
  return withStore(async (store) => {
    const { action } = actionSchema.parse(body);
    if (action === "mute" || action === "unmute") {
      await setMuted(store, action === "mute");
      return { telegram: await status(store, origin) };
    }
    try {
      if (action === "setup") {
        await connectBot(store, origin);
      } else if (action === "test") {
        return { test: await testBot(store, origin), telegram: await status(store, origin) };
      } else {
        await saveTelegram(store, { chat_id: null, linked_at: null, link_code: crypto.randomUUID().replace(/-/g, "").slice(0, 20) });
      }
    } catch (error) {
      if (error instanceof TelegramError) {
        return NextResponse.json({ error: `טלגרם: ${error.message}` }, { status: 502 });
      }
      throw error;
    }
    return { telegram: await status(store, origin) };
  });
}

const prefsSchema = z.object({
  prefs: z.object(Object.fromEntries(NOTIFY_RULES.map((r) => [r.key, z.boolean().optional()]))),
});

export async function PUT(request: Request) {
  const origin = new URL(request.url).origin;
  const body = await readJson(request);
  return withStore(async (store) => {
    const { prefs } = prefsSchema.parse(body);
    await store.saveDoc("notify_prefs", { ...(await loadNotifyPrefs(store)), ...prefs });
    return { telegram: await status(store, origin) };
  });
}
