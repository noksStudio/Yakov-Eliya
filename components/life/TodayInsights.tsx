"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { Insight } from "@/lib/life/rule-types";
import { lifeApi } from "./api";
import { LIFE_CHANGED } from "./QuickCapture";

const MAX = 3;
const STYLE: Record<Insight["level"], { mark: string; box: string }> = {
  alert: { mark: "🟠", box: "border-amber-400/30 bg-amber-400/[0.07]" },
  tip: { mark: "💡", box: "border-border-soft bg-surface" },
  good: { mark: "✅", box: "border-emerald-400/25 bg-emerald-400/[0.06]" },
};

/** What the rules noticed today, with the next step. "X" hides one until tomorrow (per device). */
export function TodayInsights({ date }: { date: string }) {
  const [items, setItems] = useState<Insight[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const key = `life-insights-hidden-${date}`;

  const load = useCallback(() => {
    lifeApi<{ insights: Insight[] }>("/rules?place=today")
      .then((d) => {
        let saved: string[] = [];
        try {
          saved = JSON.parse(localStorage.getItem(key) ?? "[]") as string[];
        } catch {
          // Storage blocked: nothing hidden.
        }
        setHidden(saved);
        setItems(d.insights);
      })
      .catch(() => setItems([]));
  }, [key]);

  useEffect(() => {
    load();
    window.addEventListener(LIFE_CHANGED, load);
    return () => window.removeEventListener(LIFE_CHANGED, load);
  }, [key, load]);

  const hide = (rule: string) => {
    const next = [...hidden, rule];
    setHidden(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Storage blocked: hidden for this visit only.
    }
  };

  const shown = items.filter((i) => !hidden.includes(i.rule)).slice(0, MAX);
  if (!shown.length) return null;
  return (
    <section className="grid gap-2" aria-label="המלצות להיום">
      {shown.map((i) => (
        <div key={i.rule} className={`flex items-start gap-2 rounded-2xl border p-3 text-sm ${STYLE[i.level].box}`}>
          <span aria-hidden>{STYLE[i.level].mark}</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{i.text}</p>
            {i.detail && <p className="mt-0.5 text-xs leading-relaxed text-muted">{i.detail}</p>}
            {i.href && (
              <Link href={i.href} className="mt-1 inline-block text-xs font-semibold text-gold-2">
                לפתוח ←
              </Link>
            )}
          </div>
          <button type="button" onClick={() => hide(i.rule)} aria-label={`הסתרה עד מחר: ${i.text}`} className="rounded-lg p-1 text-muted/60 hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </section>
  );
}
