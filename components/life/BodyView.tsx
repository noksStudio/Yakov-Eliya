"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dumbbell, Footprints, Loader2, MessageCircle, ShoppingCart } from "lucide-react";
import type { BodyPlan, WeightPoint } from "@/lib/life/body";
import { DAY_LABELS, type BodyProfile, type Meal, type Workout } from "@/lib/life/body-types";
import { israelToday } from "@/lib/life/time";
import { lifeApi } from "./api";
import { WeightChart } from "./WeightChart";
import { Bidi } from "./Bidi";

type BodyResponse = { plan: BodyPlan; weights: WeightPoint[]; current: number; bmi: number };

export const KIND_LABEL: Record<Meal["kind"], string> = { dairy: "חלבי", meat: "בשרי", parve: "פרווה" };
const KIND_STYLE: Record<Meal["kind"], string> = {
  dairy: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  meat: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  parve: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("he-IL", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`),
  );
}

export function BodyView() {
  const router = useRouter();
  const [data, setData] = useState<BodyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"meals" | "workouts">("meals");
  const [day, setDay] = useState(() => new Date().getDay());
  const [adding, setAdding] = useState(false);

  const load = () =>
    lifeApi<BodyResponse>("/body")
      .then(setData)
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

  const { plan, weights, current } = data;
  const { profile } = plan;
  const change = Math.round((current - profile.start_weight) * 10) / 10;
  const toGoal = Math.max(0, Math.round((current - profile.goal_weight) * 10) / 10);
  const today = israelToday();
  const daysToStart = Math.max(0, Math.round((Date.parse(profile.plan_start) - Date.parse(today)) / 86_400_000));

  const addShopping = async () => {
    setAdding(true);
    try {
      await lifeApi("/shopping", { method: "POST", body: { fromPlan: true } });
      router.push("/life/shopping");
    } catch (e) {
      setError((e as Error).message);
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">גוף</h1>
          <p className="text-sm text-muted">תזונה, אימונים ומשקל</p>
        </div>
        <Link
          href="/life/coach"
          className="flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-sm font-semibold text-gold-2"
        >
          <MessageCircle className="h-4 w-4" /> מאמן הגוף
        </Link>
      </header>

      {daysToStart > 0 && (
        <div className="rounded-2xl border border-gold/25 bg-[linear-gradient(135deg,rgba(212,162,78,0.16),rgba(212,162,78,0.03))] p-4">
          <p className="text-xs font-medium text-gold-2">התוכנית מתחילה בעוד {daysToStart === 1 ? "יום אחד" : `${daysToStart} ימים`}</p>
          <p className="mt-1 text-lg font-black">{formatDate(profile.plan_start)}</p>
          <p className="mt-1 text-sm text-muted">עד אז: לעשות קניות, להכין קופסאות אחסון ולבחור שעת אימון קבועה.</p>
        </div>
      )}

      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="grid grid-cols-2 gap-2">
        <Stat label="משקל נוכחי" value={`${current}`} unit="ק״ג" />
        <Stat
          label="שינוי מההתחלה"
          value={`${change > 0 ? "+" : ""}${change}`}
          unit="ק״ג"
          tone={change < 0 ? "good" : change > 0 ? "bad" : undefined}
        />
        <Stat label="BMI" value={`${data.bmi}`} />
        <Stat label={`יעד שלב 1 · ${profile.goal_weight} ק״ג`} value={`${toGoal}`} unit="ק״ג נותרו" />
      </div>

      <section className="rounded-2xl border border-border-soft bg-surface p-4">
        <h2 className="mb-1 text-[15px] font-bold">מגמת משקל</h2>
        <p className="mb-3 text-xs text-muted">שוקלים בבוקר, בצ׳ק־אין. מה שחשוב הוא הממוצע השבועי.</p>
        <WeightChart points={weights} goal={profile.goal_weight} />
        {weights.length < 2 && <p className="mt-2 text-xs text-muted">אחרי כמה שקילות תופיע כאן המגמה.</p>}
      </section>

      <section className="grid grid-cols-2 gap-2 text-sm">
        <Target label="קלוריות ביום" value={`~${profile.calories.toLocaleString("he-IL")}`} />
        <Target label="חלבון ביום" value={`~${profile.protein} גרם`} />
        <Target label="מים" value="2.5–3 ליטר" />
        <Target label="שינה" value="7.5–8 שעות" />
      </section>

      <div className="grid grid-cols-2 rounded-xl bg-white/5 p-1" role="tablist" aria-label="תוכנית">
        {(
          [
            ["meals", "תפריט"],
            ["workouts", "אימונים"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${tab === key ? "bg-gold text-[#1d1407]" : "text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "meals" ? (
        <MealsTab plan={plan} day={day} setDay={setDay} onShopping={addShopping} adding={adding} />
      ) : (
        <WorkoutsTab plan={plan} />
      )}

      <ProfileEditor profile={profile} onSaved={load} onError={setError} />
    </div>
  );
}

function Stat({ label, value, unit, tone }: { label: string; value: string; unit?: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-surface p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className={`font-latin text-2xl font-semibold ${tone === "good" ? "text-emerald-300" : tone === "bad" ? "text-rose-300" : ""}`} dir="ltr">
          {value}
        </span>
        {unit && <span className="text-xs text-muted">{unit}</span>}
      </p>
    </div>
  );
}

function Target({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] px-3 py-2">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-semibold">
        <Bidi text={value} />
      </p>
    </div>
  );
}

const DAY_SHORT = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

function DayPicker({ day, setDay }: { day: number; setDay: (d: number) => void }) {
  return (
    <div className="grid grid-cols-7 gap-1" role="group" aria-label="יום בשבוע">
      {DAY_LABELS.map((label, i) => (
        <button
          key={label}
          type="button"
          aria-pressed={day === i}
          aria-label={label}
          onClick={() => setDay(i)}
          className={`rounded-lg py-2 text-sm font-bold ${day === i ? "bg-white/15 text-foreground" : "bg-white/[0.03] text-muted"}`}
        >
          {DAY_SHORT[i]}
        </button>
      ))}
    </div>
  );
}

export function MealCard({ meal }: { meal: Meal }) {
  return (
    <div className="rounded-xl border border-border-soft bg-white/[0.03] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold">
          {meal.label} <span className="font-latin text-sm font-medium text-muted">{meal.time}</span>
        </p>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] ${KIND_STYLE[meal.kind]}`}>{KIND_LABEL[meal.kind]}</span>
      </div>
      <ul className="mt-2 grid gap-1 text-sm text-foreground/90">
        {meal.items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" />
            <span>
              <Bidi text={item} />
            </span>
          </li>
        ))}
      </ul>
      {(meal.kcal || meal.protein) && (
        <p className="mt-2 text-xs text-muted">
          {meal.kcal ? `~${meal.kcal} קל׳` : ""}
          {meal.kcal && meal.protein ? " · " : ""}
          {meal.protein ? `${meal.protein} גרם חלבון` : ""}
        </p>
      )}
    </div>
  );
}

