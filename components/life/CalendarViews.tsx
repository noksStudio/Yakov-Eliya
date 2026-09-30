"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Briefcase,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Gift,
  ListChecks,
  Loader2,
  Plus,
  Repeat,
  Trash2,
  X,
} from "lucide-react";
import type { CalDay, CalItem, CalItemKind, CalSummary, CalendarRange } from "@/lib/life/calendar";
import type { Recurring } from "@/lib/life/recurring";
import { AREA_LABELS, AREAS, type Area } from "@/lib/life/types";
import { addDays, gregorianLabel, hebrewDayMonth, israelToday } from "@/lib/life/time";
import { lifeApi } from "./api";
import { AREA_STYLE } from "./areas";

// Week and month views of the schedule. Both show only what changes between days; the fixed
// anchors (prayers, sleep, hitbodedut) stay in the day view.

const WEEKDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const WEEKDAY_SHORT = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

const KIND_ICON: Record<CalItemKind, typeof CalendarDays> = {
  event: CalendarDays,
  recurring: Repeat,
  workout: Dumbbell,
  learning: BookOpen,
  task: ListChecks,
  followup: Briefcase,
  occasion: Gift,
};

// Local copy of the week maths (lib/life/calendar pulls in server-only stores).
function weekStartOf(date: string) {
  return addDays(date, -new Date(`${date}T12:00:00Z`).getUTCDay());
}

function lastDayOfMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return `${month}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, "0")}`;
}

const shortDate = (date: string) => `${Number(date.slice(8, 10))}.${Number(date.slice(5, 7))}`;

function useCalendar(from: string, to: string) {
  const [data, setData] = useState<CalendarRange | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await lifeApi<{ calendar: CalendarRange }>(`/calendar?from=${from}&to=${to}`);
      setData(d.calendar);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return { data: data && data.from === from ? data : null, stale: data, error, setError, loading, reload: load };
}

/** Horizontal swipe: in RTL the next page comes in from the left, so a swipe to the right moves forward. */
function useSwipe(onNext: () => void, onPrev: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onTouchStart: (e: React.TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, select, textarea, form")) return;
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const dx = e.changedTouches[0].clientX - s.x;
      const dy = e.changedTouches[0].clientY - s.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx > 0 ? onNext : onPrev)();
    },
  };
}

function RangeHeader({
  title,
  subtitle,
  unit,
  loading,
  onPrev,
  onNext,
  onToday,
}: {
  title: string;
  subtitle: string;
  unit: string;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday?: () => void;
}) {
  const nav = "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-muted hover:text-foreground";
  return (
    <header className="flex items-center gap-2">
      <button type="button" onClick={onPrev} aria-label={`${unit} קודם`} className={nav}>
        <ChevronRight className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1 text-center">
        <h1 className="flex items-center justify-center gap-1.5 text-lg font-black">
          {title}
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted" aria-label="טוען" />}
        </h1>
        <p className="flex items-center justify-center gap-2 text-xs text-muted">
          {subtitle}
          {onToday && (
            <button type="button" onClick={onToday} className="rounded-full border border-gold/40 px-2 py-0.5 text-[11px] text-gold-2">
              היום
            </button>
          )}
        </p>
      </div>
      <button type="button" onClick={onNext} aria-label={`${unit} הבא`} className={nav}>
        <ChevronLeft className="h-5 w-5" />
      </button>
    </header>
  );
}

function SummaryStrip({ summary }: { summary: CalSummary }) {
  const tiles = [
    { label: "אימונים", value: `${summary.workoutsDone}/${summary.workoutsPlanned}` },
    { label: "תפילות", value: `${summary.prayersDone}/${summary.prayersPossible}` },
    { label: "רווח", value: `${Math.round(summary.profit).toLocaleString("he-IL")} ₪` },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-xl border border-border-soft bg-surface px-2 py-2 text-center">
          <p className="text-[11px] text-muted">{t.label}</p>
          {/* Fractions stay left-to-right; the shekel amount keeps the usual RTL order. */}
          <p className="text-[15px] font-bold">{t.value.includes("/") ? <bdi dir="ltr">{t.value}</bdi> : t.value}</p>
        </div>
      ))}
    </div>
  );
}

