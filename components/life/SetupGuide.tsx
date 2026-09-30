"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import type { Check as CheckRow, CheckState, SetupStatus } from "@/lib/life/setup";
import { lifeApi } from "./api";

const DOT: Record<CheckState, string> = {
  ok: "bg-emerald-400",
  missing: "bg-amber-400",
  error: "bg-red-400",
  waiting: "bg-white/25",
};

export function SetupGuide() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [sql, setSql] = useState<{ life: string; schema: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiTest, setAiTest] = useState<CheckRow | null>(null);
  const [testing, setTesting] = useState(false);

  const fetchStatus = useCallback(
    () =>
      lifeApi<{ setup: SetupStatus }>("/setup")
        .then((d) => {
          setStatus(d.setup);
          setError(null);
        })
        .catch((e) => setError((e as Error).message))
        .finally(() => setLoading(false)),
    [],
  );
  const load = () => {
    setLoading(true);
    void fetchStatus();
  };

  useEffect(() => {
    void fetchStatus();
    // Fetched up front: iPhone Safari only allows copying inside the tap itself, not after a fetch.
    Promise.all(["life", "schema"].map((f) => fetch(`/api/life/setup?sql=${f}`, { cache: "no-store" }).then((r) => (r.ok ? r.text() : ""))))
      .then(([life, schema]) => setSql({ life, schema }))
      .catch(() => {});
  }, [fetchStatus]);

  const testAi = async () => {
    setTesting(true);
    try {
      setAiTest((await lifeApi<{ ai: CheckRow }>("/setup", { method: "POST" })).ai);
    } catch (e) {
      setAiTest({ key: "ai", label: "מפתח Anthropic", state: "error", detail: (e as Error).message });
    } finally {
      setTesting(false);
    }
  };

  if (!status) {
    return error ? (
      <p className="mt-10 rounded-xl bg-red-500/10 p-4 text-sm text-red-300">{error}</p>
    ) : (
      <div className="flex min-h-[60svh] items-center justify-center text-muted" role="status">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="בודק חיבורים" />
      </div>
    );
  }

  const allOk = (rows: CheckRow[]) => rows.length > 0 && rows.every((c) => c.state === "ok");
  const required = status.env.filter((e) => !e.optional);
  const ai = aiTest ?? status.ai;
  const steps = [
    required.every((e) => e.set),
    allOk(status.database.checks),
    ai.state === "ok",
    allOk(status.telegram),
    status.cron.check.state === "ok",
  ];
  const done = steps.filter(Boolean).length;
  const envByName = Object.fromEntries(status.env.map((e) => [e.name, e]));
  const envRows = (names: string[]) =>
    names.map((n): CheckRow => ({ key: n, label: n, state: envByName[n]?.set ? "ok" : "missing", detail: envByName[n]?.purpose }));

  return (
    <div className="flex flex-col gap-4">
      <Link href="/life/settings" className="flex w-fit items-center gap-1 text-xs text-muted">
        <ChevronLeft className="h-3.5 w-3.5 rotate-180" /> הגדרות
      </Link>
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">חיבור המערכת</h1>
          <p className="mt-1 text-sm text-muted">
            {done === steps.length ? "הכל מחובר ועובד." : `${done} מתוך ${steps.length} שלבים מוכנים. כל שלב אומר בדיוק מה לעשות.`}
          </p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold disabled:opacity-60">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> בדיקה מחדש
        </button>
      </header>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done} aria-label="התקדמות החיבור">
        <div className="h-full rounded-full bg-gold transition-[width]" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <p className="rounded-xl border border-border-soft bg-white/5 px-3 py-2 text-xs text-muted">
        🔒 מפתחות וסיסמאות מדביקים רק ב־Vercel, אף פעם לא בצ׳אט. המסך הזה רק בודק אם הם קיימים, ולא מציג אותם.
      </p>

      <Step n={1} title="משתני סביבה ב־Vercel" ok={steps[0]} summary="כל המפתחות יושבים ב־Vercel. אחרי כל הוספה צריך Redeploy.">
        <Rows rows={envRows(required.map((e) => e.name))} copyLabels />
        <Howto>
          <li>
            נכנסים ל־<Ext href="https://vercel.com/dashboard">Vercel</Ext>, בוחרים את הפרויקט.
          </li>
          <li>Settings ← Environment Variables ← מוסיפים שם וערך (לחיצה על שם ברשימה מעתיקה אותו).</li>
          <li>Deployments ← שלוש הנקודות ליד הגרסה האחרונה ← Redeploy. רק אחרי זה המשתנה נקלט.</li>
        </Howto>
      </Step>

      <Step n={2} title="מסד נתונים (Supabase)" ok={steps[1]} summary="בלי זה המערכת במצב הדגמה ולא שומרת כלום לאורך זמן.">
        <Rows rows={[...envRows(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]), ...tableRows(status.database.checks)]} />
        <Howto>
          {!envByName.SUPABASE_URL?.set && (
            <>
              <li>
                פותחים פרויקט ב־<Ext href="https://supabase.com/dashboard/new">Supabase</Ext> (האזור הקרוב: Frankfurt).
              </li>
              <li>Project Settings ← API: מעתיקים את Project URL ל־SUPABASE_URL, ואת מפתח service_role ל־SUPABASE_SERVICE_ROLE_KEY ב־Vercel. את המפתח הזה לא משתפים עם אף אחד.</li>
              <li>Redeploy, ואז חוזרים לכאן.</li>
            </>
          )}
          <li>מעתיקים את קוד הטבלאות ומריצים אותו ב־SQL Editor (Run). בטוח להריץ שוב גם אחרי עדכונים.</li>
        </Howto>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={sql?.life} label="העתקת קוד הטבלאות" />
          <Ext href={status.database.sql_editor ?? "https://supabase.com/dashboard"} button>
            {status.database.sql_editor ? "פתיחת SQL Editor" : "פתיחת Supabase"}
          </Ext>
        </div>
      </Step>

      <Step
        n={3}
        title="הסוכנים (Anthropic)"
        ok={steps[2]}
        summary="המנהל הראשי, המאמן והיועצים. בלעדיו הכל עובד חוץ מהצ׳אט עם הסוכנים."
        action={
          status.ai.state === "ok" && (
            <div className="grid gap-2">
              {aiTest && steps[2] && <Rows rows={[aiTest]} />}
            <button type="button" onClick={testAi} disabled={testing} className="flex w-fit items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
              {testing && <Loader2 className="h-4 w-4 animate-spin" />} בדיקה שהמפתח עובד
            </button>
            </div>
          )
        }
      >
        <Rows rows={[ai]} />
        <Howto>
          <li>
            נכנסים ל־<Ext href="https://console.anthropic.com/settings/keys">Anthropic Console</Ext> ← Create Key.
          </li>
          <li>מוסיפים ב־Vercel בשם ANTHROPIC_API_KEY, ועושים Redeploy.</li>
          <li>כדאי להגדיר תקרת הוצאה חודשית ב־Billing ← Limits.</li>
        </Howto>
      </Step>

      <Step n={4} title="בוט טלגרם" ok={steps[3]} summary="תזכורות, סיכום בוקר וערב, ורישום מהיר מהטלפון.">
        <Rows rows={status.telegram} />
        <Howto>
          <li>
            בטלגרם פותחים את <bdi className="font-latin">@BotFather</bdi> ← <bdi className="font-latin">/newbot</bdi> ← בוחרים שם ומעתיקים את הטוקן.
          </li>
          <li>מוסיפים ב־Vercel בשם TELEGRAM_BOT_TOKEN, ועושים Redeploy.</li>
          <li>בהגדרות לוחצים ״חיבור הבוט״, פותחים את הקישור ולוחצים Start.</li>
        </Howto>
        <Link href="/life/settings#telegram-title" className="flex w-fit items-center gap-2 rounded-xl bg-[#229ED9] px-4 py-2.5 text-sm font-semibold text-white">
          לחיבור הבוט בהגדרות
        </Link>
      </Step>

      <Step n={5} title="התראות אוטומטיות" ok={steps[4]} summary="Supabase מפעיל את המערכת כל 5 דקות כדי לשלוח את ההתראות בזמן.">
        <Rows rows={[status.cron.check]} />
        <Howto>
          <li>מעתיקים את הקוד (הוא כבר כולל את הכתובת והמפתח הנכונים).</li>
          <li>ב־Supabase: SQL Editor ← מדביקים ← Run. אחרי 5 דקות לוחצים ״בדיקה מחדש״ כאן.</li>
        </Howto>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={status.cron.sql ?? undefined} label="העתקת קוד ההפעלה" />
          {status.database.sql_editor && (
            <Ext href={status.database.sql_editor} button>
              פתיחת SQL Editor
            </Ext>
          )}
        </div>
      </Step>

      <Step n={6} title="לידים מהאתר (לא חובה)" ok={allOk(status.site)} summary="שמירת פניות מהאתר, רשימת הלידים במסך העסק, ומייל על כל ליד חדש." optional>
        <Rows rows={[...tableRows(status.site), ...envRows(["RESEND_API_KEY", "LEAD_NOTIFICATION_EMAIL"])]} />
        <Howto>
          <li>מעתיקים את קוד טבלאות האתר ומריצים ב־SQL Editor. בטוח להריץ שוב גם אחרי עדכונים.</li>
          <li>
            למייל על כל ליד: מפתח מ־<Ext href="https://resend.com/api-keys">Resend</Ext> ב־RESEND_API_KEY, והכתובת שלך ב־LEAD_NOTIFICATION_EMAIL.
          </li>
        </Howto>
        <CopyButton text={sql?.schema} label="העתקת קוד טבלאות האתר" />
      </Step>
    </div>
  );
}

