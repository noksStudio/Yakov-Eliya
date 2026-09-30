import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import type { LifeStore } from "./store";
import { sendDocument } from "./telegram";
import { addDays, israelToday, restDayOf } from "./time";

// Backup: one JSON file with every table of the personal system (plus the website's leads), to
// keep and to restore from. The hitbodedut journal is never in it: it stays only in the database.
// Sent to Telegram once a week (Sunday morning, or the first working day after), and available
// from settings any time.

export const BACKUP_FORMAT = "yakov-life-backup";
export const BACKUP_VERSION = 1;

// In restore order: events before tasks (a task can point at an event).
export const BACKUP_TABLES = [
  "life_settings",
  "life_events",
  "life_tasks",
  "life_checkins",
  "life_docs",
  "life_shopping",
  "life_finance",
  "life_deals",
  "life_activity",
  "life_ideas",
  "life_lessons",
  "life_messages",
  "leads",
] as const;
export type BackupTable = (typeof BACKUP_TABLES)[number];

export type Backup = {
  format: typeof BACKUP_FORMAT;
  version: number;
  created_at: string;
  tables: Partial<Record<BackupTable, Record<string, unknown>[]>>;
};

export class BackupError extends Error {}

const PAGE = 1000;

async function allRows(table: BackupTable) {
  const db = getSupabaseAdmin();
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from(table).select("*").range(from, from + PAGE - 1);
    if (error) {
      // The website's leads table may not exist yet; everything else must.
      if (table === "leads") return null;
      throw new BackupError(`${table}: ${error.message}`);
    }
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

export async function buildBackup(now = new Date()): Promise<Backup> {
  if (!isSupabaseConfigured()) throw new BackupError("הגיבוי זמין אחרי חיבור Supabase: במצב הדגמה אין נתונים שנשמרים.");
  const tables: Backup["tables"] = {};
  for (const table of BACKUP_TABLES) {
    const rows = await allRows(table);
    if (rows) tables[table] = rows;
  }
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, created_at: now.toISOString(), tables };
}

export const backupFilename = (date = israelToday()) => `life-backup-${date}.json`;

/** "142 משימות · 38 אירועים · …": what a backup holds, for the Telegram caption and the UI. */
export function backupSummary(backup: Backup) {
  const t = backup.tables;
  const parts = [
    [t.life_tasks?.length, "משימות"],
    [t.life_events?.length, "אירועים"],
    [t.life_checkins?.length, "ימי צ׳ק־אין"],
    [t.life_finance?.length, "תנועות כסף"],
    [t.life_deals?.length, "עסקאות"],
    [t.leads?.length, "לידים"],
    [t.life_ideas?.length, "רעיונות"],
    [t.life_lessons?.length, "לקחים"],
  ] as const;
  return parts
    .filter(([n]) => n)
    .map(([n, label]) => `${n} ${label}`)
    .join(" · ");
}

/**
 * Restores a backup file: rows are written back by their id (added if missing, replaced if
 * there), and nothing newer is deleted. The journal is ignored even if a file has it.
 */
export async function restoreBackup(input: unknown) {
  if (!isSupabaseConfigured()) throw new BackupError("שחזור אפשרי רק אחרי חיבור Supabase.");
  const backup = input as Partial<Backup> | null;
  if (!backup || backup.format !== BACKUP_FORMAT || typeof backup.tables !== "object" || backup.tables === null) {
    throw new BackupError("זה לא קובץ גיבוי של המערכת.");
  }
  if ((backup.version ?? 0) > BACKUP_VERSION) throw new BackupError("קובץ הגיבוי מגרסה חדשה יותר של המערכת.");
  const db = getSupabaseAdmin();
  const restored: Partial<Record<BackupTable, number>> = {};
  for (const table of BACKUP_TABLES) {
    const rows = backup.tables[table];
    if (!Array.isArray(rows) || !rows.length) continue;
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await db.from(table).upsert(rows.slice(i, i + 500));
      if (error) throw new BackupError(`${table}: ${error.message}`);
    }
    restored[table] = rows.length;
  }
  return restored;
}

type BackupLog = { week: string | null; at: string | null; failed_at?: string | null };
const weekOf = (date: string) => addDays(date, -new Date(`${date}T12:00:00Z`).getUTCDay());

/**
 * Due on the first working day of a week that has no backup yet (Sunday, unless it is Yom Tov).
 * After a failed attempt, the next try waits an hour.
 */
export async function backupDue(store: LifeStore, date: string, now = new Date()) {
  if (restDayOf(date)) return false;
  const log = await store.getDoc<BackupLog>("backup_log");
  if (log?.week === weekOf(date)) return false;
  return !log?.failed_at || now.getTime() - new Date(log.failed_at).getTime() > 3_600_000;
}

export async function markBackupFailed(store: LifeStore) {
  const log = await store.getDoc<BackupLog>("backup_log");
  await store.saveDoc<BackupLog>("backup_log", { week: log?.week ?? null, at: log?.at ?? null, failed_at: new Date().toISOString() });
}

/** Builds the backup and sends it to his Telegram chat, silently (no notification sound). */
export async function sendBackup(store: LifeStore, chatId: number, date = israelToday()) {
  const backup = await buildBackup();
  const body = JSON.stringify(backup);
  const caption = [`🗄️ גיבוי שבועי · ${date.split("-").reverse().join(".")}`, backupSummary(backup), "לשחזור: הגדרות ← גיבוי ← שחזור מקובץ. יומן ההתבודדות לא בגיבוי."]
    .filter(Boolean)
    .join("\n");
  await sendDocument(chatId, backupFilename(date), body, caption);
  await store.saveDoc<BackupLog>("backup_log", { week: weekOf(date), at: new Date().toISOString(), failed_at: null });
  return { bytes: new TextEncoder().encode(body).length, summary: backupSummary(backup) };
}

export async function lastBackup(store: LifeStore) {
  return (await store.getDoc<BackupLog>("backup_log"))?.at ?? null;
}
