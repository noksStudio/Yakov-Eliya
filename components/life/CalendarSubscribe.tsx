"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Check, Copy, Loader2 } from "lucide-react";
import type { CalItemKind } from "@/lib/life/calendar";
import { lifeApi } from "./api";

type Calendar = { feed: string; kinds: { kind: CalItemKind; label: string; default: boolean }[] };

/** Subscribe the iPhone (or Google) calendar to the schedule. */
export function CalendarSubscribe() {
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [picked, setPicked] = useState<CalItemKind[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    lifeApi<{ calendar: Calendar }>("/calendar-feed")
      .then((d) => setCalendar(d.calendar))
      .catch((e) => setError((e as Error).message));
  }, []);

  if (!calendar) {
    return error ? <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null;
  }

  const kinds = picked ?? calendar.kinds.filter((k) => k.default).map((k) => k.kind);
  const isDefault = calendar.kinds.every((k) => k.default === kinds.includes(k.kind));
  // Kinds in the fixed list order, so the same choice always gives the same link.
  const query = isDefault ? "" : `?k=${calendar.kinds.filter((k) => kinds.includes(k.kind)).map((k) => k.kind).join(",")}`;
  const https = `${calendar.feed}${query}`;
  const webcal = https.replace(/^https?:\/\//, "webcal://");

  const toggle = (kind: CalItemKind) => {
    setPicked(kinds.includes(kind) ? kinds.filter((k) => k !== kind) : [...kinds, kind]);
  };

  const copy = () => {
    void navigator.clipboard
      .writeText(https)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  const rotate = async () => {
    if (!window.confirm("לאפס את הקישור? היומן שכבר מחובר יפסיק להתעדכן, וצריך יהיה לחבר מחדש.")) return;
    setRotating(true);
    try {
      setCalendar((await lifeApi<{ calendar: Calendar }>("/calendar-feed", { method: "POST", body: { action: "rotate" } })).calendar);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRotating(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border-soft bg-surface p-4 text-sm" aria-labelledby="calendar-title">
      <h2 id="calendar-title" className="mb-1 flex items-center gap-2 text-[15px] font-bold">
        <CalendarPlus className="h-4 w-4 text-gold-2" /> יומן באייפון
      </h2>
      <p className="mb-3 text-xs text-muted">הלו״ז מופיע ביומן של הטלפון ומתעדכן לבד. בוחרים מה להציג:</p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {calendar.kinds.map((k) => {
          const on = kinds.includes(k.kind);
          return (
            <button
              key={k.kind}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(k.kind)}
              className={`rounded-full border px-2.5 py-1 text-xs ${on ? "border-gold/50 bg-gold/15 text-foreground" : "border-border-soft text-muted"}`}
            >
              {on && "✓ "}
              {k.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-2">
        <a href={webcal} className={`flex items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-sm font-bold text-[#1d1407] ${kinds.length ? "" : "pointer-events-none opacity-50"}`}>
          <CalendarPlus className="h-4 w-4" /> הוספה ליומן באייפון
        </a>
        <div className="flex gap-2">
          <button type="button" onClick={copy} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/10 py-2.5 text-xs font-semibold">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "הועתק" : "העתקת הקישור"}
          </button>
          <a
            href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center rounded-xl bg-white/10 py-2.5 text-xs font-semibold"
          >
            Google Calendar
          </a>
        </div>
      </div>

      <details className="mt-3 text-xs text-muted">
        <summary className="cursor-pointer">הכפתור לא עבד? חיבור ידני</summary>
        <ol className="mt-2 grid list-decimal gap-1 ps-5 leading-relaxed">
          <li>לוחצים ״העתקת הקישור״.</li>
          <li>באייפון: הגדרות ← יומן ← חשבונות ← הוספת חשבון ← אחר ← הוספת יומן מנוי.</li>
          <li>מדביקים את הקישור ← הבא ← שמירה.</li>
        </ol>
        <p className="mt-2">האייפון מרענן את היומן בערך פעם בשעה. הקישור פרטי: מי שמחזיק בו רואה את הלו״ז.</p>
        <button type="button" onClick={rotate} disabled={rotating} className="mt-2 flex items-center gap-1.5 text-red-300 underline disabled:opacity-60">
          {rotating && <Loader2 className="h-3 w-3 animate-spin" />} איפוס הקישור
        </button>
      </details>
      {error && <p className="mt-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
    </section>
  );
}
