"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { lifeApi } from "./api";

type Result = { kind: string; message: string; href: string };

const EXAMPLES = [
  "תזכיר לי מחר ב־10:00 להתקשר לדני",
  "להתקשר לרואה החשבון ביום חמישי",
  "לקח: לפני פגישה מכינים 3 שאלות #פגישה",
  "רעיון: בוט וואטסאפ ליבואנים",
  "הכנסה 1500 לקוח חדש",
  "משקל 84.2",
  "קניות: חלב, ביצים, עגבניות",
];

// Chat screens have their own input at the bottom; the button would sit on top of it.
const HIDDEN_ON = ["/life/chat", "/life/coach", "/life/agent"];

/** Event other screens listen to, so what was just added shows up without a reload. */
export const LIFE_CHANGED = "life:changed";

export function QuickCapture() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const button = buttonRef.current;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      button?.focus();
    };
  }, [open]);

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const d = await lifeApi<{ result: Result }>("/capture", { method: "POST", body: { text } });
      setResult(d.result);
      setText("");
      window.dispatchEvent(new Event(LIFE_CHANGED));
      inputRef.current?.focus();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen(true);
          setResult(null);
          setError(null);
        }}
        aria-label="הוספה מהירה"
        aria-expanded={open}
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gold text-[#1d1407] shadow-[0_8px_24px_-8px_rgba(212,162,78,0.8)] transition-transform active:scale-95"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="הוספה מהירה"
            onClick={(e) => e.stopPropagation()}
            className="mx-auto w-full max-w-md rounded-t-3xl border-t border-border-soft bg-[#0b0d1f] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-bold">הוספה מהירה</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="סגירה" className="rounded-lg p-1.5 text-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submit} className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submit();
                  }
                }}
                rows={2}
                enterKeyHint="send"
                placeholder="מה להוסיף? משימה, תזכורת, לקח, רעיון, הכנסה…"
                aria-label="מה להוסיף"
                style={{ outline: "none" }}
                className="min-w-0 flex-1 resize-none rounded-2xl border border-border-soft bg-surface px-3 py-2.5 text-base focus:border-gold"
              />
              <button type="submit" disabled={busy || !text.trim()} aria-label="הוספה" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-[#1d1407] disabled:opacity-50">
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" strokeWidth={2.5} />}
              </button>
            </form>

            {error && <p className="mt-2 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
            {result && (
              <p className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200" role="status">
                <span className="min-w-0">✓ {result.message}</span>
                <Link href={result.href} onClick={() => setOpen(false)} className="shrink-0 text-xs font-semibold text-emerald-100 underline">
                  פתיחה
                </Link>
              </p>
            )}

            <p className="mb-1.5 mt-3 text-xs text-muted">אפשר לכתוב כך (לחיצה ממלאת):</p>
            <div className="flex flex-wrap gap-1.5 pb-1">
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" onClick={() => setText(ex)} className="rounded-full border border-border-soft px-2.5 py-1 text-xs text-muted hover:text-foreground">
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