/** A dozen table rows is noise: one line while they all agree, otherwise only the ones to fix. */
function tableRows(checks: CheckRow[]): CheckRow[] {
  if (!checks.length) return [];
  const ok = checks.filter((c) => c.state === "ok");
  if (ok.length === checks.length) return [{ key: "tables", label: `כל ${checks.length} הטבלאות קיימות`, state: "ok" }];
  if (checks.every((c) => c.state === "waiting")) return [{ key: "tables", label: `${checks.length} טבלאות`, state: "waiting", detail: checks[0].detail }];
  const bad = checks.filter((c) => c.state !== "ok");
  return ok.length ? [...bad, { key: "tables-ok", label: `עוד ${ok.length} טבלאות תקינות`, state: "ok" }] : bad;
}

function Step({
  n,
  title,
  ok,
  summary,
  optional,
  action,
  children,
}: {
  n: number;
  title: string;
  ok: boolean;
  summary: string;
  optional?: boolean;
  /** Stays visible when a finished step folds its details away. */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-2xl border bg-surface p-4 text-sm ${ok ? "border-emerald-400/25" : "border-border-soft"}`} aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="flex items-center gap-2.5 text-[15px] font-bold">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${ok ? "bg-emerald-400 text-[#06231a]" : "bg-white/10"}`}>
          {ok ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : n}
        </span>
        {title}
        {ok && <span className="text-xs font-normal text-emerald-300">מחובר</span>}
        {!ok && optional && <span className="text-xs font-normal text-muted">אפשר גם אחר כך</span>}
      </h2>
      <p className="mb-3 mt-1 text-xs text-muted">{summary}</p>
      {ok ? (
        <details className="group">
          <summary className="cursor-pointer text-xs text-muted">פרטים</summary>
          <div className="mt-3 grid grid-cols-1 gap-3">{children}</div>
        </details>
      ) : (
        <div className="grid grid-cols-1 gap-3">{children}</div>
      )}
      {action && <div className="mt-3">{action}</div>}
    </section>
  );
}

