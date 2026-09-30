"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Crown, Loader2, Send } from "lucide-react";
import type { ChatMessage } from "@/lib/life/types";
import { lifeApi } from "./api";

const PRESETS: Record<string, string> = {
  morning: "בנה לי את תכנית הבוקר להיום.",
  evening: "בוא נסגור את היום ונתכנן את מחר.",
};

const SUGGESTIONS = ["בנה לי את תכנית הבוקר להיום.", "מה הכי חשוב לעשות עכשיו?", "בוא נסגור את היום ונתכנן את מחר."];

export function ChiefChat() {
  const params = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const presetSent = useRef(false);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || pending) return;
    setPending(message);
    setError(null);
    setInput("");
    try {
      const data = await lifeApi<{ messages: ChatMessage[] }>("/chat", { method: "POST", body: { message } });
      setMessages((prev) => [...prev, ...data.messages]);
    } catch (e) {
      setError((e as Error).message);
      setInput(message);
    } finally {
      setPending(null);
    }
  };

  useEffect(() => {
    lifeApi<{ messages: ChatMessage[]; connected: boolean }>("/chat")
      .then((data) => {
        setMessages(data.messages);
        setConnected(data.connected);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoaded(true));
  }, []);

  // A shortcut from "היום שלי" (?preset=morning|evening) sends its request once, after loading.
  useEffect(() => {
    const preset = PRESETS[params.get("preset") ?? ""];
    if (!loaded || !preset || presetSent.current || !connected) return;
    presetSent.current = true;
    window.history.replaceState(null, "", "/life/chat");
    void send(preset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, connected, params]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, pending]);

  return (
    <div className="flex min-h-[calc(100svh-7rem)] flex-col">
      <header className="flex items-center gap-3 pb-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f8d995,#c98f3e)] text-[#1d1407]">
          <Crown className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-black">המנהל הראשי</h1>
          <p className="text-xs text-muted">מוריד הכל ללו״ז ולמשימות</p>
        </div>
      </header>

      {!connected && (
        <div className="mb-3 rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-200">
          המנהל עוד לא מחובר. כדי להפעיל אותו צריך להוסיף מפתח API של Anthropic בהגדרות הסביבה (ANTHROPIC_API_KEY).
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2.5 pb-3" aria-live="polite">
        {loaded && messages.length === 0 && !pending && (
          <div className="mt-6 text-center text-sm text-muted">
            <p>ספר לי מה על הפרק, או בחר אחת מההצעות.</p>
          </div>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} role={m.role} text={m.content} />
        ))}
        {pending && (
          <>
            <Bubble role="user" text={pending} />
            <div className="flex items-center gap-2 self-start rounded-2xl rounded-ss-sm bg-surface-strong px-4 py-3 text-sm text-muted" role="status">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> המנהל חושב…
            </div>
          </>
        )}
        {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] -mx-4 bg-background/95 px-4 pb-2 pt-2">
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={Boolean(pending)}
              onClick={() => send(s)}
              className="shrink-0 rounded-full border border-border-soft bg-surface px-3 py-1.5 text-xs text-muted hover:text-foreground disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            placeholder="כתוב למנהל…"
            aria-label="הודעה למנהל"
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-border-soft bg-surface px-4 py-2.5 text-[15px] outline-none placeholder:text-muted/70 focus:border-gold/40"
          />
          <button
            type="submit"
            disabled={!input.trim() || Boolean(pending)}
            aria-label="שלח"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-[#1d1407] disabled:opacity-40"
          >
            <Send className="h-4.5 w-4.5 -scale-x-100" />
          </button>
        </form>
      </div>
    </div>
  );
}

function Bubble({ role, text }: { role: ChatMessage["role"]; text: string }) {
  const mine = role === "user";
  return (
    <div
      className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
        mine ? "self-end rounded-se-sm bg-gold/90 text-[#1d1407]" : "self-start rounded-ss-sm bg-surface-strong"
      }`}
    >
      {text}
    </div>
  );
}
