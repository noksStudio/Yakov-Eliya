import { readFile } from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { getLifeStore } from "./store";
import { cronSql, cronToken, loadTelegram, telegramCall } from "./telegram";

// The connection screen (/life/settings/setup): what is connected, what is missing, and the exact
// next step. Only ever reports whether a secret exists, never its value.

export type CheckState = "ok" | "missing" | "error" | "waiting";
export type Check = { key: string; label: string; state: CheckState; detail?: string };

export type SetupStatus = {
  env: { name: string; set: boolean; optional?: boolean; purpose: string }[];
  database: { checks: Check[]; sql_editor: string | null };
  ai: Check;
  telegram: Check[];
  cron: { check: Check; sql: string | null };
  site: Check[];
};

const ENV: { name: string; purpose: string; optional?: boolean }[] = [
  { name: "ADMIN_USERNAME", purpose: "שם משתמש לכניסה" },
  { name: "ADMIN_PASSWORD", purpose: "סיסמה לכניסה" },
  { name: "ADMIN_SESSION_SECRET", purpose: "חתימת הכניסה, הבוט וההתראות" },
  { name: "SUPABASE_URL", purpose: "כתובת מסד הנתונים" },
  { name: "SUPABASE_SERVICE_ROLE_KEY", purpose: "מפתח השרת של מסד הנתונים" },
  { name: "ANTHROPIC_API_KEY", purpose: "הסוכנים (המנהל הראשי ושאר היועצים)" },
  { name: "TELEGRAM_BOT_TOKEN", purpose: "בוט הטלגרם וההתראות" },
  { name: "RESEND_API_KEY", purpose: "מייל על כל ליד חדש מהאתר", optional: true },
  { name: "LEAD_NOTIFICATION_EMAIL", purpose: "לאן לשלוח את המייל על ליד", optional: true },
];

// Every table in supabase/life.sql, with the columns added later by "alter table" (the ones an
// older copy of the database is most likely to lack).
const LIFE_TABLES: Record<string, string> = {
  life_settings: "id,chol_hamoed_off,start_date",
  life_tasks: "id,event_id",
  life_events: "id",
  life_checkins: "date,workout",
  life_messages: "id,agent",
  life_docs: "key",
  life_shopping: "id",
  life_finance: "id",
  life_deals: "id",
  life_activity: "id",
  life_journal: "id",
  life_ideas: "id",
  life_lessons: "id,triggers",
};
const SITE_TABLES: Record<string, string> = { leads: "id", conversations: "id" };

type Db = ReturnType<typeof getSupabaseAdmin>;

async function probe(db: Db, table: string, columns: string): Promise<Check> {
  const { error } = await db.from(table).select(columns).limit(1);
  if (!error) return { key: table, label: table, state: "ok" };
  const missingTable = /does not exist|could not find the table|schema cache/i.test(error.message) && !/column/i.test(error.message);
  return {
    key: table,
    label: table,
    state: "missing",
    detail: missingTable ? "הטבלה לא קיימת" : /column/i.test(error.message) ? "חסרה עמודה (גרסה ישנה)" : error.message,
  };
}

/** "https://abcd.supabase.co" → the SQL editor of that project. */
function sqlEditorUrl() {
  const ref = process.env.SUPABASE_URL?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1];
  return ref ? `https://supabase.com/dashboard/project/${ref}/sql/new` : null;
}

async function databaseChecks(): Promise<{ life: Check[]; site: Check[] }> {
  if (!isSupabaseConfigured()) {
    const none = (tables: Record<string, string>) =>
      Object.keys(tables).map((t): Check => ({ key: t, label: t, state: "waiting", detail: "קודם מחברים את Supabase" }));
    return { life: none(LIFE_TABLES), site: none(SITE_TABLES) };
  }
  try {
    const db = getSupabaseAdmin();
    const [life, site] = await Promise.all([
      Promise.all(Object.entries(LIFE_TABLES).map(([t, c]) => probe(db, t, c))),
      Promise.all(Object.entries(SITE_TABLES).map(([t, c]) => probe(db, t, c))),
    ]);
    return { life, site };
  } catch (error) {
    const failed: Check = { key: "connection", label: "חיבור", state: "error", detail: (error as Error).message };
    return { life: [failed], site: [] };
  }
}

