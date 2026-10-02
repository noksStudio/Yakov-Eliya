"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, Loader2, MessageCircle, Minus, Plus, Trash2, UserPlus } from "lucide-react";
import type { Guest, GuestStatus } from "@/lib/life/guests";
import type { LifeEvent, Task } from "@/lib/life/types";
import { intlPhone } from "@/lib/life/lead-types";
import { hebrewDateLabel, israelToday } from "@/lib/life/time";
import { lifeApi } from "./api";

type Data = { event: LifeEvent; tasks: Task[]; invite_text: string | null; guests: Guest[] };

const STATUS: { key: Exclude<GuestStatus, "todo">; label: string; on: string }[] = [
  { key: "yes", label: "✓ מגיע", on: "bg-emerald-500/25 text-emerald-200 border-emerald-400/40" },
  { key: "invited", label: "?", on: "bg-amber-400/20 text-amber-100 border-amber-400/40" },
  { key: "no", label: "✗ לא", on: "bg-red-500/20 text-red-200 border-red-400/40" },
];
const ORDER: Record<GuestStatus, number> = { todo: 0, invited: 1, yes: 2, no: 3 };

const weekday = (date: string) => new Intl.DateTimeFormat("he-IL", { weekday: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
const daysUntil = (date: string, today: string) => Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000);

/** The WhatsApp link for one guest: their chat when the phone is known, otherwise a contact picker. */
function inviteLink(guest: Guest, text: string | null, event: LifeEvent) {
  const body = (text ?? `היי {שם}! נשמח לראות אותך ב${event.title}, ${weekday(event.date)} ${Number(event.date.slice(8, 10))}.${Number(event.date.slice(5, 7))} ב־${event.start_time}. אפשר לעדכן אותי אם מגיעים? 🙏`).replaceAll(
    "{שם}",
    guest.name.split(" ")[0],
  );
  const phone = intlPhone(guest.phone);
  return `https://wa.me/${phone ?? ""}?text=${encodeURIComponent(body)}`;
}

export function EventView({ id }: { id: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = israelToday();

  const load = useCallback(
    () =>
      lifeApi<Data>(`/events/${id}`)
        .then(setData)
        .catch((e) => setError((e as Error).message)),
    [id],
  );
  useEffect(() => {
    void load();
  }, [load]);

  if (!data) {
    return error ? (
      <p className="mt-10 rounded-xl bg-red-500/10 p-4 text-sm text-red-300">{error === "לא נמצא" ? "האירוע לא נמצא. אולי נמחק?" : error}</p>
    ) : (
      <div className="flex min-h-[60svh] items-center justify-center text-muted" role="status">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="טוען" />
      </div>
    );
  }

  const { event } = data;
  const left = daysUntil(event.date, today);
  const guestsApi = (path: string, method: string, body?: unknown) =>
    lifeApi<{ invite_text: string | null; guests: Guest[] }>(`/events/${id}/guests${path}`, { method, body })
      .then((d) => setData((cur) => (cur ? { ...cur, guests: d.guests } : cur)))
      .catch((e) => setError((e as Error).message));

  return (
    <div className="flex flex-col gap-4">
      <Link href={`/life?v=week&date=${event.date}`} className="flex w-fit items-center gap-1 text-xs text-muted">
        <ChevronLeft className="h-3.5 w-3.5 rotate-180" /> לו״ז השבוע
      </Link>
      <header>
        <h1 className="text-2xl font-black leading-tight">{event.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {weekday(event.date)}, {Number(event.date.slice(8, 10))}.{Number(event.date.slice(5, 7))} · {hebrewDateLabel(event.date)} ·{" "}
          <bdi dir="ltr" className="font-latin">
            {event.start_time}
            {event.end_time ? `–${event.end_time}` : ""}
          </bdi>
        </p>
        <p className="mt-1 text-sm font-semibold text-gold-2">{left > 1 ? `עוד ${left} ימים` : left === 1 ? "מחר" : left === 0 ? "היום!" : "עבר"}</p>
      </header>
      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <PrepTasks event={event} tasks={data.tasks} onChange={load} onError={setError} />
      <Guests data={data} onApi={guestsApi} />
      <InviteText id={id} data={data} onSaved={(invite_text) => setData((cur) => (cur ? { ...cur, invite_text } : cur))} onError={setError} />
    </div>
  );
}

function PrepTasks({ event, tasks, onChange, onError }: { event: LifeEvent; tasks: Task[]; onChange: () => void; onError: (m: string) => void }) {
  const [title, setTitle] = useState("");
  const toggle = (t: Task) =>
    lifeApi(`/tasks/${t.id}`, { method: "PATCH", body: { done: !t.done } })
      .then(onChange)
      .catch((e) => onError((e as Error).message));
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await lifeApi("/tasks", { method: "POST", body: { title, event_id: event.id, area: event.area } });
      setTitle("");
      onChange();
    } catch (err) {
      onError((err as Error).message);
    }
  };
  return (
    <section className="rounded-2xl border border-border-soft bg-surface p-4" aria-labelledby="prep-title">
      <h2 id="prep-title" className="mb-2 text-[15px] font-bold">
        הכנות {tasks.length > 0 && <span className="text-xs font-normal text-muted">({tasks.filter((t) => t.done).length}/{tasks.length})</span>}
      </h2>
      <ul className="grid gap-1.5">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-2.5 text-sm">
            <button
              type="button"
              onClick={() => toggle(t)}
              aria-pressed={t.done}
              aria-label={t.done ? `בטל סימון ${t.title}` : `סמן ${t.title} כבוצע`}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${t.done ? "border-gold bg-gold text-[#1d1407]" : "border-white/25"}`}
            >
              {t.done && <Check className="h-3 w-3" strokeWidth={3} />}
            </button>
            <span className={t.done ? "text-muted line-through" : ""}>{t.title}</span>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-2 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="הכנה נוספת, למשל: לקנות חליפה"
          aria-label="הכנה נוספת"
          className="min-w-0 flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted/60"
        />
        <button type="submit" aria-label="הוספת הכנה" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
          <Plus className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}

function Guests({ data, onApi }: { data: Data; onApi: (path: string, method: string, body?: unknown) => Promise<void> }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const guests = [...data.guests].sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.name.localeCompare(b.name, "he"));
  const coming = data.guests.filter((g) => g.status === "yes").reduce((n, g) => n + g.count, 0);
  const count = (s: GuestStatus) => data.guests.filter((g) => g.status === s).length;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onApi("", "POST", { name, phone: phone || null });
    setName("");
    setPhone("");
  };

  return (
    <section className="rounded-2xl border border-border-soft bg-surface p-4" aria-labelledby="guests-title">
      <h2 id="guests-title" className="mb-2 text-[15px] font-bold">
        מוזמנים שלי
      </h2>
      {data.guests.length > 0 && (
        <div className="mb-3 grid grid-cols-4 gap-1.5 text-center text-xs">
          <span className="rounded-lg bg-emerald-500/15 py-1.5 text-emerald-200">
            <b className="block text-base">{coming}</b>מגיעים
          </span>
          <span className="rounded-lg bg-amber-400/15 py-1.5 text-amber-100">
            <b className="block text-base">{count("invited")}</b>לא ענו
          </span>
          <span className="rounded-lg bg-red-500/15 py-1.5 text-red-200">
            <b className="block text-base">{count("no")}</b>לא מגיעים
          </span>
          <span className="rounded-lg bg-white/5 py-1.5 text-muted">
            <b className="block text-base text-foreground">{count("todo")}</b>להזמין
          </span>
        </div>
      )}

      <ul className="grid grid-cols-1 gap-2">
        {guests.map((g) => (
          <li key={g.id} className="rounded-xl border border-border-soft bg-white/[0.03] p-2.5">
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{g.name}</span>
                {g.phone && <bdi className="font-latin text-xs text-muted">{g.phone}</bdi>}
              </span>
              {g.status === "yes" && (
                <span className="flex items-center gap-1 text-xs text-muted" aria-label={`${g.count} אנשים`}>
                  <button type="button" disabled={g.count <= 1} onClick={() => onApi(`/${g.id}`, "PATCH", { count: g.count - 1 })} aria-label="פחות אנשים" className="rounded p-1 disabled:opacity-30">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-4 text-center text-sm text-foreground">{g.count}</span>
                  <button type="button" onClick={() => onApi(`/${g.id}`, "PATCH", { count: g.count + 1 })} aria-label="עוד אנשים" className="rounded p-1">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              <a
                href={inviteLink(g, data.invite_text, data.event)}
                target="_blank"
                rel="noreferrer"
                // Sending the invitation counts as invited (the "?" until they answer).
                onClick={() => g.status === "todo" && void onApi(`/${g.id}`, "PATCH", { status: "invited" })}
                aria-label={`הזמנה בוואטסאפ ל${g.name}`}
                className={`flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold ${g.status === "todo" ? "bg-[#25D366] text-[#05300f]" : "bg-[#25D366]/15 text-[#7ee2a4]"}`}
              >
                <MessageCircle className="h-4 w-4" />
                {g.status === "todo" ? "להזמין" : ""}
              </a>
              <button type="button" onClick={() => onApi(`/${g.id}`, "DELETE")} aria-label={`הסרת ${g.name}`} className="rounded-lg p-1.5 text-muted/60 hover:text-red-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5" role="group" aria-label={`מה ${g.name} ענה`}>
              {STATUS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={g.status === s.key}
                  onClick={() => onApi(`/${g.id}`, "PATCH", { status: g.status === s.key ? "todo" : s.key })}
                  className={`rounded-lg border py-1.5 text-xs font-semibold ${g.status === s.key ? s.on : "border-border-soft text-muted"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="mt-3 grid gap-2">
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם" aria-label="שם המוזמן" className="min-w-0 flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted/60" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="טלפון (לא חובה)" aria-label="טלפון המוזמן" className="font-latin w-36 rounded-lg bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted/60" />
        </div>
        <button type="submit" disabled={!name.trim()} className="flex items-center justify-center gap-1.5 rounded-lg bg-gold py-2 text-sm font-bold text-[#1d1407] disabled:opacity-50">
          <UserPlus className="h-4 w-4" /> הוספת מוזמן
        </button>
      </form>
      <p className="mt-2 text-xs text-muted">״להזמין״ פותח וואטסאפ עם הודעה מוכנה. אחרי ששלחת, הוא מסומן ״?״ עד שיענה.</p>
    </section>
  );
}

function InviteText({ id, data, onSaved, onError }: { id: string; data: Data; onSaved: (t: string | null) => void; onError: (m: string) => void }) {
  const [text, setText] = useState(data.invite_text ?? "");
  const [saved, setSaved] = useState(false);
  const save = async () => {
    try {
      const d = await lifeApi<{ invite_text: string | null }>(`/events/${id}`, { method: "PUT", body: { invite_text: text || null } });
      onSaved(d.invite_text);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      onError((e as Error).message);
    }
  };
  return (
    <details className="rounded-2xl border border-border-soft bg-surface/60 p-4 text-sm">
      <summary className="cursor-pointer font-semibold">נוסח ההזמנה בוואטסאפ</summary>
      <p className="mt-2 text-xs text-muted">{"{שם}"} מתחלף בשם הפרטי של כל מוזמן.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={7}
        aria-label="נוסח ההזמנה"
        className="mt-2 w-full resize-y rounded-lg bg-white/5 px-3 py-2 text-sm outline-none"
      />
      <button type="button" onClick={save} className="mt-2 flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold">
        {saved && <Check className="h-3.5 w-3.5" />} {saved ? "נשמר" : "שמירת הנוסח"}
      </button>
    </details>
  );
}
