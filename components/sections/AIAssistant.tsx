"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, Sparkles, User } from "lucide-react";
import { Section, SectionTitle } from "@/components/ui/Section";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { matchAssistant, suggestedQuestions } from "@/lib/assistant";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
};

let idCounter = 1;

const initialMessage: Message = {
  id: 0,
  role: "assistant",
  text: "היי! ספר לי מה מעסיק אותך בעסק כרגע, ואני אכוון אותך לפתרון הכי רלוונטי.",
};

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || typing) return;

    const userMsg: Message = { id: ++idCounter, role: "user", text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);
    scrollToBottom();

    const match = matchAssistant(trimmed);
    const delay = 500 + Math.min(trimmed.length * 12, 700);

    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: ++idCounter,
          role: "assistant",
          text: match.answer,
          ctaLabel: match.ctaLabel,
          ctaHref: match.ctaHref,
        },
      ]);
      setTyping(false);
      scrollToBottom();
    }, delay);
  }

  return (
    <Section id="assistant" glow="center">
      <SectionTitle
        eyebrow="עוזר עסקי חכם"
        title="לא בטוח מה העסק שלך צריך?"
        description="קודם כל אפשר להתייעץ עם הצ'אט. הוא יעזור לך לזהות בעיות ולהציע פתרונות – ותמיד אפשר גם לגלול ולראות את כל השירותים בעצמך."
      />

      <ScrollReveal className="mt-14">
        <div className="glow-border glass mx-auto flex max-w-2xl flex-col overflow-hidden rounded-3xl">
          <div className="flex items-center gap-3 border-b border-border-soft px-5 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))]">
              <Bot className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="text-sm font-semibold">העוזר העסקי של יעקב-אליה</p>
              <p className="text-xs text-muted">מגיב תוך שניות · מבוסס על ניסיון מהשטח</p>
            </div>
          </div>

          <div
            ref={listRef}
            className="flex h-80 flex-col gap-4 overflow-y-auto px-5 py-5 sm:h-96"
          >
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-2.5 ${
                    m.role === "user" ? "flex-row-reverse self-start" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      m.role === "assistant"
                        ? "bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))]"
                        : "bg-surface-strong"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <Bot className="h-3.5 w-3.5 text-white" />
                    ) : (
                      <User className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === "assistant"
                        ? "bg-surface-strong"
                        : "bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))] text-white"
                    }`}
                  >
                    <p>{m.text}</p>
                    {m.ctaHref && (
                      <a
                        href={m.ctaHref}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary-2 underline underline-offset-4"
                      >
                        {m.ctaLabel}
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
              {typing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2.5"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))]">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </span>
                  <div className="flex gap-1 rounded-2xl bg-surface-strong px-4 py-3">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-muted"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border-soft px-5 py-3">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="rounded-full border border-border-soft bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-primary-2/50 hover:text-foreground"
              >
                <Sparkles className="ms-1 inline h-3 w-3" />
                {q}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border-soft p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="מה מעסיק אותך בעסק?"
              className="flex-1 rounded-full bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-primary-2/40"
            />
            <button
              type="submit"
              aria-label="שליחה"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))] text-white transition-transform hover:scale-105"
            >
              <Send className="h-4 w-4 -scale-x-100" />
            </button>
          </form>
        </div>
      </ScrollReveal>
    </Section>
  );
}