async function telegramChecks(dbReady: boolean): Promise<Check[]> {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return [{ key: "token", label: "טוקן הבוט", state: "missing", detail: "חסר TELEGRAM_BOT_TOKEN" }];
  }
  const checks: Check[] = [];
  try {
    const me = await telegramCall<{ username: string }>("getMe");
    checks.push({ key: "token", label: "טוקן הבוט", state: "ok", detail: `@${me.username}` });
  } catch (error) {
    return [{ key: "token", label: "טוקן הבוט", state: "error", detail: (error as Error).message }];
  }
  try {
    const info = await telegramCall<{ url: string; last_error_message?: string; pending_update_count?: number }>("getWebhookInfo");
    checks.push(
      !info.url
        ? { key: "webhook", label: "קבלת הודעות", state: "missing", detail: "לוחצים ״חיבור הבוט״ בהגדרות" }
        : info.last_error_message
          ? { key: "webhook", label: "קבלת הודעות", state: "error", detail: info.last_error_message }
          : { key: "webhook", label: "קבלת הודעות", state: "ok" },
    );
  } catch (error) {
    checks.push({ key: "webhook", label: "קבלת הודעות", state: "error", detail: (error as Error).message });
  }
  if (!dbReady) {
    checks.push({ key: "linked", label: "הצ׳אט שלך", state: "waiting", detail: "צריך מסד נתונים כדי לזכור את הצ׳אט" });
  } else {
    const telegram = await loadTelegram(getLifeStore());
    checks.push(
      telegram.chat_id !== null
        ? { key: "linked", label: "הצ׳אט שלך", state: "ok" }
        : { key: "linked", label: "הצ׳אט שלך", state: "missing", detail: "פותחים את הבוט מהקישור בהגדרות ולוחצים Start" },
    );
  }
  return checks;
}

async function cronCheck(dbReady: boolean, telegramReady: boolean): Promise<Check> {
  if (!dbReady || !telegramReady) {
    return { key: "cron", label: "הפעלה כל 5 דקות", state: "waiting", detail: "אחרי מסד הנתונים והבוט" };
  }
  const seen = await getLifeStore().getDoc<{ at: string }>("cron_seen");
  if (!seen) return { key: "cron", label: "הפעלה כל 5 דקות", state: "missing", detail: "עוד לא רץ אף פעם" };
  const minutes = Math.round((Date.now() - new Date(seen.at).getTime()) / 60000);
  const ago = minutes < 1 ? "עכשיו" : minutes < 60 ? `לפני ${minutes} דק׳` : minutes < 1440 ? `לפני ${Math.round(minutes / 60)} שעות` : `לפני ${Math.round(minutes / 1440)} ימים`;
  return minutes <= 15
    ? { key: "cron", label: "הפעלה כל 5 דקות", state: "ok", detail: `רץ לאחרונה ${ago}` }
    : { key: "cron", label: "הפעלה כל 5 דקות", state: "error", detail: `רץ לאחרונה ${ago}. בדוק את ה־cron ב־Supabase` };
}

export async function setupStatus(origin: string): Promise<SetupStatus> {
  const db = await databaseChecks();
  const dbReady = isSupabaseConfigured() && db.life.every((c) => c.state === "ok");
  const telegram = await telegramChecks(dbReady);
  const telegramReady = telegram.every((c) => c.state === "ok");
  return {
    env: ENV.map((e) => ({ ...e, set: Boolean(process.env[e.name]) })),
    database: { checks: db.life, sql_editor: sqlEditorUrl() },
    ai: process.env.ANTHROPIC_API_KEY
      ? { key: "ai", label: "מפתח Anthropic", state: "ok", detail: "מוגדר. אפשר לבדוק שהוא עובד" }
      : { key: "ai", label: "מפתח Anthropic", state: "missing", detail: "חסר ANTHROPIC_API_KEY" },
    telegram,
    cron: { check: await cronCheck(dbReady, telegramReady), sql: process.env.ADMIN_SESSION_SECRET ? cronSql(origin, await cronToken()) : null },
    site: db.site,
  };
}

/** Lists one model: free, and proves the key is valid and has access. */
export async function testAnthropicKey(): Promise<Check> {
  if (!process.env.ANTHROPIC_API_KEY) return { key: "ai", label: "מפתח Anthropic", state: "missing", detail: "חסר ANTHROPIC_API_KEY" };
  try {
    await new Anthropic().models.list({ limit: 1 });
    return { key: "ai", label: "מפתח Anthropic", state: "ok", detail: "המפתח עובד" };
  } catch (error) {
    const status = (error as { status?: number }).status;
    const detail = status === 401 ? "המפתח לא תקין. צור מפתח חדש והחלף אותו ב־Vercel" : status === 403 ? "אין הרשאה. בדוק את החשבון ב־Anthropic" : (error as Error).message;
    return { key: "ai", label: "מפתח Anthropic", state: "error", detail };
  }
}

/** The SQL files, for the copy buttons (traced into the route by next.config.ts). */
export async function setupSql(file: "life" | "schema") {
  return readFile(path.join(process.cwd(), "supabase", `${file}.sql`), "utf8");
}
