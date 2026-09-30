"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarHeart, ExternalLink, Gift, Heart, Loader2, MessageCircle, Plus, Sparkles, Trash2, X } from "lucide-react";
import {
  GIFT_STATUSES,
  GIFT_STATUS_LABELS,
  occasionLabel,
  type CoupleProfile,
  type Gift as GiftItem,
  type GiftStatus,
  type Occasion,
  type SpecialDate,
} from "@/lib/life/couple-types";
import { gregorianLabel } from "@/lib/life/time";
import { lifeApi } from "./api";

type Summary = { profile: CoupleProfile; gifts: GiftItem[]; dates: SpecialDate[]; upcoming: Occasion[] };

const field = "w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted/70";
const GIFT_STYLE: Record<GiftStatus, string> = {
  idea: "border-white/15 bg-white/5 text-slate-300",
  bought: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  given: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
};

export function CoupleView() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    lifeApi<{ couple: Summary }>("/couple")
      .then((d) => setData(d.couple))
      .catch((e) => setError((e as Error).message));

  useEffect(() => {
    void load();
  }, []);

  if (!data) {
    return error ? (
      <p className="mt-10 rounded-xl bg-red-500/10 p-4 text-sm text-red-300">{error}</p>
    ) : (
      <div className="flex min-h-[60svh] items-center justify-center text-muted" role="status">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="טוען" />
      </div>
    );
  }

  const name = data.profile.partner_name;
  const act = (fn: () => Promise<unknown>) =>
    fn()
      .then(load)
      .catch((e) => setError((e as Error).message));

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black">
            <Heart className="h-6 w-6 text-rose-400" /> זוגיות
          </h1>
          <p className="text-sm text-muted">{name ? `הכל על ${name}: תאריכים, מתנות ומה שהיא אוהבת` : "תאריכים, מתנות ומה שחשוב לה"}</p>
        </div>
        <Link
          href="/life/agent/couple"
          className="flex shrink-0 items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-200"
        >
          <MessageCircle className="h-4 w-4" /> היועץ הזוגי
        </Link>
      </header>

      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {!name && (
        <p className="rounded-2xl border border-rose-400/25 bg-rose-500/5 p-4 text-sm text-rose-100">
          התחל מלמטה ב״עליה״: שם, יום הולדת, יום נישואין ומה היא אוהבת. מזה היועץ יודע להציע מתנות ולהזכיר בזמן.
        </p>
      )}

      <Upcoming upcoming={data.upcoming} />

      <div className="grid grid-cols-2 gap-2">
        {[
          { preset: "today", title: "לשמח אותה היום", hint: "מחווה קטנה אחת" },
          { preset: "date", title: "רעיון לדייט", hint: "ולהכניס ללו״ז" },
          { preset: "gift", title: "לבחור מתנה", hint: "3 רעיונות שמתאימים לה" },
          { preset: "birthday", title: "לתכנן יום הולדת", hint: "הכנות בזמן" },
        ].map((q) => (
          <Link
            key={q.preset}
            href={`/life/agent/couple?preset=${q.preset}`}
            className="rounded-2xl border border-border-soft bg-surface p-3 text-sm font-semibold hover:border-rose-400/30"
          >
            {q.title}
            <span className="mt-0.5 block text-xs font-normal text-muted">{q.hint}</span>
          </Link>
        ))}
      </div>

      <Gifts gifts={data.gifts} onAct={act} onError={setError} />
      <ProfileEditor profile={data.profile} onSaved={setData} onError={setError} />
      <SpecialDates dates={data.dates} onAct={act} />
    </div>
  );
}

