"use client";

import { useState } from "react";
import { Bot, ChevronDown, User } from "lucide-react";
import type { Conversation } from "@/lib/types";
import { tracks } from "@/lib/tracks";
import { cn } from "@/lib/utils";

export function ConversationsList({ conversations }: { conversations: Conversation[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold">שיחות מהצ&apos;אט</h1>
      <p className="mt-1 text-sm text-muted">
        {conversations.length} שיחות שנפתחו באתר — לצפייה כדי לדייק את התשובות של הבוט.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {conversations.map((conv) => {
          const matchedTracks = conv.track_slugs
            .map((slug) => tracks.find((t) => t.slug === slug)?.title)
            .filter(Boolean);
          const isOpen = openId === conv.id;

          return (
            <div key={conv.id} className="glass overflow-hidden rounded-2xl">
              <button
                onClick={() => setOpenId(isOpen ? null : conv.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {conv.business_type || "עסק לא צוין"}
                    {conv.pain ? ` — ${conv.pain}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(conv.updated_at).toLocaleString("he-IL")} ·{" "}
                    {conv.messages.length} הודעות
                    {matchedTracks.length > 0 && ` · ${matchedTracks.join(", ")}`}
                  </p>
                </div>
                <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")} />
              </button>

              {isOpen && (
                <div className="flex flex-col gap-3 border-t border-border-soft px-5 py-4">
                  {conv.messages.length === 0 && (
                    <p className="text-sm text-muted">אין הודעות בשיחה הזו.</p>
                  )}
                  {conv.messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "flex items-start gap-2",
                        m.role === "user" && "flex-row-reverse self-start"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                          m.role === "assistant"
                            ? "bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))]"
                            : "bg-surface-strong"
                        )}
                      >
                        {m.role === "assistant" ? (
                          <Bot className="h-3 w-3 text-white" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                      </span>
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                          m.role === "assistant"
                            ? "bg-surface-strong"
                            : "bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))] text-white"
                        )}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {conversations.length === 0 && (
          <div className="glass rounded-2xl px-8 py-16 text-center text-muted">
            עדיין אין שיחות שנשמרו.
          </div>
        )}
      </div>
    </div>
  );
}
