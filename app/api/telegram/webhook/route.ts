import { NextResponse, after } from "next/server";
import { AgentNotConfiguredError, askAgent, isAgentConnected } from "@/lib/life/agents";
import { loadBodyPlan } from "@/lib/life/body";
import { financeSummary } from "@/lib/life/finance";
import { goalsProgress, weekFocus } from "@/lib/life/growth";
import { removeReminder, upcomingReminders } from "@/lib/life/reminders";
import { capture, type CaptureKind, type CaptureResult } from "@/lib/life/capture";
import { metricsMessage, morningMessage, setMuted } from "@/lib/life/notify";
import { shabbatMessage } from "@/lib/life/shabbat-prep";
import { EXPENSE_CATEGORIES, financeEntrySchema } from "@/lib/life/ops-types";
import { getOpsStore } from "@/lib/life/ops-store";
import { loadDay } from "@/lib/life/service";
import { getLifeStore, type LifeStore } from "@/lib/life/store";
import { applySeeds } from "@/lib/life/seeds";
import { ALL_TEXT, HELP_TEXT, escapeHtml, loadTelegram, safeEqual, saveTelegram, sendMessage, telegramCall, webhookSecret } from "@/lib/life/telegram";
import { addDays, israelToday } from "@/lib/life/time";

// Telegram webhook. Outside the proxy matcher: Telegram proves itself with the secret token set in
// setWebhook, and only the one chat bound through the settings deep link is ever served.

// An agent turn runs after the response (see `after`) and can take several tool calls.
export const maxDuration = 120;

type Update = {
  update_id: number;
  message?: { chat: { id: number; type: string }; text?: string };
};

const ok = () => NextResponse.json({ ok: true });
const ils = (n: number) => `${Math.round(n).toLocaleString("he-IL")} ₪`;
const num = (raw: string | undefined, decimalComma: boolean) => {
  if (!raw) return NaN;
  return Number(decimalComma ? raw.replace(",", ".") : raw.replace(/,/g, ""));
};

export async function POST(request: Request) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.ADMIN_SESSION_SECRET || !safeEqual(secret, await webhookSecret())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as Update | null;
  const message = update?.message;
  if (!update || !message?.text || message.chat.type !== "private") return ok();

  const store = getLifeStore();
  await applySeeds(store);
  const telegram = await loadTelegram(store);
  // Telegram retries until it gets a 200; never handle the same update twice.
  if (telegram.last_update_id !== null && update.update_id <= telegram.last_update_id) return ok();
  await saveTelegram(store, { last_update_id: update.update_id });

  const chatId = message.chat.id;
  const text = message.text.trim();
  const [rawCommand, ...rest] = text.split(/\s+/);
  const command = rawCommand.startsWith("/") ? rawCommand.slice(1).split("@")[0].toLowerCase() : null;
  const raw = command ? text.slice(rawCommand.length).trim() : text;

  // Binding: the deep link from settings opens the bot with "/start <code>".
  if (command === "start" && rest[0] && telegram.link_code && safeEqual(rest[0], telegram.link_code)) {
    await saveTelegram(store, { chat_id: chatId, link_code: null, linked_at: new Date().toISOString() });
    await sendMessage(chatId, `✅ <b>מחובר!</b> מעכשיו ההתראות והמנהל הראשי כאן.\n\n${ALL_TEXT}`, true);
    return ok();
  }

  if (telegram.chat_id !== chatId) {
    // Someone else found the bot: answer only while no chat is bound, and reveal nothing.
    if (telegram.chat_id === null) await sendMessage(chatId, "כדי לחבר את הבוט, לחץ על ״חיבור הבוט״ בהגדרות של האפליקציה.");
    return ok();
  }

  try {
    const origin = new URL(request.url).origin;
    // Plain Hebrew is captured the same way as the app's "+" (לקח: …, תזכיר לי …, הכנסה 1500,
    // קניות: …); anything it does not recognise goes to the chief manager, or, until the API key
    // is connected, becomes a task so nothing written is lost.
    const reply = command
      ? await runCommand(store, command, rest, origin, raw)
      : await capture(store, getOpsStore(), text, !isAgentConnected()).then((r) => (r ? captureReply(r, origin) : null));
    if (reply) {
      await sendMessage(chatId, reply, true);
      return ok();
    }
    const agentText = command === "plan" ? "תכנן איתי את היום: מה החשוב, מה בלו״ז, ומה לדחות." : command ? null : text;
    if (!agentText) {
      await sendMessage(chatId, `לא מכיר את הפקודה הזו. הנה כל מה שאפשר:\n\n${ALL_TEXT}`, true);
      return ok();
    }
    // Answer Telegram right away; the agent replies in its own message when it is done.
    after(() => replyWithAgent(store, chatId, agentText, command === "plan"));
  } catch (error) {
    console.error("[telegram]", error);
    await sendMessage(chatId, "משהו השתבש. נסה שוב בעוד רגע.").catch(() => {});
  }
  return ok();
}

