import type { Area } from "@/lib/life/types";

export const AREA_STYLE: Record<Area, { dot: string; text: string; chip: string }> = {
  spirit: { dot: "bg-gold-2", text: "text-gold-2", chip: "border-gold/40 bg-gold/10 text-gold-2" },
  body: { dot: "bg-emerald-400", text: "text-emerald-300", chip: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" },
  business: { dot: "bg-violet-400", text: "text-violet-300", chip: "border-violet-400/30 bg-violet-400/10 text-violet-300" },
  mind: { dot: "bg-pink-400", text: "text-pink-300", chip: "border-pink-400/30 bg-pink-400/10 text-pink-300" },
  finance: { dot: "bg-amber-400", text: "text-amber-300", chip: "border-amber-400/30 bg-amber-400/10 text-amber-300" },
  home: { dot: "bg-sky-400", text: "text-sky-300", chip: "border-sky-400/30 bg-sky-400/10 text-sky-300" },
  general: { dot: "bg-slate-400", text: "text-slate-300", chip: "border-white/15 bg-white/5 text-slate-300" },
};
