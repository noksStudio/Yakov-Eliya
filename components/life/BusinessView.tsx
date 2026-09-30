"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlarmClock, ChevronDown, Loader2, MessageCircle, Minus, Plus, Trash2 } from "lucide-react";
import type { BusinessSummary } from "@/lib/life/business";
import {
  ACTIVITY_KEYS,
  ACTIVITY_LABELS,
  ACTIVITY_TARGETS,
  DEAL_STAGES,
  DEAL_STAGE_LABELS,
  OPEN_STAGES,
  type ActivityKey,
  type Deal,
  type DealStage,
} from "@/lib/life/ops-types";
import { lifeApi } from "./api";

const ils = (n: number) => `${Math.round(n).toLocaleString("he-IL")} ₪`;
const shortDate = (d: string) => `${Number(d.slice(8, 10))}.${Number(d.slice(5, 7))}`;

export function BusinessView() {
  const [data, setData] = useState<BusinessSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    lifeApi<{ business: BusinessSummary }>("/business")
      .then((d) => setData(d.business))
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

  const closed = data.deals.filter((d) => !OPEN_STAGES.includes(d.stage));

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">עסק</h1>
          <p className="text-sm text-muted">מכירות, עסקאות ופולואפים</p>
        </div>
        <Link
          href="/life/agent/business"
          className="flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-sm font-semibold text-gold-2"
        >
          <MessageCircle className="h-4 w-4" /> מנהל העסק
        </Link>
      </header>

      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-border-soft bg-surface p-3">
          <p className="text-xs text-muted">צינור פתוח</p>
          <p className="mt-1 text-xl font-bold">{ils(data.openValue)}</p>
          <p className="text-[11px] text-muted">{data.openCount} עסקאות</p>
        </div>
        <div className="rounded-2xl border border-border-soft bg-surface p-3">
          <p className="text-xs text-muted">נסגר החודש</p>
          <p className="mt-1 text-xl font-bold">{ils(data.wonThisMonth)}</p>
        </div>
      </div>

      <ActivityCounters data={data} onChange={setData} onError={setError} />

      {data.due.length > 0 && (
        <section className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
          <h2 className="mb-2 flex items-center gap-2 text-[15px] font-bold text-amber-100">
            <AlarmClock className="h-4 w-4" /> פולואפים להיום
          </h2>
          <ul className="grid gap-1.5 text-sm">
            {data.due.map((d) => (
              <li key={d.id}>
                <span className="font-semibold">{d.name}</span>
                {d.next_action && <span className="text-amber-100/80"> · {d.next_action}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-[15px] font-bold">עסקאות פתוחות</h2>
        {OPEN_STAGES.map((stage) => {
          const deals = data.deals.filter((d) => d.stage === stage);
          if (!deals.length) return null;
          return (
            <div key={stage}>
              <p className="mb-1.5 flex items-center justify-between text-xs text-muted">
                <span>{DEAL_STAGE_LABELS[stage]}</span>
                <span>{ils(deals.reduce((s, d) => s + (d.value ?? 0), 0))}</span>
              </p>
              <div className="grid gap-2">
                {deals.map((d) => (
                  <DealCard key={d.id} deal={d} onChange={load} onError={setError} />
                ))}
              </div>
            </div>
          );
        })}
        {data.openCount === 0 && <p className="text-sm text-muted">אין עסקאות פתוחות. הוסף ליד ראשון.</p>}
      </section>

      <AddDeal onAdded={load} onError={setError} />

      {closed.length > 0 && (
        <details className="rounded-2xl border border-border-soft bg-surface p-4">
          <summary className="cursor-pointer text-[15px] font-bold">סגורות ולא רלוונטיות ({closed.length})</summary>
          <div className="mt-3 grid gap-2">
            {closed.map((d) => (
              <DealCard key={d.id} deal={d} onChange={load} onError={setError} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function ActivityCounters({
  data,
  onChange,
  onError,
}: {
  data: BusinessSummary;
  onChange: (d: BusinessSummary) => void;
  onError: (m: string) => void;
}) {
  const bump = async (key: ActivityKey, delta: number) => {
    const next = { ...data.activity, [key]: Math.max(0, data.activity[key] + delta) };
    onChange({
      ...data,
      activity: next,
      activityDone: next.connections + next.followups + next.calls,
    });
    try {
      await lifeApi("/activity", { method: "PUT", body: { deltas: { [key]: delta } } });
    } catch (e) {
      onError((e as Error).message);
    }
  };

  return (
    <section className="rounded-2xl border border-border-soft bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-bold">פעילות מכירה היום</h2>
        <span className="text-xs text-muted">
          {data.activityDone}/{data.activityTarget}
        </span>
      </div>
      <div className="grid gap-3">
        {ACTIVITY_KEYS.map((key) => {
          const value = data.activity[key];
          const target = ACTIVITY_TARGETS[key];
          const pct = target ? Math.min(100, (value / target) * 100) : 0;
          return (
            <div key={key}>
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 text-sm">
                  {ACTIVITY_LABELS[key]}
                  <span className="ms-1.5 text-xs text-muted">
                    {value}
                    {target ? `/${target}` : ""}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={`הפחת ${ACTIVITY_LABELS[key]}`}
                  onClick={() => bump(key, -1)}
                  disabled={value === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-muted disabled:opacity-30"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={`הוסף ${ACTIVITY_LABELS[key]}`}
                  onClick={() => bump(key, 1)}
                  className="flex h-8 w-10 items-center justify-center rounded-lg bg-gold text-[#1d1407]"
                >
                  <Plus className="h-4 w-4" />
                </button>
                {target >= 10 && (
                  <button
                    type="button"
                    aria-label={`הוסף 5 ${ACTIVITY_LABELS[key]}`}
                    onClick={() => bump(key, 5)}
                    className="h-8 rounded-lg bg-white/10 px-2 text-xs font-semibold"
                  >
                    <bdi dir="ltr">+5</bdi>
                  </button>
                )}
              </div>
              {target > 0 && (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
                  <div className={`h-full rounded-full ${pct >= 100 ? "bg-emerald-400" : "bg-gold"}`} style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DealCard({ deal, onChange, onError }: { deal: Deal; onChange: () => void; onError: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(deal);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await lifeApi(`/deals/${deal.id}`, {
        method: "PATCH",
        body: {
          stage: draft.stage,
          value: draft.value,
          next_action: draft.next_action || null,
          next_date: draft.next_date || null,
          notes: draft.notes || null,
          contact: draft.contact || null,
        },
      });
      setOpen(false);
      onChange();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border-soft bg-white/[0.03]">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-start gap-3 px-3 py-2.5 text-start">
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="font-semibold">{deal.name}</span>
            {deal.value !== null && <span className="text-sm text-gold-2">{ils(deal.value)}</span>}
          </span>
          {deal.next_action && (
            <span className="mt-0.5 block text-xs text-muted">
              {deal.next_date && <span className="font-semibold">{shortDate(deal.next_date)} · </span>}
              {deal.next_action}
            </span>
          )}
        </span>
        <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="grid gap-2 border-t border-border-soft p-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs text-muted">
              שלב
              <select
                value={draft.stage}
                onChange={(e) => setDraft({ ...draft, stage: e.target.value as DealStage })}
                className="rounded-lg bg-white/5 px-2 py-2 text-sm text-foreground outline-none"
              >
                {DEAL_STAGES.map((s) => (
                  <option key={s} value={s} className="bg-[#0b0d1f]">
                    {DEAL_STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted">
              שווי (₪)
              <input
                type="number"
                value={draft.value ?? ""}
                onChange={(e) => setDraft({ ...draft, value: e.target.value === "" ? null : Number(e.target.value) })}
                className="rounded-lg bg-white/5 px-2 py-2 text-sm text-foreground outline-none"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-xs text-muted">
            הצעד הבא
            <input
              value={draft.next_action ?? ""}
              onChange={(e) => setDraft({ ...draft, next_action: e.target.value })}
              className="rounded-lg bg-white/5 px-2 py-2 text-sm text-foreground outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            מתי
            <input
              type="date"
              value={draft.next_date ?? ""}
              onChange={(e) => setDraft({ ...draft, next_date: e.target.value || null })}
              className="rounded-lg bg-white/5 px-2 py-2 text-sm text-foreground outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            הערות
            <textarea
              value={draft.notes ?? ""}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              rows={3}
              className="resize-none rounded-lg bg-white/5 px-2 py-2 text-sm text-foreground outline-none"
            />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={saving} className="flex-1 rounded-lg bg-gold py-2 text-sm font-bold text-[#1d1407] disabled:opacity-60">
              {saving ? "שומר…" : "שמירה"}
            </button>
            <button
              type="button"
              aria-label={`מחק את ${deal.name}`}
              onClick={() =>
                lifeApi(`/deals/${deal.id}`, { method: "DELETE" })
                  .then(onChange)
                  .catch((e) => onError((e as Error).message))
              }
              className="rounded-lg bg-white/5 px-3 text-muted hover:text-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddDeal({ onAdded, onError }: { onAdded: () => void; onError: (m: string) => void }) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [next, setNext] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await lifeApi("/deals", {
        method: "POST",
        body: { name, value: value ? Number(value) : null, next_action: next || null, stage: "lead" },
      });
      setName("");
      setValue("");
      setNext("");
      onAdded();
    } catch (err) {
      onError((err as Error).message);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-2 rounded-2xl border border-border-soft bg-surface p-4">
      <h2 className="text-[15px] font-bold">ליד חדש</h2>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="שם החברה או איש הקשר"
          aria-label="שם"
          className="min-w-0 flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted/70"
        />
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="שווי ₪"
          aria-label="שווי משוער"
          className="w-24 rounded-lg bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted/70"
        />
      </div>
      <input
        value={next}
        onChange={(e) => setNext(e.target.value)}
        placeholder="הצעד הבא, למשל: לשלוח הודעת היכרות"
        aria-label="הצעד הבא"
        className="rounded-lg bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted/70"
      />
      <button type="submit" className="flex items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-sm font-bold text-[#1d1407]">
        <Plus className="h-4 w-4" /> הוספה
      </button>
    </form>
  );
}
