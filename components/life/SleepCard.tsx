"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Moon, Sun } from "lucide-react";
import { fromMinutes, toMinutes } from "@/lib/life/time";
import { lifeApi } from "./api";
import { LIFE_CHANGED } from "./QuickCapture";

type Sleep = {
  bedtime: string;
  windDown: string;
  wake: string;
  targetHours: number;
  asleep_at: string | null;
  since: string | null;
  last: { date: string; hours: number } | null;
};

const hours = (h: number) => {
  const whole = Math.floor(h);
  const min = Math.round((h - whole) * 60);
  return min === 30 ? `${whole}.5 שעות` : min ? `${whole} שעות ו־${min} דק׳` : `${whole} שעות`;
};

/**
 * Night: "הולך לישון" (from an hour before the wind-down until 04:00). Asleep: "קמתי", which
 * records the night's hours. A morning with nothing tapped at night: "קמתי" with when he went to
 * sleep. The morning after: how long he slept, until noon.
 */
export function SleepCard({ date, now }: { date: string; now: string }) {
  const [sleep, setSleep] = useState<Sleep | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    lifeApi<{ sleep: Sleep }>("/sleep")
      .then((d) => setSleep(d.sleep))
      .catch(() => setSleep(null));
  }, []);
  useEffect(load, [load]);

  const act = async (action: "sleep" | "wake", slept_at?: string) => {
    setBusy(true);
    setError(null);
    try {
      const d = await lifeApi<{ sleep: Sleep }>("/sleep", { method: "POST", body: { action, slept_at } });
      setSleep(d.sleep);
      window.dispatchEvent(new Event(LIFE_CHANGED));
    } catch (e) {
      setError((e as Error).message);
      load();
    } finally {
      setBusy(false);
    }
  };

  if (!sleep) return null;
  const minutes = toMinutes(now);
  const night = minutes >= toMinutes(sleep.windDown) - 60 || minutes < toMinutes("04:00");
  const late = minutes >= toMinutes(sleep.bedtime) || minutes < toMinutes("04:00");
  const button = "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-60";

  if (sleep.asleep_at) {
    return (
      <section className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-300/20 bg-indigo-400/[0.07] p-4" aria-label="שינה">
        <span className="text-sm">
          <span className="block font-bold">😴 ישן מאז {sleep.since}</span>
          <span className="text-xs text-muted">כשקמים לוחצים, והשעות נרשמות לבד</span>
        </span>
        <button type="button" onClick={() => act("wake")} disabled={busy} className={`${button} shrink-0 bg-gold text-[#1d1407]`}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sun className="h-4 w-4" />} קמתי
        </button>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </section>
    );
  }

  if (night) {
    return (
      <section className="grid gap-2 rounded-2xl border border-indigo-300/20 bg-indigo-400/[0.07] p-4" aria-label="שינה">
        <p className="text-sm">
          <span className="block font-bold">{late ? "🌙 הגיע הזמן לישון" : `🌙 שעת השינה: ${sleep.bedtime}`}</span>
          <span className="text-xs text-muted">
            {hours(sleep.targetHours)} עד הקימה ב־{sleep.wake}
          </span>
        </p>
        <button type="button" onClick={() => act("sleep")} disabled={busy} className={`${button} bg-indigo-400/25 text-indigo-50`}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Moon className="h-4 w-4" />} הולך לישון
        </button>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </section>
    );
  }

  const morning = minutes >= toMinutes("04:00") && minutes < toMinutes("12:00");
  if (morning && sleep.last?.date !== date) {
    // Times around the planned bedtime, for the night "הולך לישון" was not tapped.
    const bed = toMinutes(sleep.bedtime);
    const choices = [-60, -30, 0, 30, 60, 90, 120].map((d) => fromMinutes((bed + d + 1440) % 1440));
    return (
      <section className="grid gap-2.5 rounded-2xl border border-amber-300/20 bg-amber-400/[0.06] p-4" aria-label="שינה">
        <p className="text-sm">
          <span className="block font-bold">☀️ בוקר טוב! קמתי, והלכתי לישון ב־</span>
          <span className="text-xs text-muted">בוחרים את השעה, והשעות נרשמות לבד</span>
        </p>
        <div className="flex flex-wrap gap-2" dir="ltr">
          {choices.map((t) => (
            <button key={t} type="button" onClick={() => act("wake", t)} disabled={busy} className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold tabular-nums disabled:opacity-60">
              {t}
            </button>
          ))}
        </div>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </section>
    );
  }

  if (sleep.last?.date === date && morning) {
    const ok = sleep.last.hours >= sleep.targetHours - 0.25;
    return (
      <p className={`rounded-2xl border px-4 py-2.5 text-sm ${ok ? "border-emerald-400/25 bg-emerald-400/[0.06]" : "border-amber-400/25 bg-amber-400/[0.06]"}`}>
        😴 ישנת <b>{hours(sleep.last.hours)}</b>
        {ok ? " · יופי" : ` · היעד ${hours(sleep.targetHours)}. הערב לישון ב־${sleep.bedtime}`}
      </p>
    );
  }
  return null;
}
