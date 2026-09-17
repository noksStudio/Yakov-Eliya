"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Bot, MessageCircle, RotateCcw, Send, User, X } from "lucide-react";
import { classify, painChips } from "@/lib/advisor";
import type { Track } from "@/lib/tracks";
import { useChatWidget } from "@/components/chat/ChatContext";

type Stage = "business" | "pain" | "lead-offer" | "lead-name" | "lead-phone" | "chat";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  tracks?: Track[];
};

let idCounter = 1;

const greeting: Message = {
  id: 0,
  role: "assistant",
  text: "היי! אני היועץ העסקי של יעקב-אליה. ספר לי קודם כל — במה אתה עוסק?",
};

function recommendationText(tracks: Track[]) {
  if (tracks.length === 0) {
    return "לא הצלחתי לזהות כיוון ספציפי מהתשובה שלך — אפשר לספר לי קצת יותר, או פשוט לקבוע שיחה קצרה ונבין ביחד.";
  }
  if (tracks.length === 1) {
    return "מצאתי כיוון שנראה לי מדויק בשבילך:";
  }
  return "מצאתי כמה כיוונים שיכולים להתאים לך:";
}

async function ensureConversation(existingId: string | null): Promise<string | null> {
  if (existingId) return existingId;
  try {
    const res = await fetch("/api/conversations", { method: "POST" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id as string;
  } catch {
    return null;
  }
}

function syncConversation(id: string | null, patch: Record<string, unknown>) {
  if (!id) return;
  fetch(`/api/conversations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  }).catch(() => {
    // best-effort persistence; a failed sync should never break the chat UX
  });
}

export function FloatingChat() {
  const { isOpen, closeChat, toggleChat } = useChatWidget();
  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [stage, setStage] = useState<Stage>("business");
  const [businessAnswer, setBusinessAnswer] = useState("");
  const [painAnswer, setPainAnswer] = useState("");
  const [trackSlugs, setTrackSlugs] = useState<string[]>([]);
  const [leadName, setLeadName] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }, [isOpen, messages, typing]);

  function reset() {
    setMessages([greeting]);
    setStage("business");
    setBusinessAnswer("");
    setPainAnswer("");
    setTrackSlugs([]);
    setLeadName("");
    setConversationId(null);
    setInput("");
  }

  async function send(displayText: string, matchText: string = displayText) {
    const trimmed = displayText.trim();
    if (!trimmed || typing) return;

    const userMsg: Message = { id: ++idCounter, role: "user", text: trimmed };
    const messagesWithUser = [...messages, userMsg];
    setMessages(messagesWithUser);
    setInput("");
    setTyping(true);

    const id = await ensureConversation(conversationId);
    if (id && id !== conversationId) setConversationId(id);

    const delay = 500 + Math.min(trimmed.length * 10, 600);

    window.setTimeout(() => {
      let assistantMsgs: Message[] = [];
      let nextStage: Stage = stage;
      let nextBusiness = businessAnswer;
      let nextPain = painAnswer;
      let nextTrackSlugs = trackSlugs;

      if (stage === "business") {
        nextBusiness = matchText;
        assistantMsgs = [
          { id: ++idCounter, role: "assistant", text: "תודה! ומה הקושי הכי גדול שאתה מתמודד איתו בעסק כרגע?" },
        ];
        nextStage = "pain";
      } else if (stage === "pain") {
        nextPain = matchText;
        const matches = classify(`${businessAnswer} ${matchText}`);
        nextTrackSlugs = matches.map((t) => t.slug);
        assistantMsgs = [
          { id: ++idCounter, role: "assistant", text: recommendationText(matches), tracks: matches },
        ];
        if (matches.length > 0) {
          assistantMsgs.push({
            id: ++idCounter,
            role: "assistant",
            text: "רוצה שאשמור את הפרטים שלך כדי שיעקב יחזור אליך אישית עם הצעה מותאמת?",
          });
          nextStage = "lead-offer";
        } else {
          nextStage = "chat";
        }
      } else if (stage === "lead-offer") {
        if (matchText === "yes") {
          assistantMsgs = [{ id: ++idCounter, role: "assistant", text: "מה השם שלך?" }];
          nextStage = "lead-name";
        } else if (matchText === "no") {
          assistantMsgs = [
            {
              id: ++idCounter,
              role: "assistant",
              text: "בסדר גמור! אפשר גם לגלוש בין ההמלצות למעלה, או להמשיך לשאול אותי כל דבר.",
            },
          ];
          nextStage = "chat";
        } else {
          const matches = classify(matchText);
          nextTrackSlugs = matches.map((t) => t.slug);
          assistantMsgs = [
            { id: ++idCounter, role: "assistant", text: recommendationText(matches), tracks: matches },
          ];
          nextStage = "chat";
        }
      } else if (stage === "lead-name") {
        setLeadName(matchText);
        assistantMsgs = [
          { id: ++idCounter, role: "assistant", text: "מעולה! ומה מספר הטלפון הכי טוב ליצור איתך קשר?" },
        ];
        nextStage = "lead-phone";
      } else if (stage === "lead-phone") {
        const name = leadName;
        const phone = matchText;
        fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            phone,
            business_type: businessAnswer,
            pain: painAnswer,
            track_slug: trackSlugs[0] ?? null,
            conversation_id: id,
          }),
        }).catch(() => {
          // best-effort; the chat confirmation still reflects intent either way
        });
        assistantMsgs = [
          { id: ++idCounter, role: "assistant", text: `מעולה, ${name}! יעקב יחזור אליך בהקדם 🙌` },
        ];
        nextStage = "chat";
      } else {
        const matches = classify(matchText);
        nextTrackSlugs = matches.map((t) => t.slug);
        assistantMsgs = [
          { id: ++idCounter, role: "assistant", text: recommendationText(matches), tracks: matches },
        ];
      }

      const finalMessages = [...messagesWithUser, ...assistantMsgs];
      setMessages(finalMessages);
      setStage(nextStage);
      setBusinessAnswer(nextBusiness);
      setPainAnswer(nextPain);
      setTrackSlugs(nextTrackSlugs);
      setTyping(false);

      syncConversation(id, {
        messages: finalMessages,
        business_type: nextBusiness || null,
        pain: nextPain || null,
        track_slugs: nextTrackSlugs,
      });
    }, delay);
  }

  return (
    <div className="fixed bottom-6 left-6 z-[60] flex flex-col items-start gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="glow-border glass flex h-[32rem] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-3xl shadow-2xl sm:w-96"
          >
            <div className="flex items-center gap-3 border-b border-border-soft px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))]">
                <Bot className="h-5 w-5 text-white" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">היועץ העסקי של יעקב-אליה</p>
                <p className="text-xs text-muted">מכוון אותך לפתרון הנכון</p>
              </div>
              <button
                onClick={reset}
                aria-label="שיחה חדשה"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-strong hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={closeChat}
                aria-label="סגירה"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-strong hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={listRef} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-2 ${m.role === "user" ? "flex-row-reverse self-start" : ""}`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        m.role === "assistant"
                          ? "bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))]"
                          : "bg-surface-strong"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        <Bot className="h-3 w-3 text-white" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                    </span>
                    <div className="flex max-w-[85%] flex-col gap-2">
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          m.role === "assistant"
                            ? "bg-surface-strong"
                            : "bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))] text-white"
                        }`}
                      >
                        {m.text}
                      </div>
                      {m.tracks?.map((track) => (
                        <Link
                          key={track.slug}
                          href={track.path}
                          onClick={closeChat}
                          className="group flex flex-col gap-1 rounded-xl border border-border-soft bg-surface px-3.5 py-3 transition-colors hover:border-primary-2/50"
                        >
                          <span className="text-sm font-semibold">{track.title}</span>
                          <span className="text-xs text-muted">{track.pitch}</span>
                          <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary-2">
                            למעבר לעמוד
                            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                ))}
                {typing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))]">
                      <Bot className="h-3 w-3 text-white" />
                    </span>
                    <div className="flex gap-1 rounded-2xl bg-surface-strong px-3.5 py-2.5">
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

            {stage === "pain" && (
              <div className="flex flex-wrap gap-2 border-t border-border-soft px-4 py-2.5">
                {painChips.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => send(chip.label, chip.sample)}
                    className="rounded-full border border-border-soft bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-primary-2/50 hover:text-foreground"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            {stage === "lead-offer" && (
              <div className="flex flex-wrap gap-2 border-t border-border-soft px-4 py-2.5">
                <button
                  onClick={() => send("כן, שמרו את הפרטים שלי", "yes")}
                  className="rounded-full border border-primary-2/50 bg-surface px-3 py-1.5 text-xs font-medium text-primary-2 transition-colors hover:bg-surface-strong"
                >
                  כן, שמרו את הפרטים שלי
                </button>
                <button
                  onClick={() => send("לא תודה, רק רציתי לבדוק", "no")}
                  className="rounded-full border border-border-soft bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:text-foreground"
                >
                  לא תודה, רק רציתי לבדוק
                </button>
              </div>
            )}

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
                placeholder={
                  stage === "business"
                    ? "למשל: יש לי מספרה..."
                    : stage === "lead-name"
                      ? "השם שלך..."
                      : stage === "lead-phone"
                        ? "מספר טלפון..."
                        : "כתוב כאן..."
                }
                className="flex-1 rounded-full bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-primary-2/40"
              />
              <button
                type="submit"
                aria-label="שליחה"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))] text-white transition-transform hover:scale-105"
              >
                <Send className="h-4 w-4 -scale-x-100" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={toggleChat}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label={isOpen ? "סגירת הצ'אט" : "פתיחת הצ'אט העסקי"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))] text-white shadow-[0_0_30px_-5px_rgba(109,91,255,0.7)]"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isOpen ? "close" : "open"}
            initial={{ opacity: 0, rotate: -45 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 45 }}
            transition={{ duration: 0.15 }}
          >
            {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
