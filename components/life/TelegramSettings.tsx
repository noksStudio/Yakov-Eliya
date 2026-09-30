"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2, Send } from "lucide-react";
import type { NotifyKey, NotifyPrefs } from "@/lib/life/notify";
import { lifeApi } from "./api";

type Status = {
  configured: boolean;
  linked: boolean;
  linked_at: string | null;
  bot_username: string | null;
  deep_link: string | null;
  rules: readonly { key: NotifyKey; label: string; hint: string }[];
  prefs: NotifyPrefs;
  muted: boolean;
  cron_sql: string;
};

/** Lives inside the settings <form>, so every button here is type="button". */
export function TelegramSettings({ demo }: { demo: boolean }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    lifeApi<{ telegram: Status }>("/telegram")
      .then((d) => setStatus(d.telegram))
      .catch((e) => setError((e as Error).message));
  }, []);

  const act = async (action: "setup" | "test" | "unlink" | "mute" | "unmute") => {
    setBusy(action);
    setError(null);
    setNote(null);
    try {
      const d = await lifeApi<{ telegram: Status }>("/telegram", { method: "POST", body: { action } });
      setStatus(d.telegram);
      if (action === "test") setNote("נשלחה הודעת בדיקה לטלגרם.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const toggle = async (key: NotifyKey, value: boolean) => {
    if (!status) return;
    setStatus({ ...status, prefs: { ...status.prefs, [key]: value } });
    try {
      const d = await lifeApi<{ telegram: Status }>("/telegram", { method: "PUT", body: { prefs: { [key]: value } } });
      setStatus(d.telegram);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const copySql = async () => {
    if (!status) return;
    await navigator.clipboard.writeText(status.cron_sql).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const button = "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60";

  return (
    <section className="rounded-2xl border border-border-soft bg-surface p-4 text-sm" aria-labelledby="telegram-title">
      <h2 id="telegram-title" className="mb-1 flex items-center gap-2 text-[15px] font-bold">
        <Send className="h-4 w-4 text-gold-2" /> התראות בטלגרם
      </h2>
      <p className="mb-3 text-xs text-muted">תזכורות לאורך היום, סיכום בוקר וערב, ורישום מהיר של משקל, הכנסות ואימונים. בשבת ובחג אין התראות.</p>

      {!status ? (
        error ? (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-red-300">{error}</p>
        ) : (
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted" aria-label="טוען" />
        )
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {demo && (
            <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              צריך קודם לחבר את Supabase: בלי מסד נתונים הבוט לא יזכור לאיזה צ׳אט לשלוח.
            </p>
          )}

          {!status.configured ? (
            <ol className="grid list-decimal gap-1.5 ps-5 text-xs text-muted">
              <li>
                בטלגרם, פותחים את <span className="font-latin text-foreground">@BotFather</span> ושולחים <span className="font-latin text-foreground">/newbot</span>.
              </li>
              <li>בוחרים שם ושם משתמש לבוט, ומעתיקים את הטוקן שמתקבל.</li>
              <li>
                ב־Vercel, מוסיפים משתנה סביבה <span className="font-latin text-foreground">TELEGRAM_BOT_TOKEN</span> ועושים Redeploy.
              </li>
              <li>חוזרים לכאן ולוחצים ״חיבור הבוט״.</li>
            </ol>
          ) : status.linked ? (
            <p className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              מחובר{status.bot_username && <> ל־<bdi className="font-latin">@{status.bot_username}</bdi></>}
            </p>
          ) : status.deep_link ? (
            <div className="grid gap-2">
              <p className="text-xs text-muted">שלב אחרון: פתח את הבוט ולחץ Start. הקישור חד־פעמי.</p>
              <a href={status.deep_link} target="_blank" rel="noreferrer" className={`${button} bg-[#229ED9] text-white`}>
                <Send className="h-4 w-4" /> פתיחת הבוט בטלגרם
              </a>
              <button type="button" onClick={() => location.reload()} className="text-xs text-muted underline">
                לחצתי Start, רענון
              </button>
            </div>
          ) : null}

          {status.configured && (
            <div className="flex flex-wrap gap-2">
              {!status.linked && (
                <button type="button" onClick={() => act("setup")} disabled={busy !== null} className={`${button} flex-1 bg-gold text-[#1d1407]`}>
                  {busy === "setup" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {status.deep_link ? "יצירת קישור חדש" : "חיבור הבוט"}
                </button>
              )}
              {status.linked && (
                <>
                  <button type="button" onClick={() => act("test")} disabled={busy !== null} className={`${button} flex-1 bg-white/10`}>
                    {busy === "test" && <Loader2 className="h-4 w-4 animate-spin" />}
                    הודעת בדיקה
                  </button>
                  <button type="button" onClick={() => act("setup")} disabled={busy !== null} className={`${button} bg-white/5 text-muted`}>
                    {busy === "setup" && <Loader2 className="h-4 w-4 animate-spin" />}
                    רענון חיבור
                  </button>
                  <button type="button" onClick={() => act("unlink")} disabled={busy !== null} className={`${button} bg-white/5 text-muted`}>
                    ניתוק
                  </button>
                </>
              )}
            </div>
          )}

          {note && <p className="text-xs text-emerald-300">{note}</p>}
          {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}

          {status.linked && (
            <div className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${status.muted ? "bg-amber-400/10" : "bg-white/5"}`}>
              <span className="min-w-0">
                <span className="block font-semibold">{status.muted ? "🔕 מושתק עד מחר בבוקר" : "יום עמוס?"}</span>
                <span className="text-xs text-muted">{status.muted ? "תזכורות שקבעת עדיין יגיעו" : "השתקת שאר ההתראות של היום. תזכורות עדיין יגיעו"}</span>
              </span>
              <button
                type="button"
                onClick={() => act(status.muted ? "unmute" : "mute")}
                disabled={busy !== null}
                className={`${button} shrink-0 ${status.muted ? "bg-white/10" : "bg-gold text-[#1d1407]"}`}
              >
                {(busy === "mute" || busy === "unmute") && <Loader2 className="h-4 w-4 animate-spin" />}
                {status.muted ? "ביטול השתקה" : "השתק היום"}
              </button>
            </div>
          )}

          <fieldset className="grid gap-1 border-t border-border-soft pt-3">
            <legend className="mb-1 text-xs font-bold text-muted">אילו התראות</legend>
            <p className="mb-1 text-xs text-muted">התראות שנופלות בטווח של 15 דקות מגיעות כהודעה אחת. בחול המועד מגיעה רק הודעת הבוקר.</p>
            {status.rules.map((rule) => (
              <label key={rule.key} className="flex items-center justify-between gap-3 py-1">
                <span>
                  <span className="block">{rule.label}</span>
                  <span className="text-xs text-muted">{rule.hint}</span>
                </span>
                <input
                  type="checkbox"
                  checked={status.prefs[rule.key]}
                  onChange={(e) => toggle(rule.key, e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-[#d4a24e]"
                />
              </label>
            ))}
          </fieldset>

          <details className="min-w-0 border-t border-border-soft pt-3">
            <summary className="cursor-pointer text-xs font-bold text-muted">הפעלת התזמון (פעם אחת, ב־Supabase)</summary>
            <p className="mt-2 text-xs text-muted">
              ב־Supabase: SQL Editor, מדביקים ומריצים. זה מפעיל בדיקה כל 5 דקות ששולחת את מה שהגיע זמנו. הקוד כולל מפתח אישי, לא לשתף.
            </p>
            <pre dir="ltr" className="mt-2 max-h-40 max-w-full overflow-auto rounded-xl bg-black/40 p-3 text-start text-[11px] leading-relaxed text-muted">
              {status.cron_sql}
            </pre>
            <button type="button" onClick={copySql} className={`${button} mt-2 w-full bg-white/10`}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "הועתק" : "העתקת הקוד"}
            </button>
          </details>
        </div>
      )}
    </section>
  );
}
