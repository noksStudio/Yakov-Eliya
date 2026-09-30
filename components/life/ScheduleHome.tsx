"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MonthView, WeekView } from "./CalendarViews";
import { TodayView } from "./TodayView";

const VIEWS = [
  { key: "day", label: "יום" },
  { key: "week", label: "שבוע" },
  { key: "month", label: "חודש" },
] as const;
type View = (typeof VIEWS)[number]["key"];

/** The schedule home: day, week or month, kept in ?v= so back/refresh stay on the same view. */
export function ScheduleHome() {
  const params = useSearchParams();
  const router = useRouter();
  const raw = params.get("v");
  const view: View = raw === "week" || raw === "month" ? raw : "day";
  const dateParam = params.get("date");
  const focusDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="תצוגת לו״ז" className="grid grid-cols-3 rounded-xl bg-white/5 p-1">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            role="tab"
            aria-selected={view === v.key}
            onClick={() => router.replace(v.key === "day" ? "/life" : `/life?v=${v.key}`, { scroll: false })}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
              view === v.key ? "bg-gold text-[#1d1407]" : "text-muted hover:text-foreground"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
      {/* Keyed by the date so a new ?date= (from search) re-opens the view on it. */}
      {view === "day" ? <TodayView /> : view === "week" ? <WeekView key={focusDate} focusDate={focusDate} /> : <MonthView key={focusDate} focusDate={focusDate} />}
    </div>
  );
}
