"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BellRing,
  Briefcase,
  Cake,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  Gift,
  GraduationCap,
  LayoutGrid,
  Lightbulb,
  ListChecks,
  Loader2,
  NotebookPen,
  Repeat,
  Search,
  ShoppingCart,
  Target,
  Wallet,
  X,
} from "lucide-react";
import { KIND_LABELS, PAGES, searchPages, type SearchKind, type SearchResult } from "@/lib/life/search-index";
import { lifeApi } from "./api";

const KIND_ICON: Record<SearchKind, typeof Search> = {
  page: LayoutGrid,
  day: CalendarDays,
  occasion: Cake,
  task: ListChecks,
  event: CalendarClock,
  recurring: Repeat,
  reminder: Bell,
  idea: Lightbulb,
  lesson: GraduationCap,
  goal: Target,
  lead: BellRing,
  deal: Briefcase,
  gift: Gift,
  shopping: ShoppingCart,
  finance: Wallet,
  review: NotebookPen,
};

const RECENT_KEY = "life-search-recent";
const EXAMPLES = ["יום הולדת", "מחר", "לקחים", "מתנה", "תפילות", "12.10"];
const SHORTCUTS = ["היום שלי", "לו״ז חודשי", "צמיחה: יעדים (חזון 30)", "רעיונות", "גוף", "כספים", "עסק", "זוגיות", "רוח", "רשימת קניות", "מדדים", "הגדרות"];

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  try {
    const next = [q, ...readRecent().filter((x) => x !== q)].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Storage can be blocked (private mode); recent searches are only a convenience.
  }
}

export function SearchView() {
  const [query, setQuery] = useState("");
  const [server, setServer] = useState<{ q: string; results: SearchResult[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Recent searches live in this browser only; read after mount so server and client HTML match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecent(readRecent());
    inputRef.current?.focus();
  }, []);

  // Screens match instantly on the device; everything else comes from the server a moment later.
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const id = window.setTimeout(() => {
      setLoading(true);
      lifeApi<{ results: SearchResult[] }>(`/search?q=${encodeURIComponent(q)}`)
        .then((d) => {
          setServer({ q, results: d.results });
          setError(null);
        })
        .catch((e) => setError((e as Error).message))
        .finally(() => setLoading(false));
    }, 220);
    return () => window.clearTimeout(id);
  }, [query]);

  const q = query.trim();
  const results = useMemo(() => (server && server.q === q ? server.results : searchPages(q)), [server, q]);

  // Groups in order of their best match, so the most relevant kind of thing comes first.
  const groups = useMemo(() => {
    const map = new Map<SearchKind, SearchResult[]>();
    for (const r of results) map.set(r.kind, [...(map.get(r.kind) ?? []), r]);
    return [...map.entries()].sort((a, b) => b[1][0].score - a[1][0].score);
  }, [results]);

  const pick = () => {
    if (q) saveRecent(q);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 pb-2 pt-1 backdrop-blur">
        <label className="flex items-center gap-2 rounded-2xl border border-border-soft bg-surface px-3 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30">
          <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="לחפש הכל: יום הולדת, מתנה, לקח, תאריך…"
            aria-label="חיפוש"
            // The whole box shows focus (gold border and ring); the global outline would draw a
            // second rectangle inside it, and it is unlayered CSS, so only an inline style wins.
            style={{ outline: "none" }}
            className="min-w-0 flex-1 bg-transparent py-3.5 text-base outline-none placeholder:text-muted/70 [&::-webkit-search-cancel-button]:hidden"
          />
          {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" aria-label="מחפש" />}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="ניקוי החיפוש"
              className="shrink-0 rounded-lg p-1 text-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
      </div>

      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {!q ? (
        <>
          {recent.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-bold text-muted">חיפושים אחרונים</h2>
              <div className="flex flex-wrap gap-1.5">
                {recent.map((r) => (
                  <button key={r} type="button" onClick={() => setQuery(r)} className="rounded-full bg-white/5 px-3 py-1.5 text-sm">
                    {r}
                  </button>
                ))}
              </div>
            </section>
          )}
          <section>
            <h2 className="mb-2 text-xs font-bold text-muted">אפשר לחפש למשל</h2>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" onClick={() => setQuery(ex)} className="rounded-full border border-border-soft px-3 py-1.5 text-sm text-muted hover:text-foreground">
                  {ex}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-2 text-xs font-bold text-muted">מעבר מהיר</h2>
            <div className="grid grid-cols-2 gap-2">
              {SHORTCUTS.map((title) => {
                const page = PAGES.find((p) => p.title === title)!;
                return (
                  <Link key={title} href={page.href} className="rounded-2xl border border-border-soft bg-surface p-3 hover:border-gold/30">
                    <span className="block text-sm font-semibold">{page.title}</span>
                    <span className="block truncate text-xs text-muted">{page.subtitle}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      ) : groups.length === 0 ? (
        !loading && (
          <p className="rounded-2xl border border-dashed border-border-soft p-6 text-center text-sm text-muted">
            לא נמצא כלום עבור ״{q}״. נסה מילה אחרת, או תאריך כמו 12.10.
          </p>
        )
      ) : (
        <div className="flex flex-col gap-4" aria-live="polite">
          {groups.map(([kind, items]) => {
            const Icon = KIND_ICON[kind];
            return (
              <section key={kind}>
                <h2 className="mb-1.5 text-xs font-bold text-muted">{KIND_LABELS[kind]}</h2>
                <ul className="grid grid-cols-1 overflow-hidden rounded-2xl border border-border-soft bg-surface">
                  {items.slice(0, 8).map((r) => (
                    <li key={r.key} className="border-b border-border-soft last:border-b-0">
                      <Link href={r.href} onClick={pick} className="flex min-w-0 items-center gap-3 px-3 py-3 hover:bg-white/[0.03]">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-gold-2">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{r.title}</span>
                          {r.subtitle && <span className="block truncate text-xs text-muted">{r.subtitle}</span>}
                        </span>
                        <ChevronLeft className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
