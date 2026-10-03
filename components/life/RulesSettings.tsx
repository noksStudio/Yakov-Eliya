"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import { RULE_AREA_LABELS, RULE_AREAS, type RuleInfo, type RulePlace } from "@/lib/life/rule-types";
import { lifeApi } from "./api";

const PLACE_LABELS: Record<RulePlace, string> = { today: "מסך היום", morning: "הודעת הבוקר", assistant: "העוזר" };

/** Every rule, what it checks and where it speaks up, with an on/off switch. */
export function RulesSettings() {
  const [rules, setRules] = useState<RuleInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    lifeApi<{ rules: RuleInfo[] }>("/rules")
      .then((d) => setRules(d.rules))
      .catch((e) => setError((e as Error).message));
  }, []);

  const toggle = async (id: string, enabled: boolean) => {
    setRules((rs) => rs?.map((r) => (r.id === id ? { ...r, enabled } : r)) ?? null);
    try {
      setRules((await lifeApi<{ rules: RuleInfo[] }>("/rules", { method: "PUT", body: { id, enabled } })).rules);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Link href="/life/settings" className="flex w-fit items-center gap-1 text-xs text-muted">
        <ChevronLeft className="h-3.5 w-3.5 rotate-180" /> הגדרות
      </Link>
      <header>
        <h1 className="text-2xl font-black">החוקים של המערכת</h1>
        <p className="mt-1 text-sm text-muted">
          במקום AI: כל חוק בודק את הנתונים שלך, וכשהתנאי מתקיים מופיעה המלצה עם צעד הבא. רוצה חוק חדש? תגיד בצ׳אט ״אם X אז תזכיר לי Y״, ואני אוסיף.
        </p>
      </header>
      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {!rules ? (
        <Loader2 className="mx-auto mt-6 h-6 w-6 animate-spin text-muted" aria-label="טוען" />
      ) : (
        RULE_AREAS.map((area) => {
          const list = rules.filter((r) => r.area === area);
          if (!list.length) return null;
          return (
            <section key={area} className="rounded-2xl border border-border-soft bg-surface p-4" aria-labelledby={`rules-${area}`}>
              <h2 id={`rules-${area}`} className="mb-2 text-[15px] font-bold">
                {RULE_AREA_LABELS[area]}
              </h2>
              <ul className="grid gap-1">
                {list.map((r) => (
                  <li key={r.id}>
                    <label className="flex items-start justify-between gap-3 py-1.5 text-sm">
                      <span className={`min-w-0 ${r.enabled ? "" : "opacity-50"}`}>
                        <span className="block font-semibold">{r.title}</span>
                        <span className="block text-xs text-muted">{r.when}</span>
                        <span className="block text-[11px] text-muted/80">מופיע ב: {r.places.map((p) => PLACE_LABELS[p]).join(" · ")}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={r.enabled}
                        onChange={(e) => toggle(r.id, e.target.checked)}
                        className="mt-1 h-5 w-5 shrink-0 accent-[#d4a24e]"
                        aria-label={`${r.title}: ${r.enabled ? "פעיל" : "כבוי"}`}
                      />
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
