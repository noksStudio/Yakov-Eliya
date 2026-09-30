import { NextResponse } from "next/server";
import { BackupError, backupFilename, backupSummary, buildBackup, lastBackup, restoreBackup, sendBackup } from "@/lib/life/backup";
import { getLifeStore } from "@/lib/life/store";
import { loadTelegram } from "@/lib/life/telegram";

// Backup from settings (behind the admin login via proxy.ts): download, send to Telegram now,
// or restore from a file.

export const maxDuration = 60;

const fail = (error: unknown) => {
  if (error instanceof BackupError) return NextResponse.json({ error: error.message }, { status: 400 });
  console.error("[life/backup]", error);
  return NextResponse.json({ error: "הגיבוי נכשל" }, { status: 500 });
};

/** ?download=1: the file itself. Otherwise: when the last weekly backup went out. */
export async function GET(request: Request) {
  try {
    if (new URL(request.url).searchParams.get("download") !== "1") {
      return NextResponse.json({ last: await lastBackup(getLifeStore()) });
    }
    const backup = await buildBackup();
    return new NextResponse(JSON.stringify(backup), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${backupFilename()}"`,
        "Cache-Control": "no-store",
        "X-Backup-Summary": encodeURIComponent(backupSummary(backup)),
      },
    });
  } catch (error) {
    return fail(error);
  }
}

/** Sends a backup to Telegram right now. */
export async function POST() {
  try {
    const store = getLifeStore();
    const telegram = await loadTelegram(store);
    if (!telegram.chat_id) return NextResponse.json({ error: "הבוט עוד לא מחובר לצ׳אט" }, { status: 400 });
    const sent = await sendBackup(store, telegram.chat_id);
    return NextResponse.json({ sent, last: await lastBackup(store) });
  } catch (error) {
    return fail(error);
  }
}

/** Restores from a backup file (rows added or replaced by id; nothing deleted). */
export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    return NextResponse.json({ restored: await restoreBackup(body) });
  } catch (error) {
    return fail(error);
  }
}
