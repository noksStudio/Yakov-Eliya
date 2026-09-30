"use client";

import { useMemo, useState } from "react";

// Single-series trend line (dark surface, validated line colour), with an optional straight
// reference line (e.g. the pace needed to reach a monthly goal), hover/keyboard crosshair and a
// hidden table view. Text uses text tokens, never the series colour.
const LINE = "#bb8632";
const W = 340;
const H = 170;
const PAD = { top: 14, right: 12, bottom: 22, left: 44 };

export type TrendPoint = { date: string; value: number };

function shortDate(date: string) {
  const [, m, d] = date.split("-");
  return `${Number(d)}.${Number(m)}`;
}

export function TrendChart({
  points,
  label,
  format,
  xEnd,
  reference,
}: {
  points: TrendPoint[];
  label: string;
  format: (v: number) => string;
  /** Last date of the x axis (defaults to the last point). */
  xEnd?: string;
  /** Reference line from (first date, from) to (xEnd, to). */
  reference?: { from: number; to: number; label: string };
}) {
  const [active, setActive] = useState<number | null>(null);
  const endDate = xEnd ?? points.at(-1)!.date;

  const geo = useMemo(() => {
    const values = [...points.map((p) => p.value), ...(reference ? [reference.from, reference.to] : []), 0];
    const lo = Math.min(...values);
    const hi = Math.max(...values, lo + 1);
    const t0 = Date.parse(points[0].date);
    const span = Math.max(Date.parse(endDate) - t0, 86_400_000);
    const x = (date: string) => PAD.left + ((Date.parse(date) - t0) / span) * (W - PAD.left - PAD.right);
    const y = (v: number) => PAD.top + ((hi - v) / (hi - lo)) * (H - PAD.top - PAD.bottom);
    const ticks = [lo, lo + (hi - lo) / 2, hi];
    return { x, y, ticks };
  }, [points, reference, endDate]);

  const path = points.map((p, i) => `${i ? "L" : "M"}${geo.x(p.date).toFixed(1)},${geo.y(p.value).toFixed(1)}`).join("");
  const last = points.at(-1)!;
  const shown = active === null ? null : points[active];

  const nearest = (clientX: number, rect: DOMRect) => {
    const px = ((clientX - rect.left) / rect.width) * W;
    let best = 0;
    points.forEach((p, i) => {
      if (Math.abs(geo.x(p.date) - px) < Math.abs(geo.x(points[best].date) - px)) best = i;
    });
    return best;
  };

  return (
    <figure className="relative" dir="ltr">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none outline-none"
        role="img"
        aria-label={`${label}: ${format(last.value)} ב־${shortDate(last.date)}`}
        tabIndex={0}
        onPointerMove={(e) => setActive(nearest(e.clientX, e.currentTarget.getBoundingClientRect()))}
        onPointerLeave={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? points.length) - 1));
          if (e.key === "ArrowRight") setActive((a) => Math.min(points.length - 1, (a ?? -1) + 1));
        }}
        onBlur={() => setActive(null)}
      >
        {geo.ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={geo.y(t)} y2={geo.y(t)} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
            <text x={PAD.left - 6} y={geo.y(t) + 3.5} textAnchor="end" className="fill-muted text-[10px] tabular-nums">
              {format(t)}
            </text>
          </g>
        ))}

        {reference && (
          <>
            <line
              x1={geo.x(points[0].date)}
              y1={geo.y(reference.from)}
              x2={geo.x(endDate)}
              y2={geo.y(reference.to)}
              stroke="rgba(158,160,194,0.55)"
              strokeWidth={1}
            />
            <text x={W - PAD.right} y={geo.y(reference.to) - 5} textAnchor="end" className="fill-muted text-[10px]">
              {reference.label}
            </text>
          </>
        )}

        <path d={path} fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={geo.x(last.date)} cy={geo.y(last.value)} r={4.5} fill={LINE} stroke="#0b0c18" strokeWidth={2} />

        <text x={PAD.left} y={H - 6} className="fill-muted text-[10px]">
          {shortDate(points[0].date)}
        </text>
        <text x={W - PAD.right} y={H - 6} textAnchor="end" className="fill-muted text-[10px]">
          {shortDate(endDate)}
        </text>

        {shown && (
          <g pointerEvents="none">
            <line x1={geo.x(shown.date)} x2={geo.x(shown.date)} y1={PAD.top} y2={H - PAD.bottom} stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
            <circle cx={geo.x(shown.date)} cy={geo.y(shown.value)} r={4.5} fill={LINE} stroke="#0b0c18" strokeWidth={2} />
          </g>
        )}
      </svg>

      {shown && (
        <div
          className="pointer-events-none absolute top-0 rounded-lg border border-border-soft bg-[#12142a] px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: `clamp(0px, calc(${(geo.x(shown.date) / W) * 100}% - 45px), calc(100% - 100px))` }}
          role="status"
        >
          <span className="block text-sm font-bold text-foreground">{format(shown.value)}</span>
          <span className="flex items-center gap-1.5 text-muted">
            <span className="inline-block h-0.5 w-3 rounded" style={{ background: LINE }} />
            {shortDate(shown.date)}
          </span>
        </div>
      )}

      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>תאריך</th>
            <th>ערך</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.date}>
              <td>{p.date}</td>
              <td>{format(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** A tiny trend line for stat tiles: no axes, current point marked. */
export function Sparkline({ points, label }: { points: TrendPoint[]; label: string }) {
  if (points.length < 2) return null;
  const w = 96;
  const h = 28;
  const values = points.map((p) => p.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values, lo + 0.001);
  const x = (i: number) => 2 + (i / (points.length - 1)) * (w - 4);
  const y = (v: number) => 3 + ((hi - v) / (hi - lo)) * (h - 6);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-24 shrink-0" role="img" aria-label={`מגמת ${label}`}>
      <path d={d} fill="none" stroke="rgba(158,160,194,0.7)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(points.length - 1)} cy={y(values.at(-1)!)} r={2.5} fill={LINE} />
    </svg>
  );
}