function Upcoming({ upcoming }: { upcoming: Occasion[] }) {
  if (!upcoming.length) return null;
  return (
    <section className="rounded-2xl border border-border-soft bg-surface p-4">
      <h2 className="mb-3 flex items-center gap-2 text-[15px] font-bold">
        <CalendarHeart className="h-4 w-4 text-rose-400" /> תאריכים קרובים
      </h2>
      <ul className="grid grid-cols-1 gap-2">
        {upcoming.slice(0, 4).map((o) => (
          <li key={o.key} className="flex items-center gap-3">
            <span
              className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl ${
                o.daysLeft <= 14 ? "bg-rose-500/20 text-rose-200" : "bg-white/5 text-muted"
              }`}
            >
              <span className="text-lg font-black leading-none">{o.daysLeft === 0 ? "🎂" : o.daysLeft}</span>
              {o.daysLeft > 0 && <span className="text-[10px] leading-none">{o.daysLeft === 1 ? "יום" : "ימים"}</span>}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{occasionLabel(o)}</span>
              <span className="text-xs text-muted">{o.daysLeft === 0 ? "היום!" : o.daysLeft === 1 ? "מחר" : gregorianLabel(o.date)}</span>
            </span>
            {o.daysLeft <= 30 && o.kind !== "custom" && (
              <Link href="/life/agent/couple?preset=birthday" className="shrink-0 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-rose-200">
                לתכנן
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Gifts({ gifts, onAct, onError }: { gifts: GiftItem[]; onAct: (fn: () => Promise<unknown>) => void; onError: (m: string) => void }) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [occasion, setOccasion] = useState("");
  const open = gifts.filter((g) => g.status !== "given");
  const given = gifts.filter((g) => g.status === "given");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await lifeApi("/couple/gifts", {
        method: "POST",
        body: { title, price: price ? Number(price) : null, occasion: occasion || null },
      });
      setTitle("");
      setPrice("");
      setOccasion("");
      onAct(async () => {});
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const nextStatus = (s: GiftStatus) => GIFT_STATUSES[(GIFT_STATUSES.indexOf(s) + 1) % GIFT_STATUSES.length];

  const row = (g: GiftItem) => (
    <li key={g.id} className="flex items-center gap-2 py-1.5 text-sm">
      <button
        type="button"
        onClick={() => onAct(() => lifeApi(`/couple/gifts/${g.id}`, { method: "PATCH", body: { status: nextStatus(g.status) } }))}
        aria-label={`${g.title}: ${GIFT_STATUS_LABELS[g.status]}. לחץ לשינוי`}
        className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${GIFT_STYLE[g.status]}`}
      >
        {GIFT_STATUS_LABELS[g.status]}
      </button>
      <span className="min-w-0 flex-1">
        <span className="block truncate">{g.title}</span>
        {(g.occasion || g.price !== null) && (
          <span className="block truncate text-xs text-muted">
            {[g.occasion, g.price !== null ? `כ־${g.price.toLocaleString("he-IL")} ₪` : null].filter(Boolean).join(" · ")}
          </span>
        )}
      </span>
      {g.link && (
        <a href={g.link} target="_blank" rel="noreferrer" aria-label={`קישור ל${g.title}`} className="shrink-0 rounded-lg p-1 text-muted hover:text-foreground">
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
      <button
        type="button"
        onClick={() => onAct(() => lifeApi(`/couple/gifts/${g.id}`, { method: "DELETE" }))}
        aria-label={`מחק ${g.title}`}
        className="shrink-0 rounded-lg p-1 text-muted/60 hover:text-foreground"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );

  return (
    <section className="rounded-2xl border border-border-soft bg-surface p-4">
      <h2 className="mb-1 flex items-center gap-2 text-[15px] font-bold">
        <Gift className="h-4 w-4 text-rose-400" /> רעיונות למתנות
      </h2>
      <p className="mb-2 text-xs text-muted">כל פעם שהיא מזכירה משהו שהיא רוצה, לרשום כאן. לחיצה על הסטטוס מעבירה: רעיון ← נקנה ← ניתן.</p>
      {open.length > 0 && <ul className="grid grid-cols-1">{open.map(row)}</ul>}
      <form onSubmit={add} className="mt-2 grid gap-2 border-t border-border-soft pt-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="מה? למשל: שרשרת עם השם של הילדים" aria-label="רעיון למתנה" className={field} />
        <div className="grid grid-cols-[1fr_6rem_auto] gap-2">
          <input value={occasion} onChange={(e) => setOccasion(e.target.value)} placeholder="לאיזה אירוע?" aria-label="הזדמנות" className={field} />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="₪"
            aria-label="מחיר משוער"
            className={field}
          />
          <button type="submit" aria-label="הוספת מתנה" className="flex w-10 items-center justify-center rounded-xl bg-rose-500/80 text-white">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </form>
      {given.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-muted">מתנות שכבר ניתנו ({given.length})</summary>
          <ul className="mt-1 grid grid-cols-1">{given.map(row)}</ul>
        </details>
      )}
    </section>
  );
}

function ChipsInput({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [text, setText] = useState("");
  const add = () => {
    const v = text.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setText("");
  };
  return (
    <div className="grid gap-1.5">
      <span className="text-xs text-muted">{label}</span>
      {values.length > 0 && (
        <span className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span key={v} className="flex items-center gap-1 rounded-full bg-white/5 py-1 pe-1.5 ps-2.5 text-xs">
              {v}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`הסר ${v}`} className="text-muted hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </span>
      )}
      <span className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          aria-label={label}
          className={field}
        />
        <button type="button" onClick={add} aria-label={`הוסף ל${label}`} className="flex w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
          <Plus className="h-4 w-4" />
        </button>
      </span>
    </div>
  );
}

function ProfileEditor({ profile, onSaved, onError }: { profile: CoupleProfile; onSaved: (s: Summary) => void; onError: (m: string) => void }) {
  const [p, setP] = useState(profile);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof CoupleProfile>(key: K, value: CoupleProfile[K]) => {
    setP({ ...p, [key]: value });
    setSaved(false);
  };
  const text = (v: string) => (v.trim() ? v : null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const d = await lifeApi<{ couple: Summary }>("/couple", { method: "PUT", body: { profile: p } });
      onSaved(d.couple);
      setSaved(true);
    } catch (err) {
      onError((err as Error).message);
    }
  };

  return (
    <details className="rounded-2xl border border-border-soft bg-surface p-4" open={!profile.partner_name}>
      <summary className="flex cursor-pointer items-center gap-2 text-[15px] font-bold">
        <Sparkles className="h-4 w-4 text-rose-400" /> עליה
      </summary>
      <form onSubmit={save} className="mt-3 grid gap-3">
        <label className="grid gap-1.5 text-xs text-muted">
          שם
          <input value={p.partner_name ?? ""} onChange={(e) => set("partner_name", text(e.target.value))} className={field} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1.5 text-xs text-muted">
            יום הולדת
            <input type="date" value={p.birthday ?? ""} onChange={(e) => set("birthday", e.target.value || null)} className={`font-latin ${field}`} />
          </label>
          <label className="grid gap-1.5 text-xs text-muted">
            יום נישואין
            <input type="date" value={p.anniversary ?? ""} onChange={(e) => set("anniversary", e.target.value || null)} className={`font-latin ${field}`} />
          </label>
        </div>
        <ChipsInput label="מה היא אוהבת" values={p.likes} onChange={(v) => set("likes", v)} placeholder="פרחים, בישול, טיולים בטבע…" />
        <ChipsInput label="מה היא לא אוהבת" values={p.dislikes} onChange={(v) => set("dislikes", v)} placeholder="הפתעות גדולות, בשמים חזקים…" />
        <label className="grid gap-1.5 text-xs text-muted">
          מה גורם לה להרגיש אהובה
          <input value={p.love_language ?? ""} onChange={(e) => set("love_language", text(e.target.value))} placeholder="מילים טובות, זמן ביחד, עזרה בבית…" className={field} />
        </label>
        <div className="grid grid-cols-[1fr_7rem] gap-2">
          <label className="grid gap-1.5 text-xs text-muted">
            מידות
            <input value={p.sizes ?? ""} onChange={(e) => set("sizes", text(e.target.value))} placeholder="בגדים M, נעליים 38…" className={field} />
          </label>
          <label className="grid gap-1.5 text-xs text-muted">
            תקציב למתנה
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={p.gift_budget ?? ""}
              onChange={(e) => set("gift_budget", e.target.value ? Number(e.target.value) : null)}
              placeholder="₪"
              className={field}
            />
          </label>
        </div>
        <label className="grid gap-1.5 text-xs text-muted">
          הערות
          <textarea value={p.notes ?? ""} onChange={(e) => set("notes", text(e.target.value))} rows={3} className={`resize-none ${field}`} />
        </label>
        <button type="submit" className="rounded-xl bg-rose-500/80 py-2.5 text-sm font-bold text-white">
          {saved ? "נשמר ✓" : "שמירה"}
        </button>
      </form>
    </details>
  );
}

function SpecialDates({ dates, onAct }: { dates: SpecialDate[]; onAct: (fn: () => Promise<unknown>) => void }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [yearly, setYearly] = useState(true);
  return (
    <details className="rounded-2xl border border-border-soft bg-surface p-4">
      <summary className="flex cursor-pointer items-center gap-2 text-[15px] font-bold">
        <CalendarHeart className="h-4 w-4 text-rose-400" /> תאריכים נוספים{dates.length ? ` (${dates.length})` : ""}
      </summary>
      <p className="mt-1 text-xs text-muted">ימי הולדת של ההורים שלה, הפגישה הראשונה, כל מה שכדאי לזכור.</p>
      {dates.length > 0 && (
        <ul className="mt-2 grid grid-cols-1 gap-1">
          {dates.map((d) => (
            <li key={d.id} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{d.title}</span>
              <span className="shrink-0 text-xs text-muted">
                <bdi dir="ltr">{d.date.split("-").reverse().join(".")}</bdi>
                {d.yearly && " · כל שנה"}
              </span>
              <button
                type="button"
                onClick={() => onAct(() => lifeApi(`/couple/dates/${d.id}`, { method: "DELETE" }))}
                aria-label={`מחק ${d.title}`}
                className="shrink-0 rounded-lg p-1 text-muted/60 hover:text-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || !date) return;
          onAct(async () => {
            await lifeApi("/couple/dates", { method: "POST", body: { title, date, yearly } });
            setTitle("");
            setDate("");
          });
        }}
        className="mt-3 grid gap-2 border-t border-border-soft pt-3"
      >
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="מה? למשל: יום ההולדת של אמא שלה" aria-label="שם התאריך" className={field} />
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="תאריך" className={`font-latin ${field}`} />
          <label className="flex items-center gap-1.5 text-xs text-muted">
            <input type="checkbox" checked={yearly} onChange={(e) => setYearly(e.target.checked)} className="h-4 w-4 accent-rose-500" />
            כל שנה
          </label>
          <button type="submit" aria-label="הוספת תאריך" className="flex w-10 items-center justify-center rounded-xl bg-white/10 py-2">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </form>
    </details>
  );
}
