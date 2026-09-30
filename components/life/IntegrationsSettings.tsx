"use client";

import { useEffect, useState } from "react";
import { Check, Copy, KeyRound, Loader2, Plug, Trash2 } from "lucide-react";
import { lifeApi } from "./api";

type Key = { id: string; name: string; source: string; prefix: string; created_at: string; last_used_at: string | null };
type IntakeEvent = { at: string; source: string; type: string; result: string; detail?: string };
type Integrations = { endpoint: string; keys: Key[]; recent: IntakeEvent[] };

const RESULT_LABEL: Record<string, string> = {
  created: "נוסף ליד",
  updated: "עודכן ליד",
  won: "סגירה 🎉",
  ignored: "לא חם, רק ב־Bossi",
  counted: "שיחות נספרו",
  duplicate: "כפול, דולג",
  error: "שגיאה",
};

const ago = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "עכשיו";
  if (minutes < 60) return `לפני ${minutes} דק׳`;
  if (minutes < 1440) return `לפני ${Math.round(minutes / 60)} שע׳`;
  return new Date(iso).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" });
};

function snippet(endpoint: string) {
  return `// בשרת של Bossi (לא בדפדפן). המפתח במשתנה סביבה LIFE_INTAKE_KEY.
async function sendToLife(event) {
  await fetch("${endpoint}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: \`Bearer \${process.env.LIFE_INTAKE_KEY}\`,
    },
    body: JSON.stringify(event),
  }).catch(() => {}); // לא לעכב את Bossi אם זה נכשל
}

// בכל יצירה או עדכון של ליד. status: new | cold | hot | won | lost
sendToLife({
  type: "lead",
  event_id: \`\${lead.id}-\${lead.updatedAt}\`,
  lead: {
    external_id: lead.id,
    name: lead.name,
    phone: lead.phone,
    business_type: lead.businessType,
    status: lead.status,
    notes: lead.notes,
    follow_up_date: lead.followUpDate, // "2026-10-12" או null
    value: lead.dealValue,             // ₪, בסגירה
  },
});

// אחרי כל שיחה
sendToLife({ type: "call", event_id: call.id });`;
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (id: string, text: string) =>
    void navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(id);
        window.setTimeout(() => setCopied(null), 2000);
      })
      .catch(() => {});
  return { copied, copy };
}

/** Lives inside the settings <form>, so every button here is type="button". */
export function IntegrationsSettings() {
  const [data, setData] = useState<Integrations | null>(null);
  const [name, setName] = useState("Bossi");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { copied, copy } = useCopy();

  useEffect(() => {
    lifeApi<{ integrations: Integrations }>("/integrations")
      .then((d) => setData(d.integrations))
      .catch((e) => setError((e as Error).message));
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const d = await lifeApi<{ key: string; integrations: Integrations }>("/integrations", { method: "POST", body: { name } });
      setNewKey(d.key);
      setData(d.integrations);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (key: Key) => {
    if (!window.confirm(`לבטל את המפתח של ${key.name}? ${key.name} יפסיק לשלוח לכאן עד שתכניס מפתח חדש.`)) return;
    try {
      setData((await lifeApi<{ integrations: Integrations }>(`/integrations?id=${key.id}`, { method: "DELETE" })).integrations);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!data) return error ? <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null;

  return (
    <section className="rounded-2xl border border-border-soft bg-surface p-4 text-sm" aria-labelledby="integrations-title">
      <h2 id="integrations-title" className="mb-1 flex items-center gap-2 text-[15px] font-bold">
        <Plug className="h-4 w-4 text-gold-2" /> מערכות מחוברות
      </h2>
      <p className="mb-3 text-xs text-muted">
        לידים ושיחות מהמערכות שלך (Bossi). לכאן מגיעים רק לידים חמים וסגירות, וכל שיחה נספרת בפעילות המכירה היומית. לכל מערכת מפתח משלה.
      </p>

      {data.keys.length > 0 && (
        <ul className="mb-3 grid gap-1.5">
          {data.keys.map((k) => (
            <li key={k.id} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
              <KeyRound className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="font-semibold">{k.name}</span> <bdi className="font-latin text-xs text-muted">{k.prefix}…</bdi>
                <span className="block text-xs text-muted">{k.last_used_at ? `שלח לאחרונה ${ago(k.last_used_at)}` : "עוד לא שלח"}</span>
              </span>
              <button type="button" onClick={() => revoke(k)} aria-label={`ביטול המפתח של ${k.name}`} className="rounded-lg p-2 text-muted hover:text-red-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {newKey ? (
        <div className="mb-3 grid gap-2 rounded-xl border border-gold/40 bg-gold/[0.06] p-3">
          <p className="text-xs font-semibold text-gold-2">המפתח מוצג רק עכשיו. שים אותו ב־{name.trim() || "מערכת"} במשתנה סביבה LIFE_INTAKE_KEY, ולא בקוד שרץ בדפדפן.</p>
          <bdi className="font-latin break-all rounded-lg bg-black/30 px-2 py-1.5 text-xs">{newKey}</bdi>
          <div className="flex gap-2">
            <button type="button" onClick={() => copy("key", newKey)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gold py-2 text-xs font-bold text-[#1d1407]">
              {copied === "key" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "key" ? "הועתק" : "העתקת המפתח"}
            </button>
            <button type="button" onClick={() => setNewKey(null)} className="rounded-lg bg-white/5 px-3 text-xs text-muted">
              שמרתי
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-3 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם המערכת"
            aria-label="שם המערכת"
            className="min-w-0 flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted/70"
          />
          <button type="button" onClick={create} disabled={busy || !name.trim()} className="flex items-center gap-1.5 rounded-lg bg-gold px-3 text-xs font-bold text-[#1d1407] disabled:opacity-60">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} מפתח חדש
          </button>
        </div>
      )}

      <details className="min-w-0 text-xs">
        <summary className="cursor-pointer text-muted">איך מחברים את Bossi (קוד לדוגמה)</summary>
        <ol className="my-2 grid list-decimal gap-1 ps-5 text-muted">
          <li>יוצרים מפתח כאן ומעתיקים אותו.</li>
          <li>ב־Bossi מוסיפים משתנה סביבה LIFE_INTAKE_KEY עם המפתח.</li>
          <li>מוסיפים את הקוד למקום שבו ליד נשמר ולמקום שבו שיחה נרשמת.</li>
        </ol>
        <pre dir="ltr" className="font-latin max-h-72 overflow-auto rounded-lg bg-black/40 p-2 text-[11px] leading-relaxed text-left">
          {snippet(data.endpoint)}
        </pre>
        <button type="button" onClick={() => copy("code", snippet(data.endpoint))} className="mt-2 flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 font-semibold">
          {copied === "code" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied === "code" ? "הועתק" : "העתקת הקוד"}
        </button>
      </details>

      {data.recent.length > 0 && (
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer text-muted">מה הגיע לאחרונה ({data.recent.length})</summary>
          <ul className="mt-2 grid grid-cols-1 gap-1">
            {data.recent.slice(0, 10).map((e, i) => (
              <li key={`${e.at}-${i}`} className="flex min-w-0 justify-between gap-2">
                <span className="min-w-0 flex-1 truncate" title={e.detail}>
                  <span className={e.result === "error" ? "text-red-300" : ""}>{RESULT_LABEL[e.result] ?? e.result}</span>
                  {e.detail && <span className="text-muted"> · {e.detail}</span>}
                </span>
                <span className="shrink-0 text-muted">{ago(e.at)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
      {error && <p className="mt-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
    </section>
  );
}
