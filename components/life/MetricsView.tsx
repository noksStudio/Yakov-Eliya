"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Flame, Loader2 } from "lucide-react";
import type { Metric, MetricStatus } from "@/lib/life/metrics";
import { lifeApi } from "./api";
import { Sparkline } from "./TrendChart";

const STATUS: Record<MetricStatus, { label: string; chip: string }> = {
  good: { label: "בקצב", chip: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" },
  behind: { label: "בפיגור", chip: "border-amber-400/30 bg-amber-400/10 text-amber-200" },
  due: { label: "לעדכון היום", chip: "border-sky-400/30 bg-sky-400/10 text-sky-200" },
  neutral: { label: "", chip: "" },
};

export function MetricsView() {
  const [metrics, setMetrics] = useState<Metric[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    lifeApi<{ metrics: Metric[] }>("/metrics")
      .then((d) => setMetrics(d.metrics))
      .catch((e) => setError((e as Error).message));
  }, []);

  if (!metrics) {
    return error ? (
      <p className="mt-10 rounded-xl bg-red-500/10 p-4 text-sm text-red-300">{error}</p>
    ) : (
      <div className="flex min-h-[60svh] items-center justify-center text-muted" role="status">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      </div>
    );
  }

  const due = metrics.filter((m) => m.status === "due");

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-black">מדדים</h1>
        <p className="text-sm text-muted">כל היעדים במקום אחד</p>
      </header>

      {due.length > 0 && (
        <p className="rounded-xl border border-sky-400/25 bg-sky-400/10 px-3 py-2 text-sm text-sky-100">
          לעדכון היום: {due.map((m) => m.label).join(" · ")}
        </p>
      )}

      <div className="grid gap-2">
        {metrics.map((m) => (
          <MetricCard key={m.key} metric={m} />
        ))}
      </div>
    </div>
  );
}

export function MetricCard({ metric: m }: { metric: Metric }) {
  const status = STATUS[m.status];
  return (
    <Link href={m.href} className="flex items-center gap-3 rounded-2xl border border-border-soft bg-surface p-3 transition-colors hover:border-gold/30">
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold">{m.label}</span>
          {status.label && <span className={`rounded-full border px-2 py-0.5 text-[10px] ${status.chip}`}>{status.label}</span>}
        </span>
        <span className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl font-bold">{m.value}</span>
          <span className="text-xs text-muted">יעד {m.target}</span>
        </span>
        {m.note && <span className="mt-0.5 block text-xs text-muted">{m.note}</span>}
        <span className="mt-1 flex items-center gap-2 text-[11px] text-muted">
          <span>{m.owner}</span>
          {m.streak ? (
            <span className="flex items-center gap-0.5 text-gold-2">
              <Flame className="h-3 w-3" /> רצף {m.streak}
            </span>
          ) : null}
        </span>
      </span>
      {m.series && m.series.length > 1 && <Sparkline points={m.series} label={m.label} />}
      <ChevronLeft className="h-4 w-4 shrink-0 text-muted" />
    </Link>
  );
}
