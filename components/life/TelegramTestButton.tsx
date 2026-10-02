"use client";

import { useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
import type { BotTest } from "@/lib/life/telegram";
import { lifeApi } from "./api";

/**
 * "Is the bot connected?": sends a real message to his Telegram chat, and when something is
 * missing says exactly what to do (with the link to press Start when the chat isn't bound yet).
 * type="button" because it also lives inside the settings <form>.
 */
export function TelegramTestButton({ onDone, className = "" }: { onDone?: () => void; className?: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BotTest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const d = await lifeApi<{ test: BotTest }>("/telegram", { method: "POST", body: { action: "test" } });
      setResult(d.test);
      onDone?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`grid gap-2 ${className}`}>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="flex items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        שליחת הודעת בדיקה מהבוט
      </button>
      {result?.ok && (
        <p className="flex items-start gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200" role="status">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            הבוט <bdi className="font-latin">@{result.bot}</bdi> מחובר. נשלחה אליך הודעה בטלגרם.
          </span>
        </p>
      )}
      {result && !result.ok && (
        <div className="grid gap-2 rounded-xl bg-amber-400/10 px-3 py-2 text-xs leading-relaxed text-amber-100" role="status">
          <p>{result.message}</p>
          {result.deep_link && (
            <a href={result.deep_link} target="_blank" rel="noreferrer" className="w-fit rounded-lg bg-[#229ED9] px-3 py-1.5 font-semibold text-white">
              פתיחת הבוט ← Start
            </a>
          )}
        </div>
      )}
      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