function MealsTab({
  plan,
  day,
  setDay,
  onShopping,
  adding,
}: {
  plan: BodyPlan;
  day: number;
  setDay: (d: number) => void;
  onShopping: () => void;
  adding: boolean;
}) {
  const meals = plan.meals.days.find((d) => d.day === day)?.meals ?? [];
  return (
    <section className="flex flex-col gap-3">
      <DayPicker day={day} setDay={setDay} />
      {day === 6 ? (
        <div className="rounded-xl border border-gold/25 bg-gold/5 p-4">
          <p className="mb-2 font-bold text-gold-2">שבת</p>
          <ul className="grid gap-1.5 text-sm">
            {plan.meals.shabbat.map((line) => (
              <li key={line}>
                <Bidi text={line} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        meals.map((meal) => <MealCard key={`${meal.label}-${meal.time}`} meal={meal} />)
      )}

      <details className="rounded-xl border border-border-soft bg-surface p-3">
        <summary className="cursor-pointer text-sm font-bold">כללי התפריט</summary>
        <ul className="mt-2 grid gap-1.5 text-sm text-foreground/90">
          {plan.meals.rules.map((rule) => (
            <li key={rule}>
              <Bidi text={rule} />
            </li>
          ))}
        </ul>
      </details>

      <button
        type="button"
        onClick={onShopping}
        disabled={adding}
        className="flex items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-bold text-[#1d1407] disabled:opacity-60"
      >
        {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
        הוסף את קניות השבוע לרשימה
      </button>
    </section>
  );
}

function WorkoutCard({ workout }: { workout: Workout }) {
  return (
    <div className="rounded-xl border border-border-soft bg-white/[0.03] p-3">
      <p className="font-bold">
        {workout.title} <span className="text-sm font-medium text-muted">· {workout.minutes} דק׳</span>
      </p>
      {workout.warmup && <p className="mt-1 text-xs text-muted">חימום: {workout.warmup}</p>}
      <ol className="mt-2 grid gap-2">
        {workout.exercises.map((ex, i) => (
          <li key={ex.name} className="flex gap-2.5 text-sm">
            <span className="font-latin mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px]">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="font-semibold">{ex.name}</span>
                <span className="text-xs text-gold-2">
                  <Bidi text={ex.sets} />
                </span>
              </span>
              {ex.note && (
                <span className="block text-xs text-muted">
                  <Bidi text={ex.note} />
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
      {workout.finisher && <p className="mt-2 text-xs text-muted">סיום: {workout.finisher}</p>}
    </div>
  );
}

function WorkoutsTab({ plan }: { plan: BodyPlan }) {
  const { workouts } = plan;
  return (
    <section className="flex flex-col gap-3">
      <div className="rounded-xl border border-border-soft bg-surface p-3">
        <p className="mb-2 text-sm font-bold">השבוע</p>
        <ul className="grid gap-1.5 text-sm">
          {workouts.schedule.map((slot) => {
            const w = slot.workout ? workouts.workouts.find((x) => x.key === slot.workout) : null;
            return (
              <li key={slot.day} className="flex items-center gap-2">
                <span className="w-14 text-muted">{DAY_LABELS[slot.day]}</span>
                {w ? <Dumbbell className="h-4 w-4 text-gold-2" /> : <Footprints className="h-4 w-4 text-emerald-300" />}
                <span className="flex-1">{w ? w.title : `${slot.activity} · ${slot.minutes} דק׳`}</span>
                <span className="font-latin text-xs text-muted">{slot.time}</span>
              </li>
            );
          })}
          <li className="flex items-center gap-2 text-muted">
            <span className="w-14">שבת</span>
            <span>מנוחה</span>
          </li>
        </ul>
      </div>
      {workouts.workouts.map((w) => (
        <WorkoutCard key={w.key} workout={w} />
      ))}
      <div className="rounded-xl bg-white/[0.03] p-3 text-sm">
        <p>
          <span className="font-bold">צעדים: </span>
          <Bidi text={workouts.steps} />
        </p>
        <p className="mt-1.5">
          <span className="font-bold">התקדמות: </span>
          <Bidi text={workouts.progression} />
        </p>
      </div>
    </section>
  );
}

function ProfileEditor({ profile, onSaved, onError }: { profile: BodyProfile; onSaved: () => void; onError: (m: string) => void }) {
  const [draft, setDraft] = useState(profile);
  const [saving, setSaving] = useState(false);
  const num = (key: keyof BodyProfile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft({ ...draft, [key]: e.target.value === "" ? null : Number(e.target.value) });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await lifeApi("/body/profile", { method: "PUT", body: draft });
      onSaved();
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const field = "font-latin w-24 rounded-lg bg-white/5 px-3 py-2 text-center text-sm outline-none";
  return (
    <details className="rounded-2xl border border-border-soft bg-surface p-4">
      <summary className="cursor-pointer text-[15px] font-bold">פרופיל ויעדים</summary>
      <form onSubmit={save} className="mt-3 grid gap-2.5 text-sm">
        {(
          [
            ["age", "גיל", 1],
            ["height_cm", "גובה (ס״מ)", 1],
            ["goal_weight", "יעד שלב 1 (ק״ג)", 0.5],
            ["calories", "קלוריות ביום", 50],
            ["protein", "חלבון ביום (גרם)", 5],
          ] as const
        ).map(([key, label, step]) => (
          <label key={key} className="flex items-center justify-between gap-3">
            <span>{label}</span>
            <input type="number" step={step} value={draft[key] ?? ""} onChange={num(key)} className={field} />
          </label>
        ))}
        <label className="flex items-center justify-between gap-3">
          <span>תחילת התוכנית</span>
          <input
            type="date"
            value={draft.plan_start}
            onChange={(e) => setDraft({ ...draft, plan_start: e.target.value })}
            className="font-latin rounded-lg bg-white/5 px-3 py-2 text-sm outline-none"
          />
        </label>
        <button type="submit" disabled={saving} className="mt-1 rounded-xl bg-white/10 py-2.5 font-semibold disabled:opacity-60">
          {saving ? "שומר…" : "שמירת פרופיל"}
        </button>
      </form>
    </details>
  );
}