const CAPTURE_ICON: Record<CaptureKind, string> = {
  lesson: "💡",
  idea: "💡",
  reminder: "⏰",
  lead: "🔔",
  income: "💰",
  expense: "🧾",
  weight: "⚖️",
  workout: "💪",
  shopping: "🛒",
  task: "✅",
};

function captureReply(r: CaptureResult, origin: string) {
  if ("error" in r) return r.error;
  return `${CAPTURE_ICON[r.kind]} ${escapeHtml(r.message)}\n<a href="${origin}${r.href}">פתיחה באפליקציה</a>`;
}

function whenLabel(date: string, today: string) {
  if (date === today) return "היום";
  if (date === addDays(today, 1)) return "מחר";
  const weekday = new Intl.DateTimeFormat("he-IL", { weekday: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
  return `ב${weekday} ${Number(date.slice(8, 10))}.${Number(date.slice(5, 7))}`;
}

/** `raw`: everything after the command, line breaks kept (for /idea notes). */
async function runCommand(store: LifeStore, command: string, args: string[], origin: string, raw: string): Promise<string | null> {
  const ops = getOpsStore();
  const today = israelToday();
  switch (command) {
    case "start":
    case "help":
      return HELP_TEXT;
    case "all":
    case "commands":
      return ALL_TEXT;
    case "today":
      return morningMessage(store, ops, await loadDay(store, today), origin);
    case "metrics":
      return metricsMessage(store, ops, today, origin);
    case "idea":
      if (!raw) return "כתוב את הרעיון אחרי הפקודה, למשל: /idea מערכת הזמנות בוואטסאפ ליבואנים";
      return captureReply((await capture(store, ops, `רעיון: ${raw}`))!, origin);
    case "lesson":
      if (!raw) return "כתוב את הלקח אחרי הפקודה, למשל: /lesson לא שולחים הצעת מחיר בלי שיחת אבחון\nללקח שרלוונטי רק בהקשר, הוסף מילים עם #, למשל: #טיול";
      return captureReply((await capture(store, ops, `לקח: ${raw}`))!, origin);
    case "remind":
      if (!raw) return "למשל: /remind מחר 10:00 להתקשר לדני\nאו פשוט: ״תזכיר לי בעוד 20 דקות לצאת״";
      return captureReply((await capture(store, ops, `תזכורת: ${raw}`))!, origin);
    case "reminders": {
      const list = await upcomingReminders(store);
      if (!list.length) return "אין תזכורות פתוחות. להוספה: /remind מחר 10:00 להתקשר לדני";
      return [
        "<b>תזכורות פתוחות</b>",
        ...list.slice(0, 15).map((r, i) => `${i + 1}. ${whenLabel(r.date, today)} ${r.time} · ${escapeHtml(r.text)}`),
        "",
        "לביטול: /cancel ומספר, למשל /cancel 1",
        `<a href="${origin}/life/reminders">לעריכה באפליקציה</a>`,
      ].join("\n");
    }
    case "cancel": {
      const list = await upcomingReminders(store);
      const n = Number(args[0]);
      const target = Number.isInteger(n) && n >= 1 ? list[n - 1] : undefined;
      if (!target) return list.length ? "כתוב את מספר התזכורת מ־/reminders, למשל /cancel 1" : "אין תזכורות פתוחות.";
      await removeReminder(store, target.id);
      return `בוטלה: ${escapeHtml(target.text)}`;
    }
    case "goals": {
      const goals = await goalsProgress(store, ops, today);
      const mark = { done: "✅", on_track: "🟢", behind: "🟠", no_data: "⚪️" } as const;
      const n = (v: number) => (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString("he-IL") : String(Math.round(v * 10) / 10));
      return [
        "🎯 <b>חזון 30</b>",
        ...goals.map((g) => `${mark[g.status]} ${escapeHtml(g.title)}: ${g.current === null ? "—" : n(g.current)} / ${n(g.target)} ${escapeHtml(g.unit)} (${g.pct}%)`),
        "",
        `<a href="${origin}/life/growth">למסך הצמיחה</a>`,
      ].join("\n");
    }
    case "focus": {
      const focus = await weekFocus(store, today);
      return focus.length
        ? ["<b>הפוקוס של השבוע</b>", ...focus.map((f) => `• ${escapeHtml(f)}`)].join("\n")
        : `עוד לא נקבע פוקוס לשבוע. <a href="${origin}/life/growth?tab=review">לסקירה השבועית</a>`;
    }
    case "shabbat":
      return shabbatMessage(store, today, origin);
    case "mute":
      await setMuted(store, true, today);
      return "🔕 ההתראות מושתקות עד מחר בבוקר. תזכורות שקבעת עדיין יגיעו.\nלביטול: /unmute";
    case "unmute":
      await setMuted(store, false, today);
      return "🔔 ההתראות חזרו.";
    case "workout":
      await store.saveCheckin(today, { workout: true });
      return "💪 אימון נרשם. כל הכבוד!";
    case "w": {
      const weight = num(args[0], true);
      if (!(weight >= 30 && weight <= 300)) return "כתוב משקל אחרי הפקודה, למשל: /w 84.6";
      await store.saveCheckin(today, { weight: Math.round(weight * 10) / 10 });
      const plan = await loadBodyPlan(store);
      const change = Math.round((weight - plan.profile.start_weight) * 10) / 10;
      // Words instead of +/- signs, which Telegram's RTL layout moves to the wrong side.
      const trend = change < 0 ? `ירדת ${-change} ק״ג מההתחלה` : change > 0 ? `${change} ק״ג מעל ההתחלה` : "כמו בהתחלה";
      return `⚖️ נרשם: <b>${weight}</b> ק״ג. ${trend}, היעד ${plan.profile.goal_weight} ק״ג.`;
    }
    case "in":
    case "out": {
      const amount = num(args[0], false);
      if (!(amount > 0)) return command === "in" ? "למשל: /in 1500 לקוח חדש" : "למשל: /out 300 שיווק";
      const words = args.slice(1).join(" ").trim();
      let category = "מכירה";
      let note: string | null = words || null;
      if (command === "out") {
        const match = EXPENSE_CATEGORIES.find((c) => words.startsWith(c));
        category = match ?? "אחר";
        note = (match ? words.slice(match.length) : words).trim() || null;
      }
      await ops.addFinance(financeEntrySchema.parse({ date: today, kind: command === "in" ? "income" : "expense", amount, category, note }));
      const f = await financeSummary(store, ops, today);
      return `${command === "in" ? "💰 הכנסה" : "🧾 הוצאה"} נרשמה: <b>${ils(amount)}</b> (${category}).\nרווח החודש: ${ils(f.profit)} מתוך ${ils(f.goal.monthly_goal)}.`;
    }
    default:
      return null;
  }
}

async function replyWithAgent(store: LifeStore, chatId: number, text: string, deep: boolean) {
  try {
    await telegramCall("sendChatAction", { chat_id: chatId, action: "typing" }).catch(() => {});
    const reply = await askAgent(store, "chief", text, deep);
    // Same thread as the in-app chat with the chief manager.
    await store.addMessage("chief", "user", text);
    await store.addMessage("chief", "assistant", reply);
    await sendMessage(chatId, reply);
  } catch (error) {
    if (error instanceof AgentNotConfiguredError) {
      await sendMessage(chatId, `המנהל הראשי עוד לא מחובר (חסר מפתח API). בינתיים הפקודות עובדות:\n\n${ALL_TEXT}`, true).catch(() => {});
      return;
    }
    console.error("[telegram/agent]", error);
    await sendMessage(chatId, "המנהל לא הצליח לענות כרגע. נסה שוב בעוד רגע.").catch(() => {});
  }
}
