"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Loader2, Lock, MessageCircle, Wind } from "lucide-react";
import type { MindSummary } from "@/lib/life/mind";
import type { JournalEntry } from "@/lib/life/journal";
import { israelToday } from "@/lib/life/time";
import { lifeApi } from "./api";
import { TrendChart } from "./TrendChart";

export function MindView() {
  const [data, setData] = useState<MindSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    lifeApi<{ mind: MindSummary }>("/mind")
      .then((d) => setData(d.mind))
      .catch((e) => setError((e as Error).message));
  }, []);

  if (!data) {
    return error ? (
      <p className="mt-10 rounded-xl bg-red-500/10 p-4 text-sm text-red-300">{error}</p>
    ) : (
      <div className="flex min-h-[60svh] items-center justify-center text-muted" role="status">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">מנטלי</h1>
          <p className="text-sm text-muted">מצב רוח, אנרגיה ומיקוד</p>
        </div>
        <Link
          href="/life/agent/mind"
          className="flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-sm font-semibold text-gold-2"
        >
          <MessageCircle className="h-4 w-4" /> המאמן המנטלי
        </Link>
      </header>

      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="grid grid-cols-2 gap-2">
        <Tile label="מצב רוח (7 ימים)" value={data.week.mood} prev={data.prevWeek.mood} unit="/5" />
        <Tile label="אנרגיה (7 ימים)" value={data.week.energy} prev={data.prevWeek.energy} unit="/5" />
        <Tile label="דירוג יום (7 ימים)" value={data.week.rating} prev={data.prevWeek.rating} unit="/5" />
        <Tile label="שינה (7 ימים)" value={data.week.sleep} prev={data.prevWeek.sleep} unit=" ש׳" />
      </div>

      <section className="rounded-2xl border border-border-soft bg-surface p-4">
        <h2 className="mb-1 text-[15px] font-bold">מגמת מצב רוח</h2>
        <p className="mb-3 text-xs text-muted">מהצ׳ק־אין של הבוקר, 30 הימים האחרונים.</p>
        {data.mood.length > 1 ? (
          <TrendChart points={data.mood} label="מצב רוח" format={(v) => v.toFixed(1).replace(/\.0$/, "")} />
        ) : (
          <p className="text-sm text-muted">אחרי כמה צ׳ק־אינים תופיע כאן המגמה.</p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-2">
        <Link href="/life/agent/mind?preset=stuck" className="rounded-2xl border border-border-soft bg-surface p-3 text-sm font-semibold hover:border-gold/30">
          אני תקוע במשימה
          <span className="mt-0.5 block text-xs font-normal text-muted">צעד אחד של 10 דקות</span>
        </Link>
        <Link href="/life/agent/mind?preset=hard" className="rounded-2xl border border-border-soft bg-surface p-3 text-sm font-semibold hover:border-gold/30">
          היה יום קשה
          <span className="mt-0.5 block text-xs font-normal text-muted">לדבר על זה ולהתאפס</span>
        </Link>
      </div>

      <Breathing />
      <Reflection onError={setError} />

      <p className="text-center text-xs text-muted">
        במצוקה? ער״ן, סיוע נפשי ראשוני מסביב לשעון:{" "}
        <a href="tel:1201" className="font-semibold text-foreground underline">
          1201
        </a>
      </p>
    </div>
  );
}

function Tile({ label, value, prev, unit }: { label: string; value: number | null; prev: number | null; unit: string }) {
  const diff = value !== null && prev !== null ? Math.round((value - prev) * 10) / 10 : null;
  return (
    <div className="rounded-2xl border border-border-soft bg-surface p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value ?? "—"}</span>
        {value !== null && (
          <bdi dir="ltr" className="text-xs text-muted">
            {unit}
          </bdi>
        )}
      </p>
      {diff !== null && diff !== 0 && (
        <p className="mt-0.5 flex items-center gap-0.5 text-[11px] text-muted">
          {diff > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          <bdi dir="ltr">{Math.abs(diff)}</bdi> מהשבוע שעבר
        </p>
      )}
    </div>
  );
}

// Box breathing: 4 seconds in, hold, out, hold; four rounds (about a minute).
const PHASES = ["שאיפה", "החזקה", "נשיפה", "החזקה"];

function Breathing() {
  const [step, setStep] = useState<number | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
  }, []);

  const start = () => {
    setStep(0);
    let s = 0;
    timer.current = window.setInterval(() => {
      s += 1;
      if (s >= 16) {
        window.clearInterval(timer.current!);
        timer.current = null;
        setStep(null);
      } else setStep(s);
    }, 4000);
  };

  const phase = step === null ? null : step % 4;
  const expanded = phase === 0 || phase === 1;
  return (
    <section className="rounded-2xl border border-border-soft bg-surface p-4">
      <h2 className="mb-1 flex items-center gap-2 text-[15px] font-bold">
        <Wind className="h-4 w-4 text-gold-2" /> נשימת קופסה
      </h2>
      <p className="mb-3 text-xs text-muted">דקה אחת: 4 שניות שאיפה, החזקה, נשיפה, החזקה. מאפס לפני משימה או אחרי שיחה קשה.</p>
      {step === null ? (
        <button type="button" onClick={start} className="w-full rounded-xl bg-white/10 py-2.5 text-sm font-semibold">
          התחלה
        </button>
      ) : (
        <div className="flex flex-col items-center gap-3 py-2" role="status" aria-live="polite">
          <span
            className={`flex h-28 w-28 items-center justify-center rounded-full border border-gold/40 bg-gold/10 transition-transform duration-[4000ms] ease-in-out motion-reduce:transition-none ${
              expanded ? "scale-110" : "scale-75"
            }`}
          >
            <span className="text-sm font-bold text-gold-2">{PHASES[phase!]}</span>
          </span>
          <span className="text-xs text-muted">סבב {Math.floor(step / 4) + 1} מתוך 4</span>
        </div>
      )}
    </section>
  );
}

function Reflection({ onError }: { onError: (m: string) => void }) {
  const [good, setGood] = useState("");
  const [hard, setHard] = useState("");
  const [thanks, setThanks] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [saved, setSaved] = useState(false);

  const load = () =>
    lifeApi<{ entries: JournalEntry[] }>("/journal?kind=reflection")
      .then((d) => setEntries(d.entries))
      .catch((e) => onError((e as Error).message));

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const parts = [good && `מה הלך טוב: ${good}`, hard && `מה היה קשה: ${hard}`, thanks && `מודה על: ${thanks}`].filter(Boolean);
    if (!parts.length) return;
    try {
      await lifeApi("/journal", {
        method: "POST",
        body: { date: israelToday(), kind: "reflection", text: parts.join("\n"), private: isPrivate },
      });
      setGood("");
      setHard("");
      setThanks("");
      setSaved(true);
      await load();
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const field = "rounded-xl bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted/70";
  return (
    <section className="rounded-2xl border border-border-soft bg-surface p-4">
      <h2 className="mb-1 text-[15px] font-bold">רפלקציה יומית</h2>
      <p className="mb-3 text-xs text-muted">שלוש שורות, דקה אחת. המאמן המנטלי רואה אותן, אלא אם תסמן &quot;פרטי&quot;.</p>
      <form onSubmit={save} className="grid gap-2">
        <input value={good} onChange={(e) => setGood(e.target.value)} placeholder="מה הלך טוב היום?" aria-label="מה הלך טוב היום" className={field} />
        <input value={hard} onChange={(e) => setHard(e.target.value)} placeholder="מה היה קשה?" aria-label="מה היה קשה" className={field} />
        <input value={thanks} onChange={(e) => setThanks(e.target.value)} placeholder="על מה אני מודה?" aria-label="על מה אני מודה" className={field} />
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="h-4 w-4 accent-[#d4a24e]" />
            <Lock className="h-3.5 w-3.5" /> פרטי
          </label>
          <button type="submit" className="rounded-xl bg-gold px-5 py-2 text-sm font-bold text-[#1d1407]">
            {saved ? "נשמר ✓" : "שמירה"}
          </button>
        </div>
      </form>
      {entries.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-muted">רפלקציות קודמות ({entries.length})</summary>
          <ul className="mt-2 grid gap-2">
            {entries.map((entry) => (
              <li key={entry.id} className="rounded-xl bg-white/[0.03] p-3 text-sm">
                <p className="mb-1 flex items-center gap-1.5 text-xs text-muted">
                  {entry.date.split("-").reverse().join(".")}
                  {entry.private && <Lock className="h-3 w-3" aria-label="פרטי" />}
                </p>
                <p className="whitespace-pre-wrap">{entry.text}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
