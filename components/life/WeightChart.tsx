"use client";

import { useMemo, useState } from "react";
import type { WeightPoint } from "@/lib/life/body";

// Single-series weight trend. Line colour validated for the dark surface (dataviz lightness band);
// text uses text tokens, never the series colour. Hover/keyboard crosshair + a hidden table view.
const LINE = "#bb8632";
const W = 340;
const H = 170;
const PAD = { top: 14, right: 12, bottom: 22, left: 34 };

function shortDate(date: string) {
  const [, m, d] = date.split("-");
  return `${Number(d)}.${Number(m)}`;
}

export function WeightChart({ points, goal }: { points: WeightPoint[]; goal: number }) {
  const [active, setActive] = useState<number | null>(null);

  const geo = useMemo(() => {
    const weights = points.map((p) => p.weight);
    const lo = Math.floor(Math.min(goal, ...weights) - 1);
    const hi = Math.ceil(Math.max(goal, ...weights) + 1);
    const t0 = Date.parse(points[0].date);
    const t1 = Date.parse(points.at(-1)!.date);
    const span = Math.max(t1 - t0, 86_400_000 * 6); // at least a week wide
    const x = (date: string) => PAD.left + ((Date.parse(date) - t0) / span) * (W - PAD.left - PAD.right);
    const y = (w: number) => PAD.top + ((hi - w) / (hi - lo)) * (H - PAD.top - PAD.bottom);
    const step = hi - lo > 8 ? 2 : 1;
    const ticks: number[] = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) ticks.push(v);
    return { x, y, ticks };
  }, [points, goal]);

  const path = points.map((p, i) => `${i ? "L" : "M"}${geo.x(p.date).toFixed(1)},${geo.y(p.weight).toFixed(1)}`).join("");
  const area = `${path}L${geo.x(points.at(-1)!.date).toFixed(1)},${H - PAD.bottom}L${geo.x(points[0].date).toFixed(1)},${H - PAD.bottom}Z`;
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
        aria-label={`מגמת משקל: ${points[0].weight} ק״ג ב־${shortDate(points[0].date)}, עכשיו ${last.weight} ק״ג. יעד ${goal} ק״ג.`}
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
              {t}
            </text>
          </g>
        ))}

        {/* Goal reference */}
        <line x1={PAD.left} x2={W - PAD.right} y1={geo.y(goal)} y2={geo.y(goal)} stroke="rgba(158,160,194,0.6)" strokeWidth={1} />
        <text x={W - PAD.right} y={geo.y(goal) - 4} textAnchor="end" className="fill-muted text-[10px]">
          יעד {goal}
        </text>

        <path d={area} fill={LINE} opacity={0.1} />
        <path d={path} fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={geo.x(last.date)} cy={geo.y(last.weight)} r={4.5} fill={LINE} stroke="#0b0c18" strokeWidth={2} />

        <text x={PAD.left} y={H - 6} className="fill-muted text-[10px]">
          {shortDate(points[0].date)}
        </text>
        {points.length > 1 && (
          <text x={W - PAD.right} y={H - 6} textAnchor="end" className="fill-muted text-[10px]">
            {shortDate(last.date)}
          </text>
        )}

        {shown && (
          <g pointerEvents="none">
            <line x1={geo.x(shown.date)} x2={geo.x(shown.date)} y1={PAD.top} y2={H - PAD.bottom} stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
            <circle cx={geo.x(shown.date)} cy={geo.y(shown.weight)} r={4.5} fill={LINE} stroke="#0b0c18" strokeWidth={2} />
          </g>
        )}
      </svg>

      {shown && (
        <div
          className="pointer-events-none absolute top-0 rounded-lg border border-border-soft bg-[#12142a] px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: `clamp(0px, calc(${(geo.x(shown.date) / W) * 100}% - 40px), calc(100% - 90px))` }}
          role="status"
        >
          <span className="block text-sm font-bold text-foreground">{shown.weight} ק״ג</span>
          <span className="flex items-center gap-1.5 text-muted">
            <span className="inline-block h-0.5 w-3 rounded" style={{ background: LINE }} />
            {shortDate(shown.date)}
          </span>
        </div>
      )}

      <table className="sr-only">
        <caption>שקילות</caption>
        <thead>
          <tr>
            <th>תאריך</th>
            <th>משקל (ק״ג)</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.date}>
              <td>{p.date}</td>
              <td>{p.weight}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
