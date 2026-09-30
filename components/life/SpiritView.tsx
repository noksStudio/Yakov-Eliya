"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Check, Flame, Loader2, Lock, MessageCircle, Sparkles, Trash2 } from "lucide-react";
import type { SpiritSummary } from "@/lib/life/spirit";
import type { JournalEntry } from "@/lib/life/journal";
import { israelToday } from "@/lib/life/time";
import { lifeApi } from "./api";

const ROWS = [
  { key: "shacharit", label: "שחרית" },
  { key: "mincha", label: "מנחה" },
  { key: "arvit", label: "ערבית" },
  { key: "hitbodedut", label: "התבודדות" },
] as const;

export function SpiritView() {
  const [data, setData] = useState<SpiritSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    lifeApi<{ spirit: SpiritSummary }>("/spirit")
      .then((d) => setData(d.spirit))
      .catch((e) => setError((e as Error).message));

  useEffect(() => {
    void load();
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

  const today = data.week.at(-1)!;
  const toggle = async (key: (typeof ROWS)[number]["key"]) => {
    const value = !today[key];
    setData({ ...data, week: data.week.map((d, i) => (i === data.week.length - 1 ? { ...d, [key]: value } : d)) });
    try {
      await lifeApi("/checkin", { method: "PUT", body: { date: today.date, patch: { [key]: value } } });
      void load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const l = data.learning;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">רוח</h1>
          <p className="text-sm text-muted">תפילות, התבודדות ולימוד</p>
        </div>
        <Link
          href="/life/agent/spirit"
          className="flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-sm font-semibold text-gold-2"
        >
          <MessageCircle className="h-4 w-4" /> המלווה הרוחני
        </Link>
      </header>

      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {today.rest ? (
        <p className="rounded-2xl border border-gold/25 bg-gold/5 p-4 text-sm text-gold-2">היום שבת או חג: אין מעקב. שבת שלום.</p>
      ) : (
        <section className="rounded-2xl border border-border-soft bg-surface p-4">
          <h2 className="mb-3 text-[15px] font-bold">היום</h2>
          <div className="grid grid-cols-2 gap-2">
            {ROWS.map(({ key, label }) => {
              const done = today[key];
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={done}
                  onClick={() => toggle(key)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                    done ? "border-gold/50 bg-gold/15 text-gold-2" : "border-border-soft bg-white/[0.03] text-muted"
                  }`}
                >
                  {label}
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full ${done ? "bg-gold text-[#1d1407]" : "border border-white/20"}`}>
                    {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Stat label="תפילות ב־7 ימים" value={`${data.prayersThisWeek}/${data.prayersPossible}`} streak={data.prayerStreak} streakLabel="ימים ברצף עם 3 תפילות" />
        <Stat label="התבודדות ב־7 ימים" value={`${data.hitbodedutThisWeek}`} streak={data.hitbodedutStreak} streakLabel="ימים ברצף" />
      </div>

      <section className="rounded-2xl border border-border-soft bg-surface p-4">
        <h2 className="mb-3 text-[15px] font-bold">השבוע</h2>
        <table className="w-full table-fixed text-center text-xs">
          <thead>
            <tr>
              <th className="w-20" />
              {data.week.map((d) => (
                <th key={d.date} className={`pb-2 font-semibold ${d.date === today.date ? "text-gold-2" : "text-muted"}`}>
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(({ key, label }) => (
              <tr key={key}>
                <th scope="row" className="py-1.5 text-start font-normal text-muted">
                  {label}
                </th>
                {data.week.map((d) => (
                  <td key={d.date} className="py-1.5">
                    {d.rest ? (
                      <span className="text-muted/50" aria-label="שבת או חג">
                        ·
                      </span>
                    ) : (
                      <span
                        className={`mx-auto block h-3.5 w-3.5 rounded-full ${d[key] ? "bg-gold" : "border border-white/20"}`}
                        aria-label={d[key] ? "בוצע" : "לא סומן"}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl border border-border-soft bg-surface p-4">
        <h2 className="mb-2 flex items-center gap-2 text-[15px] font-bold">
          <BookOpen className="h-4 w-4 text-gold-2" /> {l.title}
        </h2>
        <div className="h-2 overflow-hidden rounded-full bg-white/10" aria-hidden>
          <div className="h-full rounded-full bg-gold" style={{ width: `${Math.round((l.done / l.total) * 100)}%` }} />
        </div>
        <p className="mt-2 text-sm">
          {l.finished ? "המסכת הושלמה. הדרן עלך!" : <>הבא: <span className="font-bold">{l.next}</span> · {l.done}/{l.total} עמודים</>}
        </p>
        <p className="text-xs text-muted">צריך {l.neededPerWeek} עמודים בשבוע · נותרו {l.daysLeft} ימים עד יום ההולדת</p>
      </section>

      <HitbodedutJournal onError={setError} />
    </div>
  );
}

function Stat({ label, value, streak, streakLabel }: { label: string; value: string; streak: number; streakLabel: string }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-surface p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gold-2">
        <Flame className="h-3 w-3" /> {streak} {streakLabel}
      </p>
    </div>
  );
}

function HitbodedutJournal({ onError }: { onError: (m: string) => void }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    lifeApi<{ entries: JournalEntry[] }>("/journal?kind=hitbodedut")
      .then((d) => setEntries(d.entries))
      .catch((e) => onError((e as Error).message));

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await lifeApi("/journal", { method: "POST", body: { date: israelToday(), kind: "hitbodedut", text, private: true } });
      setText("");
      await load();
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border-soft bg-surface p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold">יומן התבודדות</h2>
        <Link href="/life/agent/spirit?preset=hitbodedut" className="flex items-center gap-1 text-xs text-gold-2">
          <Sparkles className="h-3.5 w-3.5" /> עזרה לפתוח
        </Link>
      </div>
      <p className="mb-3 flex items-center gap-1.5 text-xs text-muted">
        <Lock className="h-3.5 w-3.5" /> פרטי לגמרי. לא נשלח לאף סוכן.
      </p>
      <form onSubmit={save} className="grid gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="מה עלה בהתבודדות? מה אני מבקש, על מה אני מודה?"
          aria-label="רשומה ביומן ההתבודדות"
          className="resize-none rounded-xl bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted/70"
        />
        <button type="submit" disabled={busy} className="rounded-xl bg-gold py-2.5 text-sm font-bold text-[#1d1407] disabled:opacity-60">
          שמירה
        </button>
      </form>
      {entries.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-muted">רשומות קודמות ({entries.length})</summary>
          <ul className="mt-2 grid gap-2">
            {entries.map((entry) => (
              <li key={entry.id} className="rounded-xl bg-white/[0.03] p-3 text-sm">
                <div className="mb-1 flex items-center justify-between text-xs text-muted">
                  <span>{entry.date.split("-").reverse().join(".")}</span>
                  <button
                    type="button"
                    aria-label="מחק רשומה"
                    onClick={() =>
                      lifeApi(`/journal/${entry.id}`, { method: "DELETE" })
                        .then(load)
                        .catch((e) => onError((e as Error).message))
                    }
                    className="p-1 hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="whitespace-pre-wrap">{entry.text}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
