"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MessageCircle, Plus, Trash2 } from "lucide-react";
import type { FinanceSummary } from "@/lib/life/finance";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/life/ops-types";
import { israelToday } from "@/lib/life/time";
import { lifeApi } from "./api";
import { TrendChart } from "./TrendChart";

const ils = (n: number) => `${Math.round(n).toLocaleString("he-IL")} ₪`;

export function FinanceView() {
  const [data, setData] = useState<FinanceSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    lifeApi<{ finance: FinanceSummary }>("/finance")
      .then((d) => setData(d.finance))
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

  const pct = Math.max(0, Math.min(100, data.pct));
  const lastDay = `${data.month}-${String(data.daysInMonth).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">כספים</h1>
          <p className="text-sm text-muted">רווח עסקי מול יעד חודשי</p>
        </div>
        <Link
          href="/life/agent/finance"
          className="flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-sm font-semibold text-gold-2"
        >
          <MessageCircle className="h-4 w-4" /> מנהל הכספים
        </Link>
      </header>

      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <section className="rounded-2xl border border-gold/25 bg-[linear-gradient(135deg,rgba(212,162,78,0.14),rgba(212,162,78,0.03))] p-4">
        <p className="text-xs text-gold-2">רווח מתחילת החודש</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-4xl font-black">{ils(data.profit)}</span>
          <span className="text-sm text-muted">מתוך {ils(data.goal.monthly_goal)}</span>
        </p>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={data.profit}
          aria-valuemin={0}
          aria-valuemax={data.goal.monthly_goal}
          aria-label="התקדמות ליעד החודשי"
        >
          <div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted">
          {data.pct}% מהיעד · נותרו {data.daysLeft} ימים בחודש · נקודת פתיחה: כ־{ils(data.goal.baseline)} בחודש
        </p>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <Tile label="רווח היום" value={ils(data.todayProfit)} />
        <Tile label="צריך ביום ליעד" value={ils(data.neededPerDay)} />
        <Tile label="צפי לסוף החודש" value={ils(data.projection)} tone={data.projection >= data.goal.monthly_goal ? "good" : "behind"} />
        <Tile label="שיווק החודש" value={ils(data.marketing)} hint={`רווח לפני שיווק ${ils(data.profitBeforeMarketing)}`} />
      </div>

      <section className="rounded-2xl border border-border-soft bg-surface p-4">
        <h2 className="mb-1 text-[15px] font-bold">רווח מצטבר החודש</h2>
        <p className="mb-3 text-xs text-muted">הקו האפור: הקצב שמביא ליעד בסוף החודש.</p>
        {data.cumulative.length > 1 ? (
          <TrendChart
            points={data.cumulative}
            label="רווח מצטבר"
            format={(v) => `${Math.round(v / 1000)}K`}
            xEnd={lastDay}
            reference={{ from: 0, to: data.goal.monthly_goal, label: `יעד ${Math.round(data.goal.monthly_goal / 1000)}K` }}
          />
        ) : (
          <p className="text-sm text-muted">הגרף יופיע מהיום השני של החודש.</p>
        )}
      </section>

      <AddEntry onAdded={load} onError={setError} />

      <section className="rounded-2xl border border-border-soft bg-surface p-4">
        <h2 className="mb-2 text-[15px] font-bold">תנועות החודש</h2>
        {data.entries.length === 0 && <p className="text-sm text-muted">עוד אין תנועות החודש.</p>}
        <ul className="grid gap-1">
          {data.entries.map((e) => (
            <li key={e.id} className="flex items-center gap-3 rounded-xl px-1 py-2 text-sm">
              <span className={`w-20 shrink-0 font-bold ${e.kind === "income" ? "text-emerald-300" : "text-rose-300"}`}>
                <bdi dir="ltr">
                  {e.kind === "income" ? "+" : "−"}
                  {Math.round(e.amount).toLocaleString("he-IL")}
                </bdi>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block">
                  {e.category}
                  {e.scope === "personal" && <span className="ms-1.5 text-xs text-muted">(פרטי)</span>}
                </span>
                {e.note && <span className="block truncate text-xs text-muted">{e.note}</span>}
              </span>
              <span className="text-xs text-muted">{e.date.slice(8, 10)}.{e.date.slice(5, 7)}</span>
              <button
                type="button"
                aria-label="מחק תנועה"
                onClick={() =>
                  lifeApi(`/finance/${e.id}`, { method: "DELETE" })
                    .then(load)
                    .catch((err) => setError((err as Error).message))
                }
                className="rounded-lg p-1 text-muted/60 hover:text-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <GoalEditor goal={data.goal} onSaved={load} onError={setError} />
    </div>
  );
}

function Tile({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "good" | "behind" }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-surface p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone === "good" ? "text-emerald-300" : tone === "behind" ? "text-amber-300" : ""}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

function AddEntry({ onAdded, onError }: { onAdded: () => void; onError: (m: string) => void }) {
  const [kind, setKind] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("מכירה");
  const [scope, setScope] = useState<"business" | "personal">("business");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const categories = kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return;
    setBusy(true);
    try {
      await lifeApi("/finance", {
        method: "POST",
        body: { date: israelToday(), kind, amount: value, category, scope, note: note || null },
      });
      setAmount("");
      setNote("");
      onAdded();
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-border-soft bg-surface p-4">
      <h2 className="text-[15px] font-bold">רישום מהיר</h2>
      <div className="grid grid-cols-2 rounded-xl bg-white/5 p-1" role="group" aria-label="סוג">
        {(
          [
            ["income", "הכנסה"],
            ["expense", "הוצאה"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => {
              setKind(k);
              setCategory(k === "income" ? "מכירה" : "שיווק");
            }}
            className={`rounded-lg py-2 text-sm font-semibold ${kind === k ? (k === "income" ? "bg-emerald-500/80 text-white" : "bg-rose-500/80 text-white") : "text-muted"}`}
          >
            {l}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 rounded-xl bg-white/5 px-3">
        <span className="text-muted">₪</span>
        <input
          inputMode="decimal"
          type="number"
          min={0}
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="סכום"
          aria-label="סכום"
          className="w-full bg-transparent py-3 text-lg font-bold outline-none"
        />
      </label>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="קטגוריה">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1.5 text-xs ${category === c ? "bg-white/15 text-foreground" : "bg-white/[0.03] text-muted"}`}
          >
            {c}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={scope === "personal"}
          onClick={() => setScope(scope === "business" ? "personal" : "business")}
          className={`ms-auto rounded-full px-3 py-1.5 text-xs ${scope === "personal" ? "bg-sky-500/20 text-sky-200" : "bg-white/[0.03] text-muted"}`}
        >
          {scope === "personal" ? "פרטי" : "עסקי"}
        </button>
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="הערה (לא חובה), למשל: פיילוט דיבי פלאסט"
        aria-label="הערה"
        className="rounded-xl bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted/70"
      />
      <button type="submit" disabled={busy} className="flex items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-bold text-[#1d1407] disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        רישום
      </button>
    </form>
  );
}

function GoalEditor({ goal, onSaved, onError }: { goal: FinanceSummary["goal"]; onSaved: () => void; onError: (m: string) => void }) {
  const [value, setValue] = useState(goal.monthly_goal.toString());
  return (
    <details className="rounded-2xl border border-border-soft bg-surface p-4">
      <summary className="cursor-pointer text-[15px] font-bold">יעד חודשי</summary>
      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          lifeApi("/finance/goal", { method: "PUT", body: { monthly_goal: Number(value) } })
            .then(onSaved)
            .catch((err) => onError((err as Error).message));
        }}
      >
        <input type="number" value={value} onChange={(e) => setValue(e.target.value)} aria-label="יעד חודשי" className="w-32 rounded-lg bg-white/5 px-3 py-2 text-center text-sm outline-none" />
        <span className="text-sm text-muted">₪ בחודש</span>
        <button type="submit" className="ms-auto rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold">
          שמירה
        </button>
      </form>
    </details>
  );
}
