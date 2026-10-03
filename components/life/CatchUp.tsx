"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Loader2, MessageCircle, Phone, X } from "lucide-react";
import type { PendingItem } from "@/lib/life/pending";
import { DEAL_STAGE_LABELS, OPEN_STAGES, type DealStage } from "@/lib/life/ops-types";
import { telUrl, whatsappUrl } from "@/lib/life/lead-types";
import { addDays, israelToday, weekdayName } from "@/lib/life/time";
import { lifeApi } from "./api";
import { LIFE_CHANGED } from "./QuickCapture";

// The catch-up popup: when the app opens and something fell behind (yesterday's check-in, an
// overdue task, lead or deal, a missing weigh-in), one card at a time with the quick fixes.
// "אחר כך" hides it for 3 hours; "דלג" hides just that item for 3 hours. Per device.

const SNOOZE_KEY = "life-catchup-snooze";
const SNOOZE_MS = 3 * 60 * 60 * 1000;
/** Back to the app after this long: look again. */
const RECHECK_MS = 20 * 60 * 1000;
// Setup has its own flow; chat screens have their input where the sheet would open.
const HIDDEN_ON = ["/life/settings/setup", "/life/chat", "/life/coach", "/life/agent"];

type Snooze = { all?: number; items?: Record<string, number> };

function readSnooze(): Snooze {
  try {
    return JSON.parse(localStorage.getItem(SNOOZE_KEY) ?? "{}") as Snooze;
  } catch {
    return {};
  }
}