function Rows({ rows, copyLabels }: { rows: CheckRow[]; copyLabels?: boolean }) {
  return (
    <ul className="grid grid-cols-1 gap-1.5">
      {rows.map((r) => (
        <li key={r.key} className="flex min-w-0 items-start gap-2">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[r.state]}`} aria-hidden />
          <span className="min-w-0">
            {copyLabels ? <CopyText text={r.label} /> : <bdi className={/^[\w-]+$/.test(r.label) ? "font-latin break-all text-xs" : ""}>{r.label}</bdi>}
            <span className="sr-only">{r.state === "ok" ? " (תקין)" : r.state === "waiting" ? " (ממתין)" : r.state === "error" ? " (שגיאה)" : " (חסר)"}</span>
            {r.detail && <span className="block break-words text-xs text-muted">{r.detail}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Howto({ children }: { children: React.ReactNode }) {
  return <ol className="grid list-decimal gap-1.5 rounded-xl bg-white/5 px-3 py-2.5 ps-7 text-xs leading-relaxed text-muted">{children}</ol>;
}

function Ext({ href, button, children }: { href: string; button?: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={button ? "flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold" : "inline-flex items-center gap-0.5 text-foreground underline"}
    >
      {children}
      <ExternalLink className={button ? "h-3.5 w-3.5" : "h-3 w-3"} aria-hidden />
    </a>
  );
}

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    void navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };
  return { copied, copy };
}

function CopyButton({ text, label }: { text?: string; label: string }) {
  const { copied, copy } = useCopy();
  return (
    <button type="button" disabled={!text} onClick={() => text && copy(text)} className="flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-[#1d1407] disabled:opacity-50">
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "הועתק" : label}
    </button>
  );
}

function CopyText({ text }: { text: string }) {
  const { copied, copy } = useCopy();
  return (
    <button type="button" onClick={() => copy(text)} className="font-latin inline-flex max-w-full items-center gap-1 break-all text-start text-xs" aria-label={`העתקת ${text}`}>
      <bdi>{text}</bdi>
      {copied ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3 text-muted" />}
    </button>
  );
}
