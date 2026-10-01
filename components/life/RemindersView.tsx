"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Reminder } from "@/lib/life/reminders";
import { addDays, israelToday } from "@/lib/life/time";
import { lifeApi } from "./api";
import { LIFE_CHANGED } from "./QuickCapture";

const EXAMPLES = ["מחר ב־10:00 להתקשר לדני", "בעוד שעה לצאת לאסוף את אילן", "ביום חמישי ב־9:30 לשלוח הצעת מחיר", "12.10 בשעה 18 מתנה לאישתי"];

const weekday = (date: string) => new Intl.DateTimeFormat("he-IL", { weekday: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
const shortDate = (date: string) => `${Number(date.slice(8, 10))}.${Number(date.slice(5, 7))}`;

/** היום / מחר / השבוע / אחר כך: what a phone screen can take in at a glance. */
function groupOf(date: string, today: string) {
  if (date <= today) return "היום";
  if (date === addDays(today, 1)) return "מחר";
  if (date <= addDays(today, 7)) return "בשבוע הקרוב";
  return "בהמשך";
}

export function RemindersView() {
  const [upcoming, setUpcoming] = useState<Reminder[] | null>(null);
  const [sent, setSent] = useState<Reminder[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const today = israelToday();

  const load = useCallback(
    () =>
      lifeApi<{ upcoming: Reminder[]; sent: Reminder[] }>("/reminders")
        .then((d) => {
          setUpcoming(d.upcoming);
          setSent(d.sent);
        })
        .catch((e) => setError((e as Error).message)),
    [],
  );

  useEffect(() => {
    void load();
    // Added from the "+" button or elsewhere: show it here too.
    const onChange = () => void load();
    window.addEventListener(LIFE_CHANGED, onChange);
    return () => window.removeEventListener(LIFE_CHANGED, onChange);
  }, [load]);

  const add = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const d = await lifeApi<{ reminder: Reminder }>("/reminders", { method: "POST", body: { text } });
      const r = d.reminder;
      setNote(`אזכיר לך ${r.date === today ? "היום" : r.date === addDays(today, 1) ? "מחר" : `ב${weekday(r.date)} ${shortDate(r.date)}`} ב־${r.time}`);
      setText("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!upcoming) {
    return error ? (
      <p className="mt-10 rounded-xl bg-red-500/10 p-4 text-sm text-red-300">{error}</p>
    ) : (
      <div className="flex min-h-[60svh] items-center justify-center text-muted" role="status">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="טוען" />
      </div>
    );
  }

  const groups = ["היום", "מחר", "בשבוע הקרוב", "בהמשך"]
    .map((title) => ({ title, items: upcoming.filter((r) => groupOf(r.date, today) === title) }))
    .filter((g) => g.items.length);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <Bell className="h-6 w-6 text-gold-2" /> תזכורות
        </h1>
        <p className="mt-1 text-sm text-muted">
          {upcoming.length ? `${upcoming.length} פתוחות. ` : ""}מגיעות בטלגרם בזמן שלהן. בשבת ובחג לא.
        </p>
      </header>

      <form onSubmit={add} className="rounded-2xl border border-border-soft bg-surface p-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="מחר ב־10:00 להתקשר לדני"
            aria-label="תזכורת חדשה: מתי ועל מה"
            enterKeyHint="done"
            style={{ outline: "none" }}
            className="min-w-0 flex-1 rounded-xl bg-white/5 px-3 py-2.5 text-base placeholder:text-muted/60 focus:ring-1 focus:ring-gold/50"
          />
          <button type="submit" disabled={busy || !text.trim()} aria-label="הוספת תזכורת" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold text-[#1d1407] disabled:opacity-50">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" strokeWidth={2.5} />}
          </button>
        </div>
        {note && (
          <p className="mt-2 text-xs text-emerald-300" role="status">
            ✓ {note}
          </p>
        )}
        {error && <p className="mt-2 rounded-lg bg-red-500/10 px-2 py-1.5 text-xs text-red-300">{error}</p>}
        {!upcoming.length && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setText(ex);
                  inputRef.current?.focus();
                }}
                className="rounded-full border border-border-soft px-2.5 py-1 text-xs text-muted"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </form>

      {groups.length === 0 && <p className="text-center text-sm text-muted">אין תזכורות פתוחות.</p>}

      {groups.map((g) => (
        <section key={g.title} aria-labelledby={`group-${g.title}`}>
          <h2 id={`group-${g.title}`} className="mb-1.5 text-xs font-bold text-muted">
            {g.title}
          </h2>
          <ul className="grid grid-cols-1 gap-2">
            {g.items.map((r) => (
              <ReminderRow key={r.id} reminder={r} today={today} onChange={load} />
            ))}
          </ul>
        </section>
      ))}

      {sent.length > 0 && (
        <details className="rounded-2xl border border-border-soft bg-surface/60 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-muted">נשלחו לאחרונה ({sent.length})</summary>
          <ul className="mt-2 grid grid-cols-1 gap-1.5">
            {sent.slice(0, 20).map((r) => (
              <li key={r.id} className="flex min-w-0 items-baseline gap-2 text-sm text-muted">
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400/70" aria-hidden />
                <span className="font-latin shrink-0 text-xs">
                  {shortDate(r.date)} {r.time}
                </span>
                <span className="min-w-0 flex-1 truncate">{r.text}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function ReminderRow({ reminder, today, onChange }: { reminder: Reminder; today: string; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ date: reminder.date, time: reminder.time, text: reminder.text });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overdue = reminder.date < today;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await lifeApi(`/reminders/${reminder.id}`, { method: "PATCH", body: draft });
      setEditing(false);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`למחוק את התזכורת "${reminder.text}"?`)) return;
    try {
      await lifeApi(`/reminders/${reminder.id}`, { method: "DELETE" });
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (editing) {
    return (
      <li className="grid gap-2 rounded-xl border border-gold/40 bg-white/[0.03] p-3">
        <input
          value={draft.text}
          onChange={(e) => setDraft({ ...draft, text: e.target.value })}
          aria-label="על מה להזכיר"
          className="rounded-lg bg-white/5 px-3 py-2 text-sm outline-none"
        />
        <div className="flex gap-2">
          <input type="date" value={draft.date} min={today} onChange={(e) => setDraft({ ...draft, date: e.target.value })} aria-label="תאריך" className="font-latin min-w-0 flex-1 rounded-lg bg-white/5 px-2 py-2 text-sm outline-none" />
          <input type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} aria-label="שעה" className="font-latin w-28 rounded-lg bg-white/5 px-2 py-2 text-sm outline-none" />
        </div>
        {error && <p className="rounded-lg bg-red-500/10 px-2 py-1.5 text-xs text-red-300">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={save} disabled={busy} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gold py-2 text-sm font-bold text-[#1d1407] disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} שמירה
          </button>
          <button type="button" onClick={() => setEditing(false)} aria-label="ביטול עריכה" className="rounded-lg bg-white/5 px-3 text-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border-soft bg-white/[0.03] px-3 py-2.5">
      <span className="w-12 shrink-0 text-center">
        <span className="font-latin block text-[15px] font-bold">{reminder.time}</span>
        {reminder.date !== today && <span className="block text-[10px] text-muted">{shortDate(reminder.date)}</span>}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm">{reminder.text}</span>
        <span className="text-xs text-muted">
          {overdue ? <span className="text-amber-300">מחכה לשליחה</span> : reminder.date === today ? "היום" : weekday(reminder.date)}
        </span>
        {error && <span className="block text-xs text-red-300">{error}</span>}
      </span>
      <button type="button" onClick={() => setEditing(true)} aria-label={`עריכת ${reminder.text}`} className="rounded-lg p-2 text-muted hover:text-foreground">
        <Pencil className="h-4 w-4" />
      </button>
      <button type="button" onClick={remove} aria-label={`מחיקת ${reminder.text}`} className="rounded-lg p-2 text-muted hover:text-red-300">
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}
