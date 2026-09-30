"use client";

import { useEffect, useState } from "react";
import { Check, Eraser, Loader2, Plus, Salad, X } from "lucide-react";
import { SHOPPING_CATEGORIES, type ShoppingCategory, type ShoppingItem } from "@/lib/life/body-types";
import { lifeApi } from "./api";

export function ShoppingView() {
  const [items, setItems] = useState<ShoppingItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [qty, setQty] = useState("");
  const [category, setCategory] = useState<ShoppingCategory>("שונות");
  const [busy, setBusy] = useState(false);

  const load = () =>
    lifeApi<{ items: ShoppingItem[] }>("/shopping")
      .then((d) => setItems(d.items))
      .catch((e) => setError((e as Error).message));

  useEffect(() => {
    void load();
  }, []);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (item: ShoppingItem) => {
    setItems((list) => list?.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)) ?? null);
    try {
      await lifeApi(`/shopping/${item.id}`, { method: "PATCH", body: { checked: !item.checked } });
    } catch (e) {
      setError((e as Error).message);
      void load();
    }
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    void run(async () => {
      await lifeApi("/shopping", { method: "POST", body: { items: [{ title, qty: qty || undefined, category }] } });
      setTitle("");
      setQty("");
    });
  };

  if (!items) {
    return error ? (
      <p className="mt-10 rounded-xl bg-red-500/10 p-4 text-sm text-red-300">{error}</p>
    ) : (
      <div className="flex min-h-[60svh] items-center justify-center text-muted" role="status">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      </div>
    );
  }

  const bought = items.filter((i) => i.checked).length;
  const groups = SHOPPING_CATEGORIES.map((cat) => ({ cat, list: items.filter((i) => i.category === cat) })).filter((g) => g.list.length);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">רשימת קניות</h1>
          <p className="text-sm text-muted">{items.length ? `${bought} מתוך ${items.length} בעגלה` : "הרשימה ריקה"}</p>
        </div>
        {bought > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => lifeApi("/shopping", { method: "DELETE" }))}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs text-muted hover:text-foreground"
          >
            <Eraser className="h-4 w-4" /> נקה מה שנקנה
          </button>
        )}
      </header>

      {items.length > 0 && (
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
          <div className="h-full rounded-full bg-gold transition-[width]" style={{ width: `${(bought / items.length) * 100}%` }} />
        </div>
      )}

      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <button
        type="button"
        disabled={busy}
        onClick={() => run(() => lifeApi("/shopping", { method: "POST", body: { fromPlan: true } }))}
        className="flex items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 py-3 text-sm font-semibold text-gold-2 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Salad className="h-4 w-4" />}
        הוסף את קניות השבוע מהתפריט
      </button>

      {groups.map(({ cat, list }) => (
        <section key={cat} className="rounded-2xl border border-border-soft bg-surface p-3">
          <h2 className="mb-1 px-1 text-sm font-bold text-muted">{cat}</h2>
          <ul>
            {list.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-xl px-1 py-2">
                <button
                  type="button"
                  onClick={() => toggle(item)}
                  aria-pressed={item.checked}
                  aria-label={item.checked ? `הוצא את ${item.title} מהעגלה` : `סמן ${item.title} כנקנה`}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                    item.checked ? "border-gold bg-gold text-[#1d1407]" : "border-white/25"
                  }`}
                >
                  {item.checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </button>
                <button
                  type="button"
                  onClick={() => toggle(item)}
                  className={`flex min-w-0 flex-1 items-baseline gap-2 text-start ${item.checked ? "text-muted line-through" : ""}`}
                >
                  {/* Separate flex boxes, so a trailing "5%" in the title and the quantity never merge. */}
                  <span>{item.title}</span>
                  {item.qty && <span className="shrink-0 text-xs text-muted">{item.qty}</span>}
                </button>
                <button
                  type="button"
                  aria-label={`מחק את ${item.title}`}
                  onClick={() => run(() => lifeApi(`/shopping/${item.id}`, { method: "DELETE" }))}
                  className="rounded-lg p-1 text-muted/60 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <form onSubmit={add} className="grid gap-2 rounded-2xl border border-border-soft bg-surface p-3">
        <p className="text-sm font-bold">הוספה ידנית</p>
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="מה לקנות?"
            aria-label="פריט"
            className="min-w-0 flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted/70"
          />
          <input
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="כמות"
            aria-label="כמות"
            className="w-20 rounded-lg bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted/70"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ShoppingCategory)}
            aria-label="קטגוריה"
            className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm outline-none"
          >
            {SHOPPING_CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-[#0b0d1f]">
                {c}
              </option>
            ))}
          </select>
          <button type="submit" disabled={busy} aria-label="הוסף פריט" className="rounded-lg bg-gold px-4 text-[#1d1407] disabled:opacity-60">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
