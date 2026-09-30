"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Check, Dumbbell, Footprints, Loader2, MoonStar, Plus, Sunrise, Trash2, Undo2, X } from "lucide-react";
import type { Area, Checkin, DayView, Task, TimelineItem } from "@/lib/life/types";
import { AREA_LABELS, AREAS } from "@/lib/life/types";
import { israelNow, toMinutes } from "@/lib/life/time";
import { lifeApi } from "./api";
import type { Metric } from "@/lib/life/metrics";
import { MetricCard } from "./MetricsView";
import { AREA_STYLE } from "./areas";
import { Bidi } from "./Bidi";
import { LessonStory } from "./GrowthView";

type DayResponse = { day: DayView; demo: boolean };
type CheckinPatch = Partial<Omit<Checkin, "date" | "updated_at">>;

export function TodayView() {
  const [day, setDay] = useState<DayView | null>(null);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metric[] | null>(null);
  // The time of day picks the view; a tap can look at another part of the day for now.
  const [picked, setPicked] = useState<Phase | null>(null);

  const reload = useCallback(async () => {
    try {
      const data = await lifeApi<DayResponse>("/day");
      setDay(data.day);
      setDemo(data.demo);
      setError(null);
      lifeApi<{ metrics: Metric[] }>("/metrics")
        .then((m) => setMetrics(m.metrics))
        .catch(() => setMetrics(null));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    // Initial load on mount; the clock only runs on the client, so it can't mismatch the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    const tick = () => setNow(israelNow());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [reload]);

  const saveCheckin = async (patch: CheckinPatch) => {
    if (!day) return;
    setDay({ ...day, checkin: { ...(day.checkin ?? emptyCheckin(day.date)), ...patch } });
    try {
      await lifeApi("/checkin", { method: "PUT", body: { date: day.date, patch } });
    } catch (e) {
      setError((e as Error).message);
      void reload();
    }
  };

  if (error && !day) return <ErrorCard message={error} onRetry={reload} />;
  if (!day || !now) return <LoadingDay />;
  if (day.restDay) return <RestScreen name={day.restDay.name} kind={day.restDay.kind} />;

  const phase = phaseOf(day, now);
  const shown = picked ?? phase;
  // On a day off, work items stay in the timeline but are never "next up".
  const nextUp = <NextUp timeline={day.dayOff ? day.timeline.filter((i) => i.area !== "business") : day.timeline} now={now} />;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">
            {day.weekday} · {day.gregorian}
          </p>
          <h1 className="mt-0.5 text-2xl font-black tracking-tight">{day.hebrewDate}</h1>
        </div>
        {demo && (
          <span className="mt-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] text-amber-300">
            מצב הדגמה
          </span>
        )}
      </header>

      {demo && (
        <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
          Supabase עוד לא מחובר: מוצגים נתוני דוגמה, ושינויים לא נשמרים לאורך זמן.
        </p>
      )}
      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {day.startsOn && (
        <p className="rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-gold-2">
          השגרה מתחילה ב{weekdayOf(day.startsOn)}, <bdi dir="ltr">{day.startsOn.split("-").reverse().slice(0, 2).map(Number).join(".")}</bdi>. עד אז אין
          תזכורות, ואפשר להסתכל ולהתכונן.
        </p>
      )}
      {day.dayOff && (
        <p className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
          {day.dayOff}: חופש מעבודה. מועדים לשמחה!
        </p>
      )}

      <PhaseSwitch phase={shown} auto={phase} onPick={setPicked} />

      {/* Only what matters at this time of day; everything else waits under "עוד להיום". */}
      {shown === "morning" && (
        <>
          {!morningDone(day.checkin) && <MorningCheckin checkin={day.checkin} onSave={saveCheckin} />}
          <ContextLessons day={day} />
          <TopTasks day={day} onChange={reload} onError={setError} />
          {nextUp}
          <WeekFocus day={day} />
          <BodyToday day={day} now={now} onSave={saveCheckin} />
          <Learning day={day} onChange={reload} onError={setError} />
        </>
      )}
      {shown === "day" && (
        <>
          {nextUp}
          <ContextLessons day={day} />
          <TopTasks day={day} onChange={reload} onError={setError} />
          {!morningDone(day.checkin) && <MorningCheckin checkin={day.checkin} onSave={saveCheckin} />}
          <BodyToday day={day} now={now} onSave={saveCheckin} />
          <Learning day={day} onChange={reload} onError={setError} />
          <WeekFocus day={day} />
        </>
      )}
      {shown === "evening" && (
        <>
          <EveningCheckin day={day} onSave={saveCheckin} onError={setError} />
          <ContextLessons day={day} />
          {nextUp}
        </>
      )}

      <MoreToday count={day.openTasks.length}>
        <Timeline day={day} now={now} onChange={reload} onError={setError} />
        <Tasks day={day} onChange={reload} onError={setError} />
        {metrics && <TodayMetrics metrics={metrics} />}
        <ChiefShortcuts />
        {shown !== "evening" && <EveningCheckin day={day} onSave={saveCheckin} onError={setError} />}
        {shown === "evening" && <MorningCheckin checkin={day.checkin} onSave={saveCheckin} />}
      </MoreToday>
    </div>
  );
}

type Phase = "morning" | "day" | "evening";
const PHASES: { key: Phase; label: string }[] = [
  { key: "morning", label: "בוקר" },
  { key: "day", label: "יום" },
  { key: "evening", label: "ערב" },
];

/** Morning until deep work starts; evening from half an hour before closing the day. */
function phaseOf(day: DayView, now: string): Phase {
  const minutes = toMinutes(now);
  if (minutes < toMinutes(day.settings.deep_work_start)) return "morning";
  if (minutes >= toMinutes(day.settings.day_close_time) - 30) return "evening";
  return "day";
}

function morningDone(c: Checkin | null) {
  return Boolean(c && c.sleep_hours !== null && c.energy !== null && c.mood !== null);
}

function PhaseSwitch({ phase, auto, onPick }: { phase: Phase; auto: Phase; onPick: (p: Phase | null) => void }) {
  return (
    <div role="tablist" aria-label="חלק ביום" className="grid grid-cols-3 rounded-xl bg-white/[0.04] p-1 text-xs">
      {PHASES.map((p) => (
        <button
          key={p.key}
          type="button"
          role="tab"
          aria-selected={phase === p.key}
          onClick={() => onPick(p.key === auto ? null : p.key)}
          className={`rounded-lg py-1.5 font-semibold ${phase === p.key ? "bg-white/15 text-foreground" : "text-muted"}`}
        >
          {p.label}
          {p.key === auto && <span className="ms-1 text-[10px] font-normal text-gold-2">· עכשיו</span>}
        </button>
      ))}
    </div>
  );
}

/** Everything that is not needed right now, one tap away. */
function MoreToday({ count, children }: { count: number; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border border-border-soft bg-surface/60">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold">
        <span>עוד להיום</span>
        <span className="text-xs font-normal text-muted">
          לו״ז מלא · {count} משימות · מדדים <span className="inline-block transition-transform group-open:rotate-180">▾</span>
        </span>
      </summary>
      <div className="flex flex-col gap-4 px-0 pb-1 pt-1">{children}</div>
    </details>
  );
}

/** The three most important open tasks, to tick off without opening the full list. */
function TopTasks({ day, onChange, onError }: { day: DayView; onChange: () => void; onError: (m: string) => void }) {
  const tasks = day.openTasks.filter((t) => !(day.dayOff && t.area === "business")).slice(0, 3);
  if (!tasks.length) return null;
  const done = async (t: Task) => {
    try {
      await lifeApi(`/tasks/${t.id}`, { method: "PATCH", body: { done: true } });
      onChange();
    } catch (e) {
      onError((e as Error).message);
    }
  };
  return (
    <Card title="3 הדברים של היום" action={<span className="text-xs text-muted">{day.doneToday.length} הושלמו</span>}>
      <ul className="grid gap-1">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-3 py-1 text-sm">
            <button
              type="button"
              onClick={() => done(t)}
              aria-label={`סמן ${t.title} כבוצע`}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/25 hover:border-gold"
            />
            <span className={`h-2 w-2 shrink-0 rounded-full ${AREA_STYLE[t.area].dot}`} />
            <span className="min-w-0 flex-1">{t.title}</span>
            {t.scheduled_time && <bdi dir="ltr" className="font-latin shrink-0 text-xs text-muted">{t.scheduled_time}</bdi>}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Lessons that matter because of something on today's or tomorrow's schedule (a trip list). */
function ContextLessons({ day }: { day: DayView }) {
  if (!day.contextLessons.length) return null;
  return (
    <>
      {day.contextLessons.map((c) => (
        <section key={c.lesson.id} className="rounded-2xl border border-sky-400/30 bg-sky-400/[0.06] p-3">
          <p className="text-xs text-sky-300">
            🎒 {c.when === "today" ? "היום" : "מחר"}: {c.match}
          </p>
          <p className="mt-1 text-sm font-bold">{c.lesson.rule}</p>
          {c.lesson.story && <LessonStory story={c.lesson.story} open={c.when === "tomorrow"} />}
        </section>
      ))}
    </>
  );
}

/** This week's focus from the weekly review; on Sunday without one, an invitation to do it. */
function WeekFocus({ day }: { day: DayView }) {
  if (day.weekFocus.length) {
    return (
      <Link href="/life/growth?tab=review" className="rounded-2xl border border-border-soft bg-surface p-3">
        <p className="mb-1 text-xs text-gold-2">הפוקוס של השבוע</p>
        <ul className="grid gap-0.5 text-sm">
          {day.weekFocus.map((f) => (
            <li key={f}>• {f}</li>
          ))}
        </ul>
      </Link>
    );
  }
  if (new Date(`${day.date}T12:00:00Z`).getUTCDay() !== 0 || day.dayOff || day.startsOn) return null;
  return (
    <Link href="/life/growth?tab=review" className="flex items-center justify-between rounded-2xl border border-gold/30 bg-gold/[0.07] p-3 text-sm">
      <span>
        <span className="block font-semibold">סקירה שבועית</span>
        <span className="text-xs text-muted">5 דקות: מה הלך, מה הלקח, ו־3 פוקוסים לשבוע</span>
      </span>
      <span className="text-gold-2">להתחיל</span>
    </Link>
  );
}

function weekdayOf(date: string) {
  return new Intl.DateTimeFormat("he-IL", { weekday: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

function emptyCheckin(date: string): Checkin {
  return {
    date,
    sleep_hours: null,
    weight: null,
    energy: null,
    mood: null,
    shacharit: false,
    mincha: false,
    arvit: false,
    hitbodedut: false,
    workout: false,
    day_rating: null,
    note: null,
    updated_at: "",
  };
}

// ---------------------------------------------------------------------------------------------

function Card({ title, icon, children, action }: { title: string; icon?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border-soft bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[15px] font-bold">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function LoadingDay() {
  return (
    <div className="flex min-h-[60svh] items-center justify-center text-muted" role="status">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      <span className="sr-only">טוען את היום…</span>
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mt-10 rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-center">
      <p className="text-sm text-red-200">{message}</p>
      <button onClick={onRetry} className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold">
        נסה שוב
      </button>
    </div>
  );
}

function RestScreen({ name, kind }: { name: string; kind: "shabbat" | "yomtov" }) {
  return (
    <div className="flex min-h-[75svh] flex-col items-center justify-center text-center">
      <MoonStar className="h-12 w-12 text-gold-2" strokeWidth={1.4} />
      <h1 className="mt-5 text-3xl font-black">{kind === "shabbat" ? "שבת שלום" : `חג שמח`}</h1>
      <p className="mt-2 text-muted">{kind === "shabbat" ? "המערכת שקטה עד מוצאי שבת." : `${name} · המערכת שקטה עד צאת החג.`}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

/** Minutes until an item ends: its own end, or the next timed item's start. */
function endOf(items: TimelineItem[], index: number): number | null {
  const item = items[index];
  if (!item.start) return null;
  if (item.end) return toMinutes(item.end);
  const next = items.slice(index + 1).find((i) => i.start);
  return next?.start ? toMinutes(next.start) : toMinutes(item.start) + 30;
}

function formatIn(minutes: number) {
  if (minutes < 60) return `בעוד ${minutes} דק׳`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `בעוד ${h}:${String(m).padStart(2, "0")} ש׳` : `בעוד ${h} ש׳`;
}

function NextUp({ timeline, now }: { timeline: TimelineItem[]; now: string }) {
  const nowMin = toMinutes(now);
  const next = timeline.find((i) => i.start && toMinutes(i.start) > nowMin && !i.done);
  if (!next?.start) {
    return (
      <div className="rounded-2xl border border-gold/25 bg-[linear-gradient(135deg,rgba(212,162,78,0.14),rgba(212,162,78,0.03))] p-4">
        <p className="text-sm text-gold-2">היום הסתיים. לילה טוב 🌙</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-gold/25 bg-[linear-gradient(135deg,rgba(212,162,78,0.16),rgba(212,162,78,0.03))] p-4">
      <p className="text-xs font-medium text-gold-2">הבא בתור · {formatIn(toMinutes(next.start) - nowMin)}</p>
      <p className="mt-1 text-xl font-black">
        {next.title} <span className="font-latin text-base font-semibold text-muted">{next.start}</span>
      </p>
      {next.note && <p className="mt-0.5 text-sm text-muted">{next.note}</p>}
    </div>
  );
}

function BodyToday({ day, now, onSave }: { day: DayView; now: string; onSave: (p: CheckinPatch) => void }) {
  const { body } = day;
  if (body.daysToStart > 0) {
    return (
      <Link href="/life/body" className="flex items-center gap-3 rounded-2xl border border-border-soft bg-surface p-4">
        <Dumbbell className="h-5 w-5 shrink-0 text-gold-2" />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold">תוכנית הגוף מתחילה בעוד {body.daysToStart === 1 ? "יום" : `${body.daysToStart} ימים`}</span>
          <span className="block text-xs text-muted">תפריט, אימונים ורשימת קניות מוכנים. לחץ לצפייה.</span>
        </span>
      </Link>
    );
  }
  const nowMin = toMinutes(now);
  const nextMeal = body.meals.find((m) => toMinutes(m.time) + 30 > nowMin) ?? null;
  const done = Boolean(day.checkin?.workout);
  return (
    <Card title="הגוף היום" icon={<Dumbbell className="h-4 w-4 text-gold-2" />} action={<Link href="/life/body" className="text-xs text-gold-2">לתוכנית</Link>}>
      {nextMeal && (
        <div className="mb-3 rounded-xl bg-white/[0.03] p-3">
          <p className="text-xs text-muted">
            הארוחה הבאה · <span className="font-latin">{nextMeal.time}</span>
          </p>
          <p className="mt-0.5 font-bold">{nextMeal.label}</p>
          <p className="text-sm text-foreground/85">
            <Bidi text={nextMeal.items.join(" · ")} />
          </p>
        </div>
      )}
      {body.activity ? (
        <button
          type="button"
          aria-pressed={done}
          onClick={() => onSave({ workout: !done })}
          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-start transition-colors ${
            done ? "border-gold/50 bg-gold/15" : "border-border-soft bg-white/[0.03]"
          }`}
        >
          {body.activity.workout ? <Dumbbell className="h-4 w-4 text-gold-2" /> : <Footprints className="h-4 w-4 text-emerald-300" />}
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{body.activity.title}</span>
            <span className="text-xs text-muted">
              <span className="font-latin">{body.activity.time}</span> · {body.activity.minutes} דק׳
            </span>
          </span>
          <span className={`flex h-6 w-6 items-center justify-center rounded-full ${done ? "bg-gold text-[#1d1407]" : "border border-white/25"}`}>
            {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          </span>
        </button>
      ) : (
        <p className="text-sm text-muted">היום יום מנוחה מאימונים.</p>
      )}
      <p className="mt-2 text-xs text-muted">
        <Bidi text={`יעד: ~${body.calories.toLocaleString("he-IL")} קלוריות · ${body.protein} גרם חלבון · 2.5–3 ליטר מים`} />
      </p>
    </Card>
  );
}

function Learning({ day, onChange, onError }: { day: DayView; onChange: () => void; onError: (m: string) => void }) {
  const l = day.learning;
  const [busy, setBusy] = useState(false);
  const move = async (delta: number) => {
    setBusy(true);
    try {
      await lifeApi("/learning", { method: "PUT", body: { delta } });
      onChange();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const pct = Math.round((l.done / l.total) * 100);
  const onPace = l.neededPerWeek <= l.plannedPerWeek;
  return (
    <Card
      title={`לימוד: ${l.title}`}
      icon={<BookOpen className="h-4 w-4 text-gold-2" />}
      action={
        <span className="text-xs text-muted">
          {l.done}/{l.total} עמודים
        </span>
      }
    >
      <div className="h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={l.done} aria-valuemin={0} aria-valuemax={l.total} aria-label="התקדמות בלימוד">
        <div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      {l.finished ? (
        <p className="mt-3 text-sm font-bold text-gold-2">סיימת את המסכת! הדרן עלך 🎉</p>
      ) : (
        <>
          <p className="mt-3 text-sm">
            הבא: <span className="font-bold">{l.next}</span>
          </p>
          <p className={`mt-0.5 text-xs ${onPace ? "text-muted" : "text-amber-300"}`}>
            {onPace
              ? `בקצב: ${l.plannedPerWeek} עמודים בשבוע מספיקים לסיום עד יום ההולדת (עוד ${l.daysLeft} ימים).`
              : `כדי לסיים בזמן צריך ${l.neededPerWeek} עמודים בשבוע (עוד ${l.daysLeft} ימים).`}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => move(1)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-sm font-bold text-[#1d1407] disabled:opacity-60"
            >
              <Check className="h-4 w-4" strokeWidth={3} /> סיימתי עמוד
            </button>
            {l.done > 0 && (
              <button
                type="button"
                disabled={busy}
                onClick={() => move(-1)}
                aria-label="בטל עמוד אחרון"
                className="rounded-xl bg-white/5 px-3 text-muted hover:text-foreground disabled:opacity-60"
              >
                <Undo2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

/** Money and sales at a glance, plus what still needs an update today. */
function TodayMetrics({ metrics }: { metrics: Metric[] }) {
  const due = metrics.filter((m) => m.status === "due");
  const headline = metrics.filter((m) => m.key === "profit" || m.key === "sales");
  return (
    <div className="flex flex-col gap-2">
      {headline.map((m) => (
        <MetricCard key={m.key} metric={m} />
      ))}
      {due.length > 0 && (
        <Link href="/life/metrics" className="rounded-xl border border-sky-400/25 bg-sky-400/10 px-3 py-2 text-xs text-sky-100">
          לעדכון היום: {due.map((m) => m.label).join(" · ")}
        </Link>
      )}
    </div>
  );
}

function ChiefShortcuts() {
  const shortcuts = [
    { preset: "morning", label: "תכנית בוקר", icon: Sunrise },
    { preset: "evening", label: "סגירת יום", icon: MoonStar },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {shortcuts.map(({ preset, label, icon: Icon }) => (
        <Link
          key={preset}
          href={`/life/chat?preset=${preset}`}
          className="flex items-center justify-center gap-2 rounded-xl border border-border-soft bg-surface-strong py-3 text-sm font-semibold transition-colors hover:border-gold/40"
        >
          <Icon className="h-4 w-4 text-gold-2" />
          {label}
        </Link>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

function Scale({ value, onPick, label }: { value: number | null; onPick: (v: number) => void; label: string }) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-muted">{label}</p>
      <div className="grid grid-cols-5 gap-1.5" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            onClick={() => onPick(n)}
            className={`font-latin rounded-lg py-2 text-sm font-semibold transition-colors ${
              value === n ? "bg-gold text-[#1d1407]" : "bg-white/5 text-muted hover:bg-white/10"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  step,
  unit,
  onSave,
}: {
  label: string;
  value: number | null;
  step: number;
  unit: string;
  onSave: (v: number | null) => void;
}) {
  const [draft, setDraft] = useState(value?.toString() ?? "");
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-muted">{label}</span>
      <span className="flex items-center gap-2 rounded-lg bg-white/5 px-3">
        <input
          inputMode="decimal"
          type="number"
          step={step}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            const n = draft === "" ? null : Number(draft);
            if (n === value || (n !== null && Number.isNaN(n))) return;
            onSave(n);
          }}
          className="font-latin w-full bg-transparent py-2 text-sm outline-none"
          dir="ltr"
        />
        <span className="text-xs text-muted">{unit}</span>
      </span>
    </label>
  );
}

function MorningCheckin({ checkin, onSave }: { checkin: Checkin | null; onSave: (p: CheckinPatch) => void }) {
  return (
    <Card title="צ׳ק־אין בוקר" icon={<Sunrise className="h-4 w-4 text-gold-2" />}>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="שעות שינה" value={checkin?.sleep_hours ?? null} step={0.5} unit="ש׳" onSave={(v) => onSave({ sleep_hours: v })} />
        <NumberField label="משקל" value={checkin?.weight ?? null} step={0.1} unit="ק״ג" onSave={(v) => onSave({ weight: v })} />
      </div>
      <div className="mt-3 grid gap-3">
        <Scale label="אנרגיה" value={checkin?.energy ?? null} onPick={(v) => onSave({ energy: v })} />
        <Scale label="מצב רוח" value={checkin?.mood ?? null} onPick={(v) => onSave({ mood: v })} />
      </div>
    </Card>
  );
}

/** Closing the day in about 30 seconds: prayers, workout, how the day was, and one takeaway. */
function EveningCheckin({ day, onSave, onError }: { day: DayView; onSave: (p: CheckinPatch) => void; onError: (m: string) => void }) {
  const checkin = day.checkin;
  const toggles = [
    { key: "shacharit", label: "שחרית" },
    { key: "mincha", label: "מנחה" },
    { key: "arvit", label: "ערבית" },
    { key: "hitbodedut", label: "התבודדות" },
    ...(day.body.activity ? [{ key: "workout", label: "אימון" } as const] : []),
  ] as const;
  const [note, setNote] = useState(checkin?.note ?? "");
  const [asLesson, setAsLesson] = useState(false);
  const [savedLesson, setSavedLesson] = useState(false);
  const filled = toggles.filter(({ key }) => checkin?.[key]).length + (checkin?.day_rating ? 1 : 0);

  const saveNote = async () => {
    if (note === (checkin?.note ?? "")) return;
    onSave({ note: note || null });
  };
  const saveLesson = async () => {
    if (note.trim().length < 3) return;
    try {
      await lifeApi("/growth/lessons", { method: "POST", body: { rule: note.trim(), source: "mine" } });
      setSavedLesson(true);
      setAsLesson(false);
    } catch (e) {
      onError((e as Error).message);
    }
  };

  return (
    <Card title="סגירת יום" icon={<MoonStar className="h-4 w-4 text-gold-2" />} action={<span className="text-xs text-muted">30 שניות</span>}>
      <div className="flex flex-wrap gap-1.5">
        {toggles.map(({ key, label }) => {
          const done = Boolean(checkin?.[key]);
          return (
            <button
              key={key}
              type="button"
              aria-pressed={done}
              onClick={() => onSave({ [key]: !done })}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${
                done ? "border-gold/50 bg-gold/15 text-gold-2" : "border-border-soft bg-white/[0.03] text-muted"
              }`}
            >
              {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              {label}
            </button>
          );
        })}
      </div>
      <div className="mt-3">
        <Scale label="איך היה היום?" value={checkin?.day_rating ?? null} onPick={(v) => onSave({ day_rating: v })} />
      </div>
      <input
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setSavedLesson(false);
        }}
        onBlur={saveNote}
        placeholder="מה למדתי היום? (משפט אחד, לא חובה)"
        aria-label="מה למדתי היום"
        className="mt-3 w-full rounded-lg bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted/70"
      />
      {note.trim().length >= 3 && !savedLesson && (
        <label className="mt-2 flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={asLesson}
            onChange={(e) => {
              setAsLesson(e.target.checked);
              if (e.target.checked) void saveLesson();
            }}
            className="h-4 w-4 accent-[#d4a24e]"
          />
          לשמור גם כלקח שיחזור אליי
        </label>
      )}
      {savedLesson && <p className="mt-2 text-xs text-emerald-300">נשמר ברשימת הלקחים ✓</p>}
      <p className="mt-2 text-[11px] text-muted">
        מולאו {filled} מתוך {toggles.length + 1}. מהנתונים האלה המערכת לומדת עליך.
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------------------------

function Timeline({
  day,
  now,
  onChange,
  onError,
}: {
  day: DayView;
  now: string;
  onChange: () => void;
  onError: (m: string) => void;
}) {
  const nowMin = toMinutes(now);
  const act = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      onChange();
    } catch (e) {
      onError((e as Error).message);
    }
  };

  return (
    <Card title="הלו״ז של היום">
      <ol className="relative">
        {day.timeline.map((item, i) => {
          const start = item.start ? toMinutes(item.start) : null;
          const end = endOf(day.timeline, i);
          const current = start !== null && end !== null && start <= nowMin && nowMin < end;
          const past = end !== null && end <= nowMin && !current;
          const style = AREA_STYLE[item.area];
          const isAnchor = item.kind === "anchor";
          return (
            <li
              key={item.key}
              className={`relative flex items-start gap-3 rounded-xl px-2 py-2 ${current ? "bg-gold/10 ring-1 ring-gold/30" : ""} ${
                past ? "opacity-45" : ""
              }`}
              aria-current={current ? "time" : undefined}
            >
              <span className="font-latin w-11 shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-muted" dir="ltr">
                {item.start ?? "--:--"}
              </span>
              <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${isAnchor ? "bg-gold-2 ring-4 ring-gold/15" : style.dot}`} />
              <span className="min-w-0 flex-1">
                <span className={`block text-[15px] ${isAnchor ? "font-bold text-gold-2" : "font-semibold"} ${item.done ? "line-through" : ""}`}>
                  {item.title}
                  {item.end && (
                    <span className="mx-1.5 text-xs font-normal text-muted">
                      עד <span className="font-latin">{item.end}</span>
                    </span>
                  )}
                </span>
                {item.note && <span className="block text-xs text-muted">{item.note}</span>}
              </span>
              {item.kind === "event" && item.id && (
                <button
                  type="button"
                  aria-label={`מחק את ${item.title}`}
                  onClick={() => act(() => lifeApi(`/events/${item.id}`, { method: "DELETE" }))}
                  className="rounded-lg p-1.5 text-muted hover:bg-white/10 hover:text-foreground"
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
                  className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                    item.done ? "border-gold bg-gold text-[#1d1407]" : "border-white/25"
                  }`}
                >
                  {item.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </button>
              )}
            </li>
          );
        })}
      </ol>
      <AddEvent date={day.date} onAdded={onChange} onError={onError} />
    </Card>
  );
}

function AddEvent({ date, onAdded, onError }: { date: string; onAdded: () => void; onError: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2 flex items-center gap-1.5 px-2 text-sm text-gold-2">
        <Plus className="h-4 w-4" /> הוסף לו״ז
      </button>
    );
  }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await lifeApi("/events", { method: "POST", body: { date, title, start_time: start, end_time: end || null } });
      setTitle("");
      setStart("");
      setEnd("");
      setOpen(false);
      onAdded();
    } catch (err) {
      onError((err as Error).message);
    }
  };
  return (
    <form onSubmit={submit} className="mt-3 grid gap-2 rounded-xl bg-white/[0.03] p-3">
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="מה?" className="rounded-lg bg-white/5 px-3 py-2 text-sm outline-none" />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted">
          התחלה
          <input required type="time" value={start} onChange={(e) => setStart(e.target.value)} className="font-latin mt-1 w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-foreground outline-none" />
        </label>
        <label className="text-xs text-muted">
          סיום (לא חובה)
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="font-latin mt-1 w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-foreground outline-none" />
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="flex-1 rounded-lg bg-gold py-2 text-sm font-bold text-[#1d1407]">
          הוסף
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-white/5 px-4 py-2 text-sm">
          ביטול
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------------------------

const PRIORITIES = [
  { value: 1, label: "חובה" },
  { value: 2, label: "רצוי" },
  { value: 3, label: "נחמד" },
];

function Tasks({ day, onChange, onError }: { day: DayView; onChange: () => void; onError: (m: string) => void }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(2);
  const [area, setArea] = useState<Area>("general");
  const [busy, setBusy] = useState(false);

  const act = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      onChange();
    } catch (e) {
      onError((e as Error).message);
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    await act(() => lifeApi("/tasks", { method: "POST", body: { title, priority, area, due_date: day.date } }));
    setTitle("");
    setBusy(false);
  };

  const top = day.openTasks.filter((t) => t.priority === 1);
  const rest = day.openTasks.filter((t) => t.priority !== 1);

  return (
    <Card title="משימות" action={<span className="text-xs text-muted">{day.doneToday.length} הושלמו היום</span>}>
      {top.length > 0 && <TaskGroup label="החשובות של היום" tasks={top} act={act} highlight />}
      {rest.length > 0 && <TaskGroup label={top.length ? "עוד" : undefined} tasks={rest} act={act} />}
      {day.openTasks.length === 0 && <p className="text-sm text-muted">אין משימות פתוחות. הוסף משימה או בקש מהמנהל תכנית בוקר.</p>}

      <form onSubmit={add} className="mt-3 grid gap-2">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="משימה חדשה"
            aria-label="משימה חדשה"
            className="min-w-0 flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted/70"
          />
          <button type="submit" disabled={busy} aria-label="הוסף משימה" className="rounded-lg bg-gold px-3 text-[#1d1407] disabled:opacity-60">
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              aria-pressed={priority === p.value}
              onClick={() => setPriority(p.value)}
              className={`rounded-full px-2.5 py-1 text-xs ${priority === p.value ? "bg-white/15 text-foreground" : "text-muted"}`}
            >
              {p.label}
            </button>
          ))}
          <select
            value={area}
            onChange={(e) => setArea(e.target.value as Area)}
            aria-label="תחום"
            className="ms-auto rounded-full bg-white/5 px-2.5 py-1 text-xs text-muted outline-none"
          >
            {AREAS.map((a) => (
              <option key={a} value={a} className="bg-[#0b0d1f]">
                {AREA_LABELS[a]}
              </option>
            ))}
          </select>
        </div>
      </form>
    </Card>
  );
}

function TaskGroup({
  label,
  tasks,
  act,
  highlight,
}: {
  label?: string;
  tasks: Task[];
  act: (fn: () => Promise<unknown>) => void;
  highlight?: boolean;
}) {
  return (
    <div className="mb-2">
      {label && <p className={`mb-1 text-xs font-semibold ${highlight ? "text-gold-2" : "text-muted"}`}>{label}</p>}
      <ul className="grid gap-1">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-2.5 rounded-xl px-1 py-1.5">
            <button
              type="button"
              aria-label={`סמן ${t.title} כבוצע`}
              onClick={() => act(() => lifeApi(`/tasks/${t.id}`, { method: "PATCH", body: { done: true } }))}
              className={`h-5 w-5 shrink-0 rounded-full border ${highlight ? "border-gold/60" : "border-white/25"} hover:bg-white/10`}
            />
            <span className="min-w-0 flex-1 text-sm">
              {t.title}
              {t.scheduled_time && (
                <span className="font-latin mx-1.5 text-xs text-muted">{t.scheduled_time}</span>
              )}
            </span>
            <span className={`rounded-full border px-1.5 py-0.5 text-[10px] ${AREA_STYLE[t.area].chip}`}>{AREA_LABELS[t.area]}</span>
            <button
              type="button"
              aria-label={`מחק את ${t.title}`}
              onClick={() => act(() => lifeApi(`/tasks/${t.id}`, { method: "DELETE" }))}
              className="rounded-lg p-1 text-muted/60 hover:text-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

