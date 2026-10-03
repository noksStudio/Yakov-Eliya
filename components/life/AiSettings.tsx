"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Cpu } from "lucide-react";
import { lifeApi } from "./api";

type Ai = { enabled: boolean; has_key: boolean };

/** The AI switch (off by default) and the way to the rules. Inside the settings <form>. */
export function AiSettings() {
  const [ai, setAi] = useState<Ai | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    lifeApi<{ ai: Ai }>("/ai")
      .then((d) => setAi(d.ai))
      .catch((e) => setError((e as Error).message));
  }, []);

  const toggle = async (enabled: boolean) => {
    setError(null);
    try {
      setAi((await lifeApi<{ ai: Ai }>("/ai", { method: "PUT", body: { enabled } })).ai);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <section className="rounded-2xl border border-border-soft bg-surface p-4 text-sm" aria-labelledby="ai-title">
      <h2 id="ai-title" className="mb-1 flex items-center gap-2 text-[15px] font-bold">
        <Cpu className="h-4 w-4 text-gold-2" /> AI וחוקים
      </h2>
      <p className="mb-3 text-xs text-muted">
        כרגע המערכת עובדת על מנוע חוקים: ההמלצות, ההתראות והעוזר בצ׳אט מחושבים מהנתונים שלך, מיידית ובלי עלות. ההתראות לעולם לא משתמשות ב־AI.
      </p>
      {ai && (
        <label className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2.5">
          <span>
            <span className="block font-semibold">AI: {ai.enabled ? "דולק" : "כבוי"}</span>
            <span className="text-xs text-muted">
              {ai.enabled ? "הצ׳אט עם הסוכנים משתמש ב־Claude (בתשלום לפי שימוש)." : ai.has_key ? "יש מפתח, אבל שום דבר לא נשלח אליו עד שתדליק." : "אין מפתח Anthropic, וזה בסדר."}
            </span>
          </span>
          <input
            type="checkbox"
            checked={ai.enabled}
            onChange={(e) => toggle(e.target.checked)}
            disabled={!ai.has_key && !ai.enabled}
            className="h-5 w-5 shrink-0 accent-[#d4a24e] disabled:opacity-40"
            aria-label="הפעלת AI"
          />
        </label>
      )}
      {error && <p className="mt-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
      <Link href="/life/settings/rules" className="mt-3 flex items-center justify-between rounded-xl border border-border-soft px-3 py-2.5">
        <span>
          <span className="block font-semibold">החוקים של המערכת</span>
          <span className="text-xs text-muted">מה כל חוק בודק, ואפשרות לכבות כל אחד</span>
        </span>
        <ChevronLeft className="h-4 w-4 text-muted" />
      </Link>
    </section>
  );
}