function ItemList({ items, onChange, onError }: { items: CalItem[]; onChange: () => void; onError: (m: string) => void }) {
  const act = (fn: () => Promise<unknown>) =>
    fn()
      .then(onChange)
      .catch((e) => onError((e as Error).message));
  return (
    <ul className="mt-2 grid grid-cols-1 gap-1.5">
      {items.map((item) => {
        const Icon = KIND_ICON[item.kind];
        return (
          <li key={item.key} className="flex items-center gap-2.5 text-sm">
            <span className="w-11 shrink-0 text-xs text-muted">{item.time && <bdi dir="ltr" className="font-latin">{item.time}</bdi>}</span>
            <Icon className={`h-4 w-4 shrink-0 ${AREA_STYLE[item.area].text}`} aria-hidden />
            <span className={`min-w-0 flex-1 ${item.done ? "text-muted line-through" : ""}`}>
              <span className="block truncate">{item.title}</span>
              {item.note && <span className="block truncate text-xs text-muted">{item.note}</span>}
              {item.prep && (
                <span className={`block text-xs ${item.prep.done === item.prep.total ? "text-emerald-300" : "text-muted"}`}>
                  {item.prep.done === item.prep.total ? "כל ההכנות בוצעו ✓" : <>הכנות <bdi dir="ltr">{item.prep.done}/{item.prep.total}</bdi></>}
                </span>
              )}
            </span>
            {item.kind === "workout" && item.done && <Check className="h-4 w-4 text-emerald-300" aria-label="בוצע" />}
            {item.kind === "event" && item.id && (
              <button
                type="button"
                aria-label={`מחק ${item.title}`}
                onClick={() => act(() => lifeApi(`/events/${item.id}`, { method: "DELETE" }))}
                className="rounded-lg p-1 text-muted/60 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {item.kind === "task" && item.id && (
              <button
                type="button"
                aria-label={item.done ? `בטל סימון ${item.title}` : `סמן ${item.title} כבוצע`}
                aria-pressed={item.done}
                onClick={() => act(() => lifeApi(`/tasks/${item.id}`, { method: "PATCH", body: { done: !item.done } }))}
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${item.done ? "border-gold bg-gold text-[#1d1407]" : "border-white/25"}`}
              >
                {item.done && <Check className="h-3 w-3" strokeWidth={3} />}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const field = "rounded-lg bg-white/5 px-3 py-2 text-sm text-foreground outline-none";

function AreaSelect({ value, onChange }: { value: Area; onChange: (a: Area) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as Area)} aria-label="תחום" className={field}>
      {AREAS.map((a) => (
        <option key={a} value={a}>
          {AREA_LABELS[a]}
        </option>
      ))}
    </select>
  );
}

function AddEventForm({ date, onDone, onCancel }: { date: string; onDone: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [area, setArea] = useState<Area>("general");
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  const send = async (force: boolean) => {
    setError(null);
    const res = await fetch("/api/life/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, title, start_time: start, end_time: end || null, area, force }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return onDone();
    // Overlapping an anchor is allowed once confirmed; anything else is a plain error.
    if (res.status === 409 && data.conflict) setConflict(data.conflict);
    else setError(data.error ?? "משהו השתבש");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setConflict(null);
    void send(false);
  };
  return (
    <form onSubmit={submit} className="mt-3 grid gap-2 rounded-xl bg-white/[0.03] p-3">
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="מה?" aria-label="כותרת" className={field} />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted">
          התחלה
          <input required type="time" value={start} onChange={(e) => setStart(e.target.value)} className={`font-latin mt-1 w-full ${field}`} />
        </label>
        <label className="text-xs text-muted">
          סיום (לא חובה)
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={`font-latin mt-1 w-full ${field}`} />
        </label>
      </div>
      <AreaSelect value={area} onChange={setArea} />
      {error && <p className="text-xs text-red-300">{error}</p>}
      {conflict && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-2.5 text-xs text-amber-200">
          <p>חופף ל{conflict}. להוסיף בכל זאת? {conflict} לא יזוז, רק תדע שבאותו יום יש התנגשות.</p>
          <button type="button" onClick={() => void send(true)} className="mt-2 rounded-lg bg-amber-400/20 px-3 py-1.5 font-semibold text-amber-100">
            להוסיף בכל זאת
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <button type="submit" className="flex-1 rounded-lg bg-gold py-2 text-sm font-bold text-[#1d1407]">
          הוספה
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-white/5 px-4 py-2 text-sm">
          ביטול
        </button>
      </div>
    </form>
  );
}

function DayCard({ day, today, onChange, onError }: { day: CalDay; today: string; onChange: () => void; onError: (m: string) => void }) {
  const [adding, setAdding] = useState(false);
  const isToday = day.date === today;
  const past = day.date < today;
  return (
    <section
      aria-label={`${WEEKDAYS[day.weekday]} ${shortDate(day.date)}`}
      className={`rounded-2xl border p-3 ${isToday ? "border-gold/50 bg-gold/[0.06]" : "border-border-soft bg-surface"} ${past ? "opacity-75" : ""}`}
    >
      <header className="flex items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-baseline gap-2">
          <span className="text-[15px] font-bold">{WEEKDAYS[day.weekday]}</span>
          <span className="truncate text-xs text-muted">
            <bdi dir="ltr">{shortDate(day.date)}</bdi> · {day.hebrewDay} {day.hebrewMonth}
          </span>
          {isToday && <span className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-[#1d1407]">היום</span>}
        </h2>
        {!day.rest && !past && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            aria-label={`הוסף אירוע ליום ${WEEKDAYS[day.weekday]}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gold-2 hover:bg-white/5"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </header>
      {day.rest && <p className="mt-1 text-sm text-gold-2/80">{day.rest.kind === "shabbat" ? "שבת שלום" : `${day.rest.name} · חג שמח`}</p>}
      {day.dayOff && <p className="mt-1 text-sm text-emerald-300/90">{day.dayOff} · חופש מעבודה</p>}
      {day.items.length > 0 ? (
        <ItemList items={day.items} onChange={onChange} onError={onError} />
      ) : (
        !day.rest && <p className="mt-1 text-xs text-muted">יום פנוי</p>
      )}
      {adding && (
        <AddEventForm
          date={day.date}
          onCancel={() => setAdding(false)}
          onDone={() => {
            setAdding(false);
            onChange();
          }}
        />
      )}
    </section>
  );
}

function hebrewSpan(from: string, to: string) {
  const a = hebrewDayMonth(from);
  const b = hebrewDayMonth(to);
  return a.month === b.month ? `${a.day} עד ${b.day} ${b.month}` : `${a.day} ${a.month} עד ${b.day} ${b.month}`;
}

export function WeekView() {
  const [today] = useState(() => israelToday());
  const [start, setStart] = useState(() => weekStartOf(today));
  const end = addDays(start, 6);
  const { data, stale, error, setError, loading, reload } = useCalendar(start, end);
  const next = () => setStart(addDays(start, 7));
  const prev = () => setStart(addDays(start, -7));
  const swipe = useSwipe(next, prev);
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  const shown = data ?? stale;

  return (
    <div className="flex flex-col gap-3" {...swipe}>
      <RangeHeader
        title={sameMonth ? `${Number(start.slice(8, 10))} עד ${gregorianLabel(end)}` : `${gregorianLabel(start)} עד ${gregorianLabel(end)}`}
        subtitle={hebrewSpan(start, end)}
        unit="שבוע"
        loading={loading}
        onPrev={prev}
        onNext={next}
        onToday={start !== weekStartOf(today) ? () => setStart(weekStartOf(today)) : undefined}
      />
      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {shown ? (
        <div className={`flex flex-col gap-2 transition-opacity ${data ? "" : "opacity-50"}`}>
          <SummaryStrip summary={shown.summary} />
          {shown.days.map((d) => (
            <DayCard key={d.date} day={d} today={today} onChange={reload} onError={setError} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[40svh] items-center justify-center text-muted" role="status">
          <Loader2 className="h-6 w-6 animate-spin" aria-label="טוען" />
        </div>
      )}
      <RecurringManager onChange={reload} />
    </div>
  );
}

export function MonthView() {
  const [today] = useState(() => israelToday());
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const first = `${month}-01`;
  const last = lastDayOfMonth(month);
  const gridStart = weekStartOf(first);
  const gridEnd = addDays(weekStartOf(last), 6);
  const { data, stale, error, setError, loading, reload } = useCalendar(gridStart, gridEnd);

  const go = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    const next = d.toISOString().slice(0, 7);
    setMonth(next);
    setSelected(today.startsWith(next) ? today : `${next}-01`);
  };
  const swipe = useSwipe(() => go(1), () => go(-1));
  const shown = data ?? stale;
  const monthDays = shown?.days.filter((d) => d.date.startsWith(month)) ?? [];
  const selectedDay = shown?.days.find((d) => d.date === selected);
  const areas = AREAS.filter((a) => monthDays.some((d) => d.items.some((i) => i.area === a)));
  const title = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-15T12:00:00Z`));
  const hFirst = hebrewDayMonth(first).month;
  const hLast = hebrewDayMonth(last).month;

  return (
    <div className="flex flex-col gap-3" {...swipe}>
      <RangeHeader
        title={title}
        subtitle={hFirst === hLast ? hFirst : `${hFirst} · ${hLast}`}
        unit="חודש"
        loading={loading}
        onPrev={() => go(-1)}
        onNext={() => go(1)}
        onToday={!today.startsWith(month) ? () => go(monthsBetween(month, today.slice(0, 7))) : undefined}
      />
      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className={`rounded-2xl border border-border-soft bg-surface p-2 transition-opacity ${data ? "" : "opacity-50"}`}>
        <div className="grid grid-cols-7 pb-1 text-center text-[11px] text-muted" aria-hidden>
          {WEEKDAY_SHORT.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {(shown?.days ?? []).map((d) => {
            const inMonth = d.date.startsWith(month);
            const dots = [...new Set(d.items.map((i) => i.area))].slice(0, 3);
            const isSelected = d.date === selected;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setSelected(d.date)}
                aria-pressed={isSelected}
                aria-label={`${WEEKDAYS[d.weekday]} ${gregorianLabel(d.date)}, ${d.hebrewDay} ${d.hebrewMonth}${d.rest ? `, ${d.rest.name}` : ""}${
                  d.items.length ? `, ${d.items.length} פריטים` : ""
                }`}
                className={`flex h-14 min-w-0 flex-col items-center justify-start gap-0.5 rounded-lg pt-1 ${
                  isSelected ? "bg-gold/15" : d.rest ? "bg-white/[0.025]" : ""
                } ${d.date === today ? "ring-1 ring-gold" : ""} ${inMonth ? "" : "opacity-35"}`}
              >
                <span className={`text-sm font-semibold leading-none ${d.rest ? "text-gold-2/80" : ""}`}>{d.day}</span>
                <span className="w-full truncate text-[9px] leading-none text-muted">{d.hebrewMonthStart ? `${d.hebrewDay} ${d.hebrewMonth}` : d.hebrewDay}</span>
                <span className="mt-0.5 flex gap-0.5">
                  {dots.map((a) => (
                    <span key={a} className={`h-1.5 w-1.5 rounded-full ${AREA_STYLE[a].dot}`} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        {areas.length > 0 && (
          <p className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 border-t border-border-soft pt-2 text-[11px] text-muted">
            {areas.map((a) => (
              <span key={a} className="flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${AREA_STYLE[a].dot}`} /> {AREA_LABELS[a]}
              </span>
            ))}
          </p>
        )}
      </div>

      {selectedDay && <DayCard key={selectedDay.date} day={selectedDay} today={today} onChange={reload} onError={setError} />}
      {data && <MonthSummary days={monthDays} />}
    </div>
  );
}

function monthsBetween(a: string, b: string) {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

/** Month totals from the days of this month only (the grid also holds edge days of the neighbours). */
function MonthSummary({ days }: { days: CalDay[] }) {
  const count = (kind: CalItemKind) => days.reduce((s, d) => s + d.items.filter((i) => i.kind === kind).length, 0);
  const workoutsDone = days.reduce((s, d) => s + d.items.filter((i) => i.kind === "workout" && i.done).length, 0);
  const rows = [
    { label: "אימונים", value: `${workoutsDone}/${count("workout")}` },
    { label: "מפגשי לימוד", value: `${count("learning")}` },
    { label: "אירועים", value: `${count("event") + count("recurring")}` },
    { label: "פולואפים", value: `${count("followup")}` },
  ];
  return (
    <section className="rounded-2xl border border-border-soft bg-surface p-3">
      <h2 className="mb-2 text-[15px] font-bold">החודש במספרים</h2>
      <dl className="grid grid-cols-4 gap-2 text-center">
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="text-[11px] text-muted">{r.label}</dt>
            <dd className="text-[15px] font-bold">
              <bdi dir="ltr">{r.value}</bdi>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function RecurringManager({ onChange }: { onChange: () => void }) {
  const [items, setItems] = useState<Recurring[] | null>(null);
  const [weekday, setWeekday] = useState(0);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [area, setArea] = useState<Area>("general");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      lifeApi<{ recurring: Recurring[] }>("/recurring")
        .then((d) => setItems(d.recurring))
        .catch((e) => setError((e as Error).message)),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await lifeApi("/recurring", { method: "POST", body: { weekday, title, start_time: start, end_time: end || null, area } });
      setTitle("");
      setStart("");
      setEnd("");
      await load();
      onChange();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const remove = async (id: string) => {
    try {
      await lifeApi(`/recurring/${id}`, { method: "DELETE" });
      await load();
      onChange();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <details className="rounded-2xl border border-border-soft bg-surface p-4">
      <summary className="flex cursor-pointer items-center gap-2 text-[15px] font-bold">
        <Repeat className="h-4 w-4 text-gold-2" /> קבועים בכל שבוע{items ? ` (${items.length})` : ""}
      </summary>
      <p className="mt-1 text-xs text-muted">שיעור, חוג, פגישה קבועה. מופיעים כל שבוע ביום שלהם, לא בשבת ובחג.</p>
      {items && items.length > 0 && (
        <ul className="mt-3 grid grid-cols-1 gap-1">
          {items.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-sm">
              <span className={`h-2 w-2 shrink-0 rounded-full ${AREA_STYLE[r.area].dot}`} />
              <span className="w-12 shrink-0 text-muted">{WEEKDAYS[r.weekday]}</span>
              <span className="shrink-0 text-xs text-muted">
                <bdi dir="ltr" className="font-latin">{r.start_time}</bdi>
                {r.end_time && (
                  <>
                    {" "}
                    עד <bdi dir="ltr" className="font-latin">{r.end_time}</bdi>
                  </>
                )}
              </span>
              <span className="min-w-0 flex-1 truncate">{r.title}</span>
              <button type="button" onClick={() => remove(r.id)} aria-label={`מחק ${r.title}`} className="rounded-lg p-1 text-muted/60 hover:text-foreground">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className="mt-3 grid gap-2 border-t border-border-soft pt-3">
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="מה? למשל: שיעור גמרא" aria-label="כותרת" className={field} />
        <div className="grid grid-cols-2 gap-2">
          <select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))} aria-label="יום בשבוע" className={field}>
            {WEEKDAYS.slice(0, 6).map((d, i) => (
              <option key={d} value={i}>
                יום {d}
              </option>
            ))}
          </select>
          <AreaSelect value={area} onChange={setArea} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted">
            התחלה
            <input required type="time" value={start} onChange={(e) => setStart(e.target.value)} className={`font-latin mt-1 w-full ${field}`} />
          </label>
          <label className="text-xs text-muted">
            סיום (לא חובה)
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={`font-latin mt-1 w-full ${field}`} />
          </label>
        </div>
        {error && <p className="text-xs text-red-300">{error}</p>}
        <button type="submit" className="rounded-lg bg-gold py-2 text-sm font-bold text-[#1d1407]">
          הוספת קבוע
        </button>
      </form>
    </details>
  );
}
