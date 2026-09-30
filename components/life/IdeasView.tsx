"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Lightbulb, ListChecks, Loader2, Plus } from "lucide-react";
import { IDEA_STATUS_LABELS, type Idea, type IdeaStatus } from "@/lib/life/idea-types";
import { AREA_LABELS } from "@/lib/life/types";
import { lifeApi } from "./api";
import { AREA_STYLE } from "./areas";

const FILTERS: { key: string; label: string; statuses: IdeaStatus[] }[] = [
  { key: "active", label: "פעילים", statuses: ["idea", "exploring", "doing"] },
  { key: "done", label: "הושלמו", statuses: ["done"] },
  { key: "parked", label: "נגנזו", statuses: ["parked"] },
];

export const STATUS_STYLE: Record<IdeaStatus, string> = {
  idea: "border-white/15 bg-white/5 text-slate-300",
  exploring: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  doing: "border-gold/40 bg-gold/10 text-gold-2",
  done: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  parked: "border-white/10 bg-transparent text-muted",
};

export function IdeasView() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [filter, setFilter] = useState("active");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    lifeApi<{ ideas: Idea[] }>("/ideas")
      .then((d) => setIdeas(d.ideas))
      .catch((e) => setError((e as Error).message));
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const d = await lifeApi<{ idea: Idea }>("/ideas", { method: "POST", body: { title } });
      // Straight into the idea, where the details get written.
      router.push(`/life/ideas/${d.idea.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const statuses = FILTERS.find((f) => f.key === filter)!.statuses;
  const shown = ideas?.filter((i) => statuses.includes(i.status)) ?? [];
  const count = (key: string) => ideas?.filter((i) => FILTERS.find((f) => f.key === key)!.statuses.includes(i.status)).length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <Lightbulb className="h-6 w-6 text-gold-2" /> רעיונות
        </h1>
        <p className="text-sm text-muted">מערכות ומוצרים לפתח, ומה שצריך לבדוק בכל אחד</p>
      </header>

      <form onSubmit={add} className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="רעיון חדש, למשל: מערכת מעקב משלוחים"
          aria-label="רעיון חדש"
          className="min-w-0 flex-1 rounded-xl border border-border-soft bg-surface px-3 py-3 text-sm outline-none placeholder:text-muted/70 focus:border-gold/40"
        />
        <button
          type="submit"
          disabled={busy || !title.trim()}
          aria-label="הוספת רעיון"
          className="flex w-12 items-center justify-center rounded-xl bg-gold text-[#1d1407] disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
        </button>
      </form>

      <div role="tablist" aria-label="סינון" className="grid grid-cols-3 rounded-xl bg-white/5 p-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-lg py-2 text-sm font-semibold ${filter === f.key ? "bg-white/15 text-foreground" : "text-muted"}`}
          >
            {f.label} {ideas && <span className="text-xs font-normal text-muted">({count(f.key)})</span>}
          </button>
        ))}
      </div>

      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {!ideas ? (
        !error && (
          <div className="flex min-h-[30svh] items-center justify-center text-muted" role="status">
            <Loader2 className="h-6 w-6 animate-spin" aria-label="טוען" />
          </div>
        )
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border-soft p-6 text-center text-sm text-muted">
          {filter === "active" ? "עוד אין רעיונות. כתוב את הראשון למעלה, או שלח בטלגרם /idea." : "אין כאן כלום עדיין."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-2">
          {shown.map((idea) => {
            const done = idea.steps.filter((s) => s.done).length;
            const preview = idea.notes.split("\n").find((l) => l.trim());
            return (
              <li key={idea.id}>
                <Link
                  href={`/life/ideas/${idea.id}`}
                  className="flex min-w-0 items-center gap-3 rounded-2xl border border-border-soft bg-surface p-3 hover:border-gold/30"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${AREA_STYLE[idea.area].dot}`} aria-label={AREA_LABELS[idea.area]} />
                      <span className="truncate text-[15px] font-bold">{idea.title}</span>
                    </span>
                    {preview && <span className="mt-0.5 block truncate text-xs text-muted">{preview}</span>}
                    <span className="mt-1.5 flex items-center gap-2 text-[11px]">
                      <span className={`rounded-full border px-2 py-0.5 ${STATUS_STYLE[idea.status]}`}>{IDEA_STATUS_LABELS[idea.status]}</span>
                      {idea.steps.length > 0 && (
                        <span className="flex items-center gap-1 text-muted">
                          <ListChecks className="h-3.5 w-3.5" />
                          <bdi dir="ltr">
                            {done}/{idea.steps.length}
                          </bdi>
                        </span>
                      )}
                    </span>
                  </span>
                  <ChevronLeft className="h-4 w-4 shrink-0 text-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
