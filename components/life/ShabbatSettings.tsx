"use client";

import { useEffect, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { lifeApi } from "./api";

type Shabbat = {
  city: string | null;
  candle_minutes: number | null;
  checklist: string[];
  cities: { id: string; name: string; candles: number }[];
  preview: { eve: string; title: string; candles: string; end: string } | null;
};

const weekday = (date: string) => new Intl.DateTimeFormat("he-IL", { weekday: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));

/** Lives inside the settings <form>, so every button here is type="button". */
export function ShabbatSettings() {
  const [data, setData] = useState<Shabbat | null>(null);
  const [item, setItem] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    lifeApi<{ shabbat: Shabbat }>("/shabbat")
      .then((d) => setData(d.shabbat))
      .catch((e) => setError((e as Error).message));
  }, []);

  const save = async (patch: Partial<Pick<Shabbat, "city" | "candle_minutes" | "checklist">>) => {
    setError(null);
    try {
      const d = await lifeApi<{ shabbat: Shabbat }>("/shabbat", { method: "PUT", body: patch });
      setData(d.shabbat);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!data) return error ? <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null;
  const city = data.cities.find((c) => c.id === data.city);

  return (
    <section className="rounded-2xl border border-border-soft bg-surface p-4 text-sm" aria-labelledby="shabbat-title">
      <h2 id="shabbat-title" className="mb-1 flex items-center gap-2 text-[15px] font-bold">
        🕯️ שבת {saved && <Check className="h-4 w-4 text-emerald-300" aria-label="נשמר" />}
      </h2>
      <p className="mb-3 text-xs text-muted">בכל יום שישי (וערב חג) ב־10:00 מגיעה בטלגרם הודעה עם זמני הכניסה והיציאה, ורשימת ההכנות לבית. אפשר גם לשלוח לבוט /shabbat.</p>

      <div className="grid grid-cols-1 gap-2.5">
        <label className="flex items-center justify-between gap-3">
          <span>עיר</span>
          <select
            value={data.city ?? ""}
            onChange={(e) => save({ city: e.target.value || null, candle_minutes: null })}
            className="rounded-lg bg-white/5 px-2 py-2 text-sm outline-none"
            aria-label="עיר לזמני שבת"
          >
            <option value="" className="bg-[#0b0d1f]">
              בחר עיר
            </option>
            {data.cities.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#0b0d1f]">
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {city && (
          <label className="flex items-center justify-between gap-3">
            <span>
              הדלקת נרות לפני השקיעה
              <span className="block text-xs text-muted">המנהג ב{city.name}: {city.candles} דקות</span>
            </span>
            <span className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={60}
                value={data.candle_minutes ?? city.candles}
                onChange={(e) => save({ candle_minutes: e.target.value === "" ? null : Number(e.target.value) })}
                className="font-latin w-16 rounded-lg bg-white/5 px-2 py-2 text-center text-sm outline-none"
                aria-label="דקות לפני השקיעה"
              />
              <span className="text-xs text-muted">דק׳</span>
            </span>
          </label>
        )}

        {data.preview && (
          <p className="rounded-xl bg-gold/10 px-3 py-2 text-sm text-gold-2">
            {data.preview.title} הקרובה ({weekday(data.preview.eve)}): כניסה <b className="font-latin">{data.preview.candles}</b> · יציאה{" "}
            <b className="font-latin">{data.preview.end}</b>
          </p>
        )}

        <div className="border-t border-border-soft pt-2.5">
          <p className="mb-1.5 text-xs font-bold text-muted">לפני שבת (מופיע בהודעה)</p>
          <ul className="grid gap-1">
            {data.checklist.map((c, i) => (
              <li key={`${c}-${i}`} className="flex items-center gap-2">
                <span className="text-muted">☐</span>
                <span className="min-w-0 flex-1">{c}</span>
                <button type="button" onClick={() => save({ checklist: data.checklist.filter((_, j) => j !== i) })} aria-label={`הסרת ${c}`} className="rounded p-1 text-muted/60 hover:text-red-300">
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-1.5 flex gap-2">
            <input
              value={item}
              onChange={(e) => setItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (item.trim()) void save({ checklist: [...data.checklist, item.trim()] }).then(() => setItem(""));
                }
              }}
              placeholder="עוד משהו, למשל: להדליק פלטה"
              aria-label="פריט חדש לרשימה"
              className="min-w-0 flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted/60"
            />
            <button
              type="button"
              disabled={!item.trim()}
              onClick={() => save({ checklist: [...data.checklist, item.trim()] }).then(() => setItem(""))}
              aria-label="הוספה לרשימה"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {error && <p className="mt-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
    </section>
  );
}