function writeSnooze(update: (s: Snooze) => Snooze) {
  try {
    const now = Date.now();
    const next = update(readSnooze());
    // Drop expired entries so the key doesn't grow forever.
    next.items = Object.fromEntries(Object.entries(next.items ?? {}).filter(([, until]) => until > now));
    localStorage.setItem(SNOOZE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or blocked storage: the popup just comes back next time.
  }
}

const shortDate = (date: string) => `${Number(date.slice(8, 10))}.${Number(date.slice(5, 7))}`;

function whenLabel(date: string) {
  const today = israelToday();
  if (date === addDays(today, -1)) return "אתמול";
  return `${weekdayName(date)} ${shortDate(date)}`;
}

export function CatchUp() {
  const pathname = usePathname();
  const [items, setItems] = useState<PendingItem[]>([]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastCheck = useRef(0);
  const hidden = HIDDEN_ON.some((p) => pathname.startsWith(p));

  const check = useCallback(async () => {
    lastCheck.current = Date.now();
    const snooze = readSnooze();
    if ((snooze.all ?? 0) > Date.now()) return;
    try {
      const d = await lifeApi<{ items: PendingItem[] }>("/pending");
      const fresh = d.items.filter((i) => (snooze.items?.[i.id] ?? 0) <= Date.now());
      if (!fresh.length) return;
      setItems(fresh);
      setIndex(0);
      setDone(false);
      setError(null);
      setOpen(true);
    } catch {
      // Offline, or the database isn't set up yet: nothing to catch up on now.
    }
  }, []);

  useEffect(() => {
    if (hidden) return;
    // Let the screen itself load first.
    const timer = window.setTimeout(() => {
      if (Date.now() - lastCheck.current > RECHECK_MS) void check();
    }, 1200);
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastCheck.current > RECHECK_MS) void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [hidden, check]);

  /** Hides the popup for 3 hours. */
  const later = useCallback(() => {
    writeSnooze((s) => ({ ...s, all: Date.now() + SNOOZE_MS }));
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && later();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, later]);

  if (!open || hidden) return null;

  const item = items[index];
  const advance = () => {
    setError(null);
    if (index + 1 < items.length) setIndex(index + 1);
    else {
      setDone(true);
      window.setTimeout(() => setOpen(false), 1400);
    }
  };
  const skip = () => {
    if (item) writeSnooze((s) => ({ ...s, items: { ...s.items, [item.id]: Date.now() + SNOOZE_MS } }));
    advance();
  };
  /** Runs an update, then moves to the next card. */
  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      window.dispatchEvent(new Event(LIFE_CHANGED));
      advance();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={later}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="catchup-title"
        onClick={(e) => e.stopPropagation()}
        className="mx-auto w-full max-w-md rounded-t-3xl border-t border-border-soft bg-[#0b0d1f] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="catchup-title" className="text-[15px] font-bold">
            {done ? "הכל מעודכן" : "עדכון מהיר"}
            {!done && items.length > 1 && (
              <span dir="ltr" className="font-latin ms-2 inline-block text-xs font-normal text-muted">
                {index + 1}/{items.length}
              </span>
            )}
          </h2>
          <button type="button" onClick={later} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted hover:text-foreground">
            אחר כך <X className="h-4 w-4" />
          </button>
        </div>

        {!done && items.length > 1 && (
          <div className="mb-3 flex gap-1" aria-hidden>
            {items.map((i, n) => (
              <span key={i.id} className={`h-1 flex-1 rounded-full ${n < index ? "bg-gold" : n === index ? "bg-gold/60" : "bg-white/10"}`} />
            ))}
          </div>
        )}

        {done ? (
          <p className="flex items-center justify-center gap-2 py-8 text-emerald-300" role="status">
            <Check className="h-5 w-5" /> הכל מעודכן. יום טוב!
          </p>
        ) : (
          item && (
            <div key={item.id} className="grid gap-3">
              <Card item={item} busy={busy} act={act} onLink={() => setOpen(false)} />
              {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
              <button type="button" onClick={skip} disabled={busy} className="py-1 text-xs text-muted underline disabled:opacity-50">
                דלג על זה כרגע
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}

type CardProps = { item: PendingItem; busy: boolean; act: (fn: () => Promise<unknown>) => Promise<void>; onLink: () => void };

const chip = "rounded-full px-3.5 py-2 text-sm font-semibold disabled:opacity-50";
const primary = `${chip} bg-gold text-[#1d1407]`;
const secondary = `${chip} bg-white/10`;
const quiet = `${chip} bg-white/5 font-normal text-muted`;

function Card({ item, busy, act, onLink }: CardProps) {
  const today = israelToday();
  switch (item.kind) {
    case "checkin":
      return <CheckinCard item={item} busy={busy} act={act} />;
    case "task": {
      const { task } = item;
      const patch = (body: Record<string, unknown>) => act(() => lifeApi(`/tasks/${task.id}`, { method: "PATCH", body }));
      return (
        <Section kicker={`משימה מ${whenLabel(task.due_date)}`} title={task.title}>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => patch({ done: true })} className={primary}>
              ✓ בוצע
            </button>
            <button type="button" disabled={busy} onClick={() => patch({ due_date: today })} className={secondary}>
              להיום
            </button>
            <button type="button" disabled={busy} onClick={() => patch({ due_date: addDays(today, 1) })} className={secondary}>
              למחר
            </button>
            <button type="button" disabled={busy} onClick={() => act(() => lifeApi(`/tasks/${task.id}`, { method: "DELETE" }))} className={quiet}>
              כבר לא רלוונטי
            </button>
          </div>
        </Section>
      );
    }
    case "lead": {
      const { lead } = item;
      const patch = (body: Record<string, unknown>) => act(() => lifeApi(`/leads/${lead.id}`, { method: "PATCH", body }));
      const tel = telUrl(lead.phone);
      const wa = whatsappUrl(lead.phone);
      return (
        <Section kicker={`ליד: היה צריך לחזור ${whenLabel(lead.due)}`} title={`${lead.name}${lead.business_type ? ` · ${lead.business_type}` : ""}`}>
          {(tel || wa) && (
            <div className="flex gap-2">
              {tel && (
                <a href={tel} className={`${secondary} flex items-center gap-1.5`}>
                  <Phone className="h-4 w-4" /> חיוג
                </a>
              )}
              {wa && (
                <a href={wa} target="_blank" rel="noreferrer" className={`${chip} flex items-center gap-1.5 bg-[#25D366]/20 text-[#7ee2a4]`}>
                  <MessageCircle className="h-4 w-4" /> וואטסאפ
                </a>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {/* Talked to them: back in two days if nothing moves. */}
            <button type="button" disabled={busy} onClick={() => patch({ status: "contacted", follow_up_date: addDays(today, 2) })} className={primary}>
              ✓ דיברנו
            </button>
            <button type="button" disabled={busy} onClick={() => patch({ follow_up_date: today })} className={secondary}>
              היום
            </button>
            <button type="button" disabled={busy} onClick={() => patch({ follow_up_date: addDays(today, 1) })} className={secondary}>
              למחר
            </button>
            <button type="button" disabled={busy} onClick={() => patch({ status: "lost" })} className={quiet}>
              לא רלוונטי
            </button>
          </div>
        </Section>
      );
    }
    case "deal":
      return <DealCard item={item} busy={busy} act={act} />;
    case "weight":
      return <WeightCard item={item} busy={busy} act={act} />;
    case "review":
      return (
        <Section kicker="סוף שבוע" title="הסקירה השבועית מחכה לך">
          <p className="text-sm text-muted">5 דקות: מה עשית מול מה שתכננת, איפה נפלת ולמה, ומה הדבר האחד לשבוע הבא.</p>
          <Link href="/life/growth?tab=review" onClick={onLink} className={`${primary} w-fit`}>
            לסקירה
          </Link>
        </Section>
      );
  }
}

function Section({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3">
      <div>
        <p className="text-xs text-gold-2">{kicker}</p>
        <p className="mt-0.5 text-lg font-bold leading-snug">{title}</p>
      </div>
      {children}
    </div>
  );
}

const PRAYERS = [
  { key: "shacharit", label: "שחרית" },
  { key: "mincha", label: "מנחה" },
  { key: "arvit", label: "ערבית" },
  { key: "workout", label: "אימון" },
  { key: "hitbodedut", label: "התבודדות" },
] as const;

function CheckinCard({ item, busy, act }: Omit<CardProps, "onLink" | "item"> & { item: Extract<PendingItem, { kind: "checkin" }> }) {
  const [values, setValues] = useState(item.checkin);
  const save = () => act(() => lifeApi("/checkin", { method: "PUT", body: { date: item.date, patch: values } }));
  return (
    <Section kicker={`סיכום יום · ${item.label}`} title="מה היה?">
      <div className="flex flex-wrap gap-2">
        {PRAYERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            aria-pressed={values[key]}
            onClick={() => setValues({ ...values, [key]: !values[key] })}
            className={`${chip} ${values[key] ? "bg-emerald-500/20 text-emerald-200" : "bg-white/5 font-normal text-muted"}`}
          >
            {values[key] ? "✓ " : ""}
            {label}
          </button>
        ))}
      </div>
      <div>
        <p className="mb-1.5 text-xs text-muted">איך היה היום? (1 קשה · 5 מצוין)</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={values.day_rating === n}
              aria-label={`דירוג ${n}`}
              onClick={() => setValues({ ...values, day_rating: n })}
              className={`font-latin h-10 flex-1 rounded-xl text-sm font-bold ${values.day_rating === n ? "bg-gold text-[#1d1407]" : "bg-white/5 text-muted"}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <button type="button" disabled={busy || values.day_rating === null} onClick={save} className={`${primary} flex items-center justify-center gap-2`}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {values.day_rating === null ? "דרג את היום כדי לשמור" : "שמירה"}
      </button>
    </Section>
  );
}

function DealCard({ item, busy, act }: Omit<CardProps, "onLink" | "item"> & { item: Extract<PendingItem, { kind: "deal" }> }) {
  const { deal } = item;
  const today = israelToday();
  const [stage, setStage] = useState<DealStage>(deal.stage);
  const patch = (body: Record<string, unknown>) => act(() => lifeApi(`/deals/${deal.id}`, { method: "PATCH", body }));
  return (
    <Section kicker={`עסקה: הצעד הבא היה ל${whenLabel(deal.next_date)}`} title={deal.name}>
      {deal.next_action && <p className="text-sm text-muted">הצעד הבא: {deal.next_action}</p>}
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>איפה זה עומד?</span>
        <select value={stage} onChange={(e) => setStage(e.target.value as DealStage)} className="rounded-lg bg-white/5 px-2 py-2 text-sm outline-none" aria-label="שלב העסקה">
          {OPEN_STAGES.map((s) => (
            <option key={s} value={s} className="bg-[#0b0d1f]">
              {DEAL_STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <div>
        <p className="mb-1.5 text-xs text-muted">מתי הצעד הבא?</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "מחר", days: 1 },
            { label: "עוד 3 ימים", days: 3 },
            { label: "עוד שבוע", days: 7 },
          ].map(({ label, days }) => (
            <button key={days} type="button" disabled={busy} onClick={() => patch({ stage, next_date: addDays(today, days) })} className={secondary}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border-soft pt-3">
        <button type="button" disabled={busy} onClick={() => patch({ stage: "won", next_date: null })} className={primary}>
          🎉 נסגרה
        </button>
        <button type="button" disabled={busy} onClick={() => patch({ stage: "lost", next_date: null })} className={quiet}>
          ירדה מהפרק
        </button>
      </div>
    </Section>
  );
}

function WeightCard({ item, busy, act }: Omit<CardProps, "onLink" | "item"> & { item: Extract<PendingItem, { kind: "weight" }> }) {
  const [value, setValue] = useState(item.last ? String(item.last.value) : "");
  const n = Number(value);
  const valid = value !== "" && n >= 20 && n <= 400;
  return (
    <Section kicker="משקל" title={item.last ? `לא נשקלת מאז ${whenLabel(item.last.date)}` : "לא נשקלת השבוע"}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) void act(() => lifeApi("/checkin", { method: "PUT", body: { date: item.date, patch: { weight: n } } }));
        }}
        className="flex items-center gap-2"
      >
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          min={20}
          max={400}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="משקל בק״ג"
          className="font-latin w-28 rounded-xl bg-white/5 px-3 py-2.5 text-center text-base outline-none focus:ring-1 focus:ring-gold/40"
        />
        <span className="text-sm text-muted">ק״ג</span>
        <button type="submit" disabled={busy || !valid} className={`${primary} ms-auto`}>
          שמירה
        </button>
      </form>
    </Section>
  );
}
