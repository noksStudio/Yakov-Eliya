"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lightbulb, Loader2, MessageCircle, Plus, RotateCcw, Sprout, Target, Trash2 } from "lucide-react";
import type { GoalProgress, GoalStatus, GrowthSummary, Insight, Lesson, WeeklyReview } from "@/lib/life/growth-types";
import { AREA_LABELS, AREAS, type Area } from "@/lib/life/types";
import { lifeApi } from "./api";
import { AREA_STYLE } from "./areas";

const TABS = [
  { key: "goals", label: "יעדים" },
  { key: "lessons", label: "לקחים" },
  { key: "review", label: "סקירה שבועית" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const field = "w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted/70";
const shortDate = (d: string) => `${Number(d.slice(8, 10))}.${Number(d.slice(5, 7))}`;
const num = (n: number) => (Math.abs(n) >= 1000 ? Math.round(n).toLocaleString("he-IL") : String(Math.round(n * 10) / 10));

const STATUS: Record<GoalStatus, { label: string; chip: string; bar: string }> = {
  done: { label: "הושג", chip: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300", bar: "bg-emerald-400" },
  on_track: { label: "בקצב", chip: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300", bar: "bg-gold" },
  behind: { label: "בפיגור", chip: "border-amber-400/30 bg-amber-400/10 text-amber-300", bar: "bg-amber-400" },
  no_data: { label: "אין נתונים", chip: "border-white/15 bg-white/5 text-muted", bar: "bg-white/30" },
};

export function GrowthView() {
  const params = useSearchParams();
  const router = useRouter();
  const raw = params.get("tab");
  const tab: Tab = raw === "lessons" || raw === "review" ? raw : "goals";
  const [data, setData] = useState<GrowthSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    lifeApi<{ growth: GrowthSummary }>("/growth")
      .then((d) => setData(d.growth))
      .catch((e) => setError((e as Error).message));

  useEffect(() => {
    void load();
  }, []);

  const act = (fn: () => Promise<unknown>) =>
    fn()
      .then(load)
      .catch((e) => setError((e as Error).message));

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <Sprout className="h-6 w-6 text-gold-2" /> צמיחה
        </h1>
        <p className="text-sm text-muted">
          חזון 30: היעדים עד יום ההולדת ב־10.3.2027{data ? ` · עוד ${data.daysToVision} ימים` : ""}
        </p>
      </header>

      <div role="tablist" aria-label="צמיחה" className="grid grid-cols-3 rounded-xl bg-white/5 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => router.replace(`/life/growth?tab=${t.key}`, { scroll: false })}
            className={`rounded-lg py-2 text-sm font-semibold ${tab === t.key ? "bg-gold text-[#1d1407]" : "text-muted"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {!data ? (
        !error && (
          <div className="flex min-h-[40svh] items-center justify-center text-muted" role="status">
            <Loader2 className="h-6 w-6 animate-spin" aria-label="טוען" />
          </div>
        )
      ) : tab === "goals" ? (
        <>
          {data.goals.map((g) => (
            <GoalCard key={g.id} goal={g} onAct={act} />
          ))}
          <AddGoal onAct={act} />
          <Insights insights={data.insights} />
        </>
      ) : tab === "lessons" ? (
        <LessonsTab data={data} onAct={act} />
      ) : (
        <ReviewTab data={data} onSaved={load} onError={setError} />
      )}
    </div>
  );
}

function GoalCard({ goal, onAct }: { goal: GoalProgress; onAct: (fn: () => Promise<unknown>) => void }) {
  const [value, setValue] = useState("");
  const s = STATUS[goal.status];
  return (
    <section className="rounded-2xl border border-border-soft bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[15px] font-bold">
          <span className={`h-2 w-2 rounded-full ${AREA_STYLE[goal.area].dot}`} /> {goal.title}
        </h2>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] ${s.chip}`}>{s.label}</span>
      </div>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
        <span className="text-2xl font-black">{goal.current === null ? "—" : num(goal.current)}</span>
        <span className="text-sm text-muted">
          מתוך {num(goal.target)} {goal.unit}
        </span>
        {goal.currentNote && <span className="text-xs text-muted">({goal.currentNote})</span>}
      </p>
      <div
        className="relative mt-3 h-2 rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={goal.pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${goal.title}: ${goal.pct}% מהדרך, הקצב המתוכנן ${goal.expectedPct}%`}
      >
        <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${goal.pct}%` }} />
        {/* Where the plan says he should be today. */}
        <span className="absolute -top-1 h-4 w-0.5 rounded bg-foreground/60" style={{ insetInlineStart: `${goal.expectedPct}%` }} aria-hidden />
      </div>
      <p className="mt-2 text-xs text-muted">
        {goal.pct}% מהדרך · הקצב המתוכנן {goal.expectedPct}%
        {goal.checkpoint && (
          <>
            {" "}
            · עד <bdi dir="ltr">{shortDate(goal.checkpoint.date)}</bdi>: {num(goal.checkpoint.value)} {goal.unit}
          </>
        )}
      </p>
      {goal.metric === "custom" && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (value === "") return;
            onAct(() => lifeApi(`/growth/goals/${goal.id}`, { method: "PATCH", body: { value: Number(value) } }));
            setValue("");
          }}
        >
          <input type="number" inputMode="decimal" step="any" value={value} onChange={(e) => setValue(e.target.value)} placeholder="ערך נוכחי" aria-label={`עדכון ${goal.title}`} className={field} />
          <button type="submit" className="shrink-0 rounded-xl bg-white/10 px-4 text-sm font-semibold">
            עדכון
          </button>
          <button
            type="button"
            onClick={() => window.confirm(`למחוק את היעד "${goal.title}"?`) && onAct(() => lifeApi(`/growth/goals/${goal.id}`, { method: "DELETE" }))}
            aria-label={`מחק את ${goal.title}`}
            className="shrink-0 rounded-xl px-2 text-muted/60 hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </form>
      )}
    </section>
  );
}

function AddGoal({ onAct }: { onAct: (fn: () => Promise<unknown>) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [deadline, setDeadline] = useState("2027-03-10");
  const [area, setArea] = useState<Area>("business");
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border-soft py-3 text-sm text-gold-2">
        <Plus className="h-4 w-4" /> יעד נוסף
      </button>
    );
  }
  return (
    <form
      className="grid gap-2 rounded-2xl border border-border-soft bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onAct(async () => {
          await lifeApi("/growth/goals", { method: "POST", body: { title, start: Number(start), target: Number(target), unit, deadline, area } });
          setOpen(false);
          setTitle("");
          setStart("");
          setTarget("");
          setUnit("");
        });
      }}
    >
      <h2 className="flex items-center gap-2 text-[15px] font-bold">
        <Target className="h-4 w-4 text-gold-2" /> יעד חדש
      </h2>
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="מה? למשל: עסקאות של 30 אלף ומעלה" aria-label="שם היעד" className={field} />
      <div className="grid grid-cols-3 gap-2">
        <input required type="number" step="any" value={start} onChange={(e) => setStart(e.target.value)} placeholder="היום" aria-label="נקודת התחלה" className={field} />
        <input required type="number" step="any" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="יעד" aria-label="יעד" className={field} />
        <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="יחידה" aria-label="יחידה" className={field} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input required type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} aria-label="עד תאריך" className={`font-latin ${field}`} />
        <select value={area} onChange={(e) => setArea(e.target.value as Area)} aria-label="תחום" className={field}>
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {AREA_LABELS[a]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="flex-1 rounded-xl bg-gold py-2.5 text-sm font-bold text-[#1d1407]">
          הוספה
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-xl bg-white/5 px-4 text-sm">
          ביטול
        </button>
      </div>
    </form>
  );
}

function Insights({ insights }: { insights: Insight[] }) {
  return (
    <section className="rounded-2xl border border-border-soft bg-surface p-4">
      <h2 className="mb-1 text-[15px] font-bold">מה למדנו עליך</h2>
      {insights.length ? (
        <ul className="mt-2 grid grid-cols-1 gap-2">
          {insights.map((i) => (
            <li key={i.key} className="flex gap-2 text-sm">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${AREA_STYLE[i.area].dot}`} />
              {i.text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted">אחרי 2–3 שבועות של צ׳ק־אין (שינה, אנרגיה, מצב רוח, אימונים ותפילות) יופיעו כאן דפוסים שהמערכת זיהתה.</p>
      )}
    </section>
  );
}

function LessonsTab({ data, onAct }: { data: GrowthSummary; onAct: (fn: () => Promise<unknown>) => void }) {
  const [rule, setRule] = useState("");
  const [story, setStory] = useState("");
  const [source, setSource] = useState<"mine" | "others">("mine");
  const [sourceName, setSourceName] = useState("");
  const [area, setArea] = useState<Area>("business");
  const [mode, setMode] = useState<"always" | "context">("always");
  const [words, setWords] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (rule.trim().length < 3) return;
    const triggers = mode === "context" ? words.split(/[,،\n]/).map((w) => w.trim()).filter((w) => w.length >= 2) : [];
    onAct(async () => {
      await lifeApi("/growth/lessons", {
        method: "POST",
        body: { rule, story: story || null, source, source_name: source === "others" ? sourceName || null : null, area, triggers },
      });
      setRule("");
      setStory("");
      setSourceName("");
      setWords("");
    });
  };

  return (
    <>
      {data.lessonOfDay && <LessonOfDay lesson={data.lessonOfDay} onAct={onAct} />}

      <form onSubmit={add} className="grid gap-2 rounded-2xl border border-border-soft bg-surface p-4">
        <h2 className="text-[15px] font-bold">לקח חדש</h2>
        <p className="text-xs text-muted">כלל קצר שאפשר לפעול לפיו.</p>
        <input value={rule} onChange={(e) => setRule(e.target.value)} placeholder="למשל: לא שולחים הצעת מחיר בלי שיחת אבחון" aria-label="הלקח" className={field} />
        <textarea value={story} onChange={(e) => setStory(e.target.value)} rows={2} placeholder="מה קרה, או רשימה (לא חובה)" aria-label="מה קרה" className={`resize-none ${field}`} />
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-xs text-muted">מתי להזכיר</legend>
          <div className="grid grid-cols-2 rounded-xl bg-white/5 p-1" role="group" aria-label="מתי להזכיר">
            {(
              [
                ["always", "בסבב הבוקר"],
                ["context", "רק בהקשר"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                aria-pressed={mode === k}
                onClick={() => setMode(k)}
                className={`rounded-lg py-1.5 text-xs font-semibold ${mode === k ? "bg-white/15 text-foreground" : "text-muted"}`}
              >
                {l}
              </button>
            ))}
          </div>
          {mode === "always" ? (
            <p className="text-[11px] text-muted">חוזר בהודעת הבוקר: אחרי יומיים, שבוע, שבועיים, חודש, וכן הלאה.</p>
          ) : (
            <>
              <input
                value={words}
                onChange={(e) => setWords(e.target.value)}
                placeholder="מילים, מופרדות בפסיק: טיול, פארק, פיקניק"
                aria-label="מילים שמפעילות את הלקח"
                className={field}
              />
              <p className="text-[11px] text-muted">יופיע רק כשבלו״ז של היום או מחר יש אחת המילים: במסך היום, בהודעת הבוקר ובסגירת היום שלפני.</p>
            </>
          )}
        </fieldset>
        <div className="grid grid-cols-2 rounded-xl bg-white/5 p-1" role="group" aria-label="ממי הלקח">
          {(
            [
              ["mine", "טעות שלי"],
              ["others", "מאחרים"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              aria-pressed={source === k}
              onClick={() => setSource(k)}
              className={`rounded-lg py-1.5 text-xs font-semibold ${source === k ? "bg-white/15 text-foreground" : "text-muted"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {source === "others" && (
            <input value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="ממי? ספר, מנטור, לקוח" aria-label="מקור" className={field} />
          )}
          <select value={area} onChange={(e) => setArea(e.target.value as Area)} aria-label="תחום" className={`${field} ${source === "others" ? "" : "col-span-2"}`}>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {AREA_LABELS[a]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-xl bg-gold py-2.5 text-sm font-bold text-[#1d1407]">
          שמירה
        </button>
      </form>

      <section className="rounded-2xl border border-border-soft bg-surface p-4">
        <h2 className="mb-2 text-[15px] font-bold">כל הלקחים ({data.lessons.length})</h2>
        {data.lessons.length === 0 ? (
          <p className="text-xs text-muted">עוד אין לקחים. כל טעות שנרשמת כאן היא טעות שלא תחזור.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2">
            {data.lessons.map((l) => (
              <li key={l.id} className="flex items-start gap-2 rounded-xl bg-white/[0.03] p-3 text-sm">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${AREA_STYLE[l.area].dot}`} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{l.rule}</span>
                  {l.story && <LessonStory story={l.story} />}
                  <span className="mt-1 block text-[11px] text-muted">
                    {l.source === "others" ? `מ${l.source_name ?? "אחרים"}` : "טעות שלי"} ·{" "}
                    {l.triggers?.length ? (
                      <span className="text-sky-300">מופיע לפני: {l.triggers.join(", ")}</span>
                    ) : (
                      <>
                        חוזר ב־<bdi dir="ltr">{shortDate(l.next_review)}</bdi>
                        {l.reviews > 0 && ` · נראה ${l.reviews} פעמים`}
                      </>
                    )}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => window.confirm("למחוק את הלקח?") && onAct(() => lifeApi(`/growth/lessons/${l.id}`, { method: "DELETE" }))}
                  aria-label={`מחק את הלקח ${l.rule}`}
                  className="shrink-0 rounded-lg p-1 text-muted/60 hover:text-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

/** A long story (a checklist) folds away so the list of lessons stays readable. */
export function LessonStory({ story, open = false }: { story: string; open?: boolean }) {
  const lines = story.split("\n").length;
  if (lines <= 3) return <span className="mt-0.5 block whitespace-pre-line text-xs leading-relaxed text-muted">{story}</span>;
  return (
    <details className="mt-1" open={open}>
      <summary className="cursor-pointer text-xs text-gold-2">הפרטים המלאים</summary>
      <span className="mt-1 block whitespace-pre-line text-xs leading-relaxed text-muted">{story}</span>
    </details>
  );
}

function LessonOfDay({ lesson, onAct }: { lesson: Lesson; onAct: (fn: () => Promise<unknown>) => void }) {
  return (
    <section className="rounded-2xl border border-gold/30 bg-gold/[0.07] p-4">
      <p className="flex items-center gap-1.5 text-xs text-gold-2">
        <Lightbulb className="h-3.5 w-3.5" /> הלקח של היום
      </p>
      <p className="mt-1 text-lg font-bold leading-snug">{lesson.rule}</p>
      {lesson.story && <p className="mt-1 whitespace-pre-line text-sm text-muted">{lesson.story}</p>}
      <button
        type="button"
        onClick={() => onAct(() => lifeApi(`/growth/lessons/${lesson.id}`, { method: "PATCH", body: { again: true } }))}
        className="mt-3 flex items-center gap-1.5 text-xs text-muted hover:text-foreground"
      >
        <RotateCcw className="h-3.5 w-3.5" /> עוד לא הפנמתי, להחזיר בקרוב
      </button>
    </section>
  );
}

function ReviewTab({ data, onSaved, onError }: { data: GrowthSummary; onSaved: () => void; onError: (m: string) => void }) {
  const r = data.review;
  const [wentWell, setWentWell] = useState(r?.went_well ?? "");
  const [wentBadly, setWentBadly] = useState(r?.went_badly ?? "");
  const [lesson, setLesson] = useState(r?.lesson ?? "");
  const [focus, setFocus] = useState<string[]>([r?.focus[0] ?? "", r?.focus[1] ?? "", r?.focus[2] ?? ""]);
  const [saveLesson, setSaveLesson] = useState(!r);
  const [saved, setSaved] = useState(false);

  const behind = data.goals.filter((g) => g.status === "behind");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await lifeApi("/growth/review", {
        method: "PUT",
        body: { went_well: wentWell, went_badly: wentBadly, lesson, focus: focus.map((f) => f.trim()).filter(Boolean), save_lesson: saveLesson },
      });
      setSaved(true);
      setSaveLesson(false);
      onSaved();
    } catch (err) {
      onError((err as Error).message);
    }
  };

  return (
    <>
      <section className="rounded-2xl border border-border-soft bg-surface p-4">
        <h2 className="text-[15px] font-bold">השבוע של {shortDate(data.week)}</h2>
        <p className="mt-1 text-xs text-muted">
          {behind.length ? `כדאי לתת פוקוס ל: ${behind.map((g) => g.title).join(", ")}.` : "כל היעדים בקצב. לשמור על זה."}
        </p>
        <Link href="/life/chat?preset=review" className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 py-2.5 text-sm font-semibold text-gold-2">
          <MessageCircle className="h-4 w-4" /> לעשות את הסקירה עם המנהל הראשי
        </Link>
      </section>

      <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-border-soft bg-surface p-4">
        <h2 className="text-[15px] font-bold">או לבד, ב־5 דקות</h2>
        <label className="grid gap-1.5 text-xs text-muted">
          מה הלך טוב השבוע?
          <textarea value={wentWell} onChange={(e) => setWentWell(e.target.value)} rows={2} className={`resize-none ${field}`} />
        </label>
        <label className="grid gap-1.5 text-xs text-muted">
          מה היה קשה או לא הלך?
          <textarea value={wentBadly} onChange={(e) => setWentBadly(e.target.value)} rows={2} className={`resize-none ${field}`} />
        </label>
        <label className="grid gap-1.5 text-xs text-muted">
          הלקח (כלל קצר)
          <input value={lesson} onChange={(e) => setLesson(e.target.value)} placeholder="למשל: שיחות מכירה בבוקר, לפני המיילים" className={field} />
        </label>
        {lesson.trim().length >= 3 && (
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={saveLesson} onChange={(e) => setSaveLesson(e.target.checked)} className="h-4 w-4 accent-[#d4a24e]" />
            לשמור גם ברשימת הלקחים, כדי שיחזור אליי
          </label>
        )}
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-xs text-muted">עד 3 פוקוסים לשבוע (יופיעו במסך היום ובהודעת הבוקר)</legend>
          {focus.map((f, i) => (
            <input
              key={i}
              value={f}
              onChange={(e) => setFocus(focus.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder={["למשל: 3 שיחות מכירה ביום", "למשל: 3 אימונים", "למשל: לישון עד 22:45"][i]}
              aria-label={`פוקוס ${i + 1}`}
              className={field}
            />
          ))}
        </fieldset>
        <button type="submit" className="rounded-xl bg-gold py-2.5 text-sm font-bold text-[#1d1407]">
          {saved ? "נשמר ✓" : r ? "עדכון הסקירה" : "שמירת הסקירה"}
        </button>
      </form>

      <Insights insights={data.insights} />

      {data.pastReviews.length > 0 && (
        <details className="rounded-2xl border border-border-soft bg-surface p-4">
          <summary className="cursor-pointer text-[15px] font-bold">סקירות קודמות ({data.pastReviews.length})</summary>
          <ul className="mt-3 grid grid-cols-1 gap-3">
            {data.pastReviews.map((p) => (
              <PastReview key={p.week} review={p} />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

function PastReview({ review }: { review: WeeklyReview }) {
  return (
    <li className="rounded-xl bg-white/[0.03] p-3 text-sm">
      <p className="mb-1 text-xs text-muted">השבוע של {shortDate(review.week)}</p>
      {review.went_well && <p>✓ {review.went_well}</p>}
      {review.went_badly && <p className="text-muted">✗ {review.went_badly}</p>}
      {review.lesson && <p className="mt-1 text-gold-2">💡 {review.lesson}</p>}
      {review.focus.length > 0 && <p className="mt-1 text-xs text-muted">פוקוס: {review.focus.join(" · ")}</p>}
    </li>
  );
}
