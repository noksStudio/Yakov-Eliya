"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import type { ReactNode } from "react";
import { ScrollReveal, StaggerGroup, staggerItem } from "@/components/ui/ScrollReveal";

const columns: { n: string; icon: ReactNode; title: [string, string]; text: string; tag: string; line: string }[] = [
  {
    n: "01",
    icon: (
      <Zap
        className="h-[46%] w-[46%] text-[#b48cff] drop-shadow-[0_0_6px_rgba(168,120,255,0.9)]"
        strokeWidth={1.7}
      />
    ),
    title: ["פתוחים", "לטכנולוגיה"],
    text: "לא מפחדים לשנות תהליכים כשאפשר לעשות אותם טוב יותר.",
    tag: "OPEN TO CHANGE",
    line: "from-[#a78bfa] to-[#8b5cf6]",
  },
  {
    n: "02",
    icon: <BarsIcon />,
    title: ["מבינים ששיווק", "הוא תהליך"],
    text: "לא מחפשים פתרון קסם, אלא מערכת שעובדת לאורך זמן.",
    tag: "THINK LONG TERM",
    line: "from-[#8b5cf6] to-[#6366f1]",
  },
  {
    n: "03",
    icon: <ChipIcon />,
    title: ["רוצים להטמיע", "AI באמת"],
    text: "כדי לחסוך זמן, לייעל עבודה ולשפר את חוויית הלקוח.",
    tag: "REAL IMPACT",
    line: "from-[#6366f1] to-[#3b82f6]",
  },
];

export function Partners() {
  return (
    <section id="partners" className="relative overflow-hidden bg-[#07070e] text-white">
      <Backdrop />

      <div className="relative mx-auto max-w-[1024px] pt-[8vw] md:pt-24">
        <ScrollReveal className="px-[5vw] text-center">
          <div dir="ltr" className="flex items-center justify-center gap-[2vw] md:gap-5">
            <span className="font-latin text-violet-blue text-[length:max(2.6vw,11px)] font-bold md:text-2xl">07</span>
            <span className="h-px w-[9.3vw] bg-[#6b63c9]/70 md:w-24" />
            <span className="font-latin text-[length:max(1.46vw,8px)] font-medium tracking-[0.42em] text-[#7e7fa3] md:text-sm">
              RIGHT PARTNERS
            </span>
          </div>

          <h2 className="mt-[6.4vw] text-[length:max(10.4vw,38px)] font-black leading-[1.02] md:mt-12 md:text-[104px]">
            לא לכל עסק.
            <br />
            <span className="text-violet-blue">וזה בכוונה.</span>
          </h2>

          <p className="mt-[3.8vw] text-[length:max(3vw,13.5px)] leading-[1.47] text-white/85 md:mt-9 md:text-[28px]">
            אנחנו כנראה נתאים אם אתם רוצים לבנות עסק חכם יותר —
            <br />
            לא רק להוסיף עוד כלי.
          </p>
        </ScrollReveal>

        <div dir="ltr" className="mt-[5.4vw] px-[2vw] md:mt-14 md:px-6">
          <StaggerGroup className="grid grid-cols-3">
            {columns.map((c, i) => (
              <motion.div
                key={c.n}
                variants={staggerItem}
                dir="rtl"
                className={`flex flex-col items-center px-[1.6vw] pb-[1vw] text-center md:px-5 ${i > 0 ? "border-l border-white/[0.07]" : ""}`}
              >
                <span className="font-latin text-outline-num text-[length:max(15.5vw,58px)] font-bold leading-[0.9] md:text-[150px]">
                  {c.n}
                </span>
                <span className="relative -mt-[3.6vw] flex aspect-square w-[max(11.5vw,46px)] items-center justify-center rounded-[28%] border border-[#a096ff]/20 bg-[linear-gradient(160deg,#1b1c33,#0f1020)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_30px_-10px_rgba(99,102,241,0.45)] md:-mt-9 md:w-[118px]">
                  {c.icon}
                </span>
                <h3 className="mt-[3.2vw] text-[length:max(3.9vw,15px)] font-extrabold leading-[1.2] md:mt-8 md:text-[34px]">
                  {c.title[0]}
                  <br />
                  {c.title[1]}
                </h3>
                <p className="mt-[2.6vw] text-[length:max(2.9vw,12px)] leading-[1.3] text-white/75 md:mt-5 md:text-[21px]">
                  {c.text}
                </p>
                <span className={`mt-[3.8vw] h-[max(0.3vw,2px)] w-[4.4vw] rounded-full bg-gradient-to-r md:mt-9 md:w-11 ${c.line}`} />
                <span
                  dir="ltr"
                  className="font-latin mt-[2.6vw] text-[length:max(1.3vw,7.5px)] font-medium tracking-[0.34em] text-[#70739a] md:mt-5 md:text-[13px]"
                >
                  {c.tag}
                </span>
              </motion.div>
            ))}
          </StaggerGroup>
        </div>

        <ScrollReveal className="mt-[5.2vw] px-[5vw] text-center md:mt-14">
          <span className="mx-auto block h-px w-[58.6vw] max-w-[600px] bg-white/10" />
          <p className="mt-[4.4vw] text-[length:max(3.1vw,14px)] text-white/65 md:mt-10 md:text-[28px]">
            מחפשים עוד כלי? כנראה שפחות.
          </p>
          <p className="mt-[1.4vw] text-[length:max(4.4vw,18px)] font-black text-violet-wave md:mt-3 md:text-[40px]">
            מחפשים דרך טובה יותר לעבוד?
          </p>
          <p className="mt-[1.2vw] text-[length:max(3.1vw,14px)] text-white/85 md:mt-3 md:text-[28px]">
            יש לנו על מה לדבר.
          </p>
        </ScrollReveal>

        <div className="relative mt-[3.9vw] h-[max(20vw,90px)] md:mt-10 md:h-[220px]">
          <div className="absolute left-1/2 top-0 aspect-square w-[210vw] -translate-x-1/2 rounded-full border-t-[1.5px] border-[#a99bff]/90 bg-[radial-gradient(ellipse_at_50%_0%,#1b1a3a_0%,#0c0c1c_18%,#07070e_40%)] shadow-[0_-6px_40px_rgba(124,58,237,0.45),inset_0_10px_30px_rgba(139,122,255,0.25)] md:w-[2200px]" />
          <span className="absolute left-1/2 top-[max(2vw,9px)] h-[max(4.9vw,20px)] w-px -translate-x-1/2 bg-white/30 md:top-5 md:h-12" />
          <div
            dir="ltr"
            className="font-latin absolute inset-x-0 top-[max(9.2vw,38px)] text-center text-[length:max(1.1vw,7px)] font-medium leading-[2.2] tracking-[0.45em] text-[#8e90ad] md:top-24 md:text-xs"
          >
            GOOD BUSINESSES
            <br />
            BUILD A BRIGHTER TOMORROW
          </div>
        </div>
      </div>
    </section>
  );
}

function BarsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[46%] w-[46%] drop-shadow-[0_0_6px_rgba(120,110,255,0.8)]">
      <defs>
        <linearGradient id="bars-grad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#bars-grad)" strokeWidth="1.8">
        <rect x="3.5" y="13" width="4" height="7.5" rx="1" />
        <rect x="10" y="8.5" width="4" height="12" rx="1" />
        <rect x="16.5" y="3.5" width="4" height="17" rx="1" />
      </g>
    </svg>
  );
}

function ChipIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[50%] w-[50%] text-[#69a7ff] drop-shadow-[0_0_6px_rgba(96,165,250,0.9)]">
      <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <rect x="5" y="5" width="14" height="14" rx="2" />
        {[8, 11, 14, 16.5].map((p) => (
          <g key={p}>
            <line x1={p} y1="2" x2={p} y2="5" />
            <line x1={p} y1="19" x2={p} y2="22" />
            <line x1="2" y1={p} x2="5" y2={p} />
            <line x1="19" y1={p} x2="22" y2={p} />
          </g>
        ))}
      </g>
      <text x="12" y="14.6" textAnchor="middle" fill="currentColor" fontSize="7" fontWeight="600" fontFamily="var(--font-montserrat), sans-serif">
        AI
      </text>
    </svg>
  );
}

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -left-[46.8vw] -top-[51.6vw] aspect-square w-[74vw] rounded-full border-[1.5px] border-[#8f7bff]/80 bg-[radial-gradient(circle_at_75%_75%,rgba(124,92,246,0.28),transparent_45%)] shadow-[0_0_40px_rgba(139,92,246,0.45)] md:-left-[480px] md:-top-[530px] md:w-[760px]" />
      <div className="absolute -left-[12vw] top-[36%] aspect-square w-[16vw] rounded-full border border-[#6d5bd0]/40" />
      <div className="absolute -right-[10vw] top-[54%] aspect-square w-[16vw] rounded-full border border-[#6d5bd0]/45" />
      <div className="absolute -right-[12vw] top-[16%] h-[34vw] w-[26vw] rounded-full bg-[radial-gradient(closest-side,rgba(99,80,220,0.22),transparent)] blur-xl" />
      <div className="absolute left-[1.6vw] top-[53%] grid grid-cols-3 gap-[1.6vw] opacity-40">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className="h-[0.35vw] w-[0.35vw] rounded-full bg-[#7c7fd6]" />
        ))}
      </div>
    </div>
  );
}
