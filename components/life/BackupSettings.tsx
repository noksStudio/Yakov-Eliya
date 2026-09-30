"use client";

import { useEffect, useRef, useState } from "react";
import { Archive, Download, Loader2, Send, Upload } from "lucide-react";
import { lifeApi } from "./api";

const MAX_RESTORE_BYTES = 4 * 1024 * 1024;

function when(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "numeric" })} ב־${d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`;
}

/** Lives inside the settings <form>, so every button here is type="button". */
export function BackupSettings() {
  const [last, setLast] = useState<string | null>(null);
  const [busy, setBusy] = useState<"download" | "send" | "restore" | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    lifeApi<{ last: string | null }>("/backup")
      .then((d) => setLast(d.last))
      .catch(() => {});
  }, []);

  const start = (kind: "download" | "send" | "restore") => {
    setBusy(kind);
    setNote(null);
    setError(null);
  };

  const download = async () => {
    start("download");
    try {
      const res = await fetch("/api/life/backup?download=1", { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "הגיבוי נכשל");
      const blob = await res.blob();
      const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? "life-backup.json";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setNote(`הקובץ ירד: ${decodeURIComponent(res.headers.get("X-Backup-Summary") ?? "")}`);
    } catch (e) {
      setError((e as Error).message.includes("fetch") ? "אין חיבור לאינטרנט." : (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const send = async () => {
    start("send");
    try {
      const d = await lifeApi<{ sent: { summary: string }; last: string }>("/backup", { method: "POST" });
      setLast(d.last);
      setNote(`נשלח לטלגרם: ${d.sent.summary}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const restore = async (file: File) => {
    start("restore");
    try {
      if (file.size > MAX_RESTORE_BYTES) throw new Error("הקובץ גדול מדי לשחזור מהטלפון (מעל 4MB).");
      let backup: { format?: string; created_at?: string; tables?: Record<string, unknown[]> };
      try {
        backup = JSON.parse(await file.text());
      } catch {
        throw new Error("זה לא קובץ גיבוי של המערכת.");
      }
      if (backup.format !== "yakov-life-backup") throw new Error("זה לא קובץ גיבוי של המערכת.");
      // The journal is never restored, even if a file has it.
      const rows = Object.entries(backup.tables ?? {})
        .filter(([table]) => table !== "life_journal")
        .reduce((n, [, t]) => n + (Array.isArray(t) ? t.length : 0), 0);
      const from = backup.created_at ? when(backup.created_at) : "תאריך לא ידוע";
      if (!window.confirm(`לשחזר ${rows} פריטים מגיבוי של ${from}?\n\nמה שחסר יחזור, ופריטים קיימים יחזרו למצב שבגיבוי. שום דבר לא יימחק.`)) return;
      const d = await lifeApi<{ restored: Record<string, number> }>("/backup", { method: "PUT", body: backup });
      setNote(`שוחזרו ${Object.values(d.restored).reduce((a, b) => a + b, 0)} פריטים. רענן את המסכים כדי לראות.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const button = "flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold disabled:opacity-60";

  return (
    <section className="rounded-2xl border border-border-soft bg-surface p-4 text-sm" aria-labelledby="backup-title">
      <h2 id="backup-title" className="mb-1 flex items-center gap-2 text-[15px] font-bold">
        <Archive className="h-4 w-4 text-gold-2" /> גיבוי
      </h2>
      <p className="mb-3 text-xs text-muted">
        כל יום ראשון בבוקר נשלח קובץ גיבוי לטלגרם, בלי צליל. יומן ההתבודדות לא נכלל בגיבוי ונשאר רק במסד הנתונים.
        {last && <span className="mt-1 block text-foreground/80">גיבוי אחרון: {when(last)}</span>}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={download} disabled={busy !== null} className={`${button} bg-white/10`}>
          {busy === "download" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          הורדת גיבוי
        </button>
        <button type="button" onClick={send} disabled={busy !== null} className={`${button} bg-white/10`}>
          {busy === "send" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          שליחה לטלגרם
        </button>
      </div>

      <label className={`${button} mt-2 cursor-pointer border border-dashed border-border-soft text-muted ${busy !== null ? "pointer-events-none opacity-60" : ""}`}>
        {busy === "restore" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        שחזור מקובץ גיבוי
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void restore(file);
          }}
        />
      </label>

      {note && (
        <p className="mt-2 text-xs text-emerald-300" role="status">
          {note}
        </p>
      )}
      {error && <p className="mt-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
    </section>
  );
}
