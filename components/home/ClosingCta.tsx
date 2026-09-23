"use client";

import Image from "next/image";
import { ArrowRight, BarChart3, Lightbulb, Users } from "lucide-react";
import { TalkLink } from "@/components/TalkLink";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const pillars = [
  { icon: Users, label: "PEOPLE" },
  { icon: Lightbulb, label: "IDEAS" },
  { icon: BarChart3, label: "SOLUTIONS" },
];

const earthMask = "linear-gradient(to bottom, transparent 0%, #000 22%)";

export function ClosingCta() {
  return (
    <section id="contact" className="relative overflow-hidden bg-[#050506] text-white">
      <Backdrop />

      <div className="relative mx-auto max-w-[1024px] pt-[9.6vw] md:pt-28">
        <ScrollReveal className="px-[5vw] text-center">
          <div dir="ltr" className="flex items-center justify-center gap-[3.2vw] md:gap-8">
            <span className="h-px w-[6vw] bg-[#8d7545]/70 md:w-16" />
            <span className="font-latin text-[length:max(1.56vw,8.5px)] font-medium tracking-[0.42em] text-white/55 md:text-sm">
              READY TO BUILD?
            </span>
            <span className="h-px w-[6vw] bg-[#8d7545]/70 md:w-16" />
          </div>

          <h2 className="mt-[8.4vw] text-[length:max(9.2vw,34px)] font-black leading-[1.16] md:mt-14 md:text-[92px]">
            יש לכם עסק טוב.
            <br />
            בואו נגרום לו
            <br />
            <span className="relative inline-block">
              <span className="text-gold-glow">לעבוד חכם יותר.</span>
              <span
                aria-hidden
                className="absolute bottom-[0.02em] left-[18%] h-[2px] w-[60%] bg-[linear-gradient(to_right,transparent,#ffe2a0_35%,#fff6da_50%,#ffe2a0_65%,transparent)] shadow-[0_0_14px_rgba(255,210,120,0.9)]"
              />
            </span>
          </h2>

          <p className="mt-[4.2vw] text-[length:max(3.1vw,14px)] leading-[1.42] text-white/80 md:mt-9 md:text-[28px]">
            אם אתם רוצים לחבר בין שיווק, טכנולוגיה ו-AI
            <br />
            בצורה שבאמת מתאימה לעסק שלכם —
            <br />
            בואו נדבר.
          </p>

          <TalkLink
            message="היי יעקב, אשמח לקבוע שיחה ראשונית"
            className="relative mx-auto mt-[5vw] flex h-[max(9.2vw,46px)] w-[max(44.7vw,200px)] items-center justify-center gap-[3vw] rounded-full border-[1.5px] border-[#d9b064] bg-[#0a0a0b] text-[length:max(3.4vw,16px)] font-bold shadow-[0_0_28px_-6px_rgba(217,176,100,0.45),inset_0_1px_0_rgba(255,220,150,0.35)] transition-transform hover:scale-[1.02] md:mt-12 md:h-[94px] md:w-[458px] md:gap-6 md:text-[34px]"
          >
            <span
              aria-hidden
              className="absolute -top-px left-1/2 h-[2px] w-1/2 -translate-x-1/2 bg-[linear-gradient(to_right,transparent,#ffe3a6,transparent)] blur-[0.5px]"
            />
            בואו נדבר
            <ArrowRight className="h-[max(3.6vw,18px)] w-[max(3.6vw,18px)] text-[#e6b963] md:h-10 md:w-10" strokeWidth={2} />
          </TalkLink>

          <p className="mt-[3.4vw] text-[length:max(2.5vw,12.5px)] text-white/75 md:mt-9 md:text-[23px]">
            שיחה ראשונית <span className="mx-[1.2vw] text-[#d9b064]">•</span> בלי התחייבות{" "}
            <span className="mx-[1.2vw] text-[#d9b064]">•</span> בודקים אם יש התאמה
          </p>
        </ScrollReveal>

        <ScrollReveal className="mt-[9vw] md:mt-20">
          <div dir="ltr" className="mx-auto grid max-w-[74vw] grid-cols-3 md:max-w-[760px]">
            {pillars.map((p, i) => (
              <div key={p.label} className="relative flex flex-col items-center gap-[2.4vw] md:gap-5">
                {i > 0 && <span className="absolute left-0 top-[18%] h-[62%] w-px bg-[#b8924f]/40" />}
                <p.icon className="h-[max(4.5vw,22px)] w-[max(4.5vw,22px)] text-[#d4a24e] md:h-12 md:w-12" strokeWidth={1.2} />
                <span className="font-latin text-[length:max(1.3vw,8px)] font-medium tracking-[0.42em] text-white/60 md:text-sm">
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <div className="relative mt-[0.5vw] md:mt-0">
          <Image
            src="/home/earth.webp"
            alt=""
            width={1024}
            height={484}
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="h-auto w-full [mask-composite:intersect] [mask-image:var(--earth-mask)] md:[mask-image:var(--earth-mask),linear-gradient(to_right,transparent,#000_14%,#000_86%,transparent)]"
            style={{ ["--earth-mask" as string]: earthMask }}
          />
          <span className="absolute left-1/2 top-[51.2%] h-[12.8%] w-px -translate-x-1/2 bg-[#d4a24e]/70" />
          <p
            dir="ltr"
            className="font-latin absolute inset-x-0 top-[69%] text-center text-[length:max(1.56vw,8px)] font-medium tracking-[0.42em] text-[#c9a261] md:text-base"
          >
            GOOD IDEAS BUILD BUSINESSES
          </p>
          <span className="absolute left-1/2 top-[80.2%] h-[max(0.2vw,1.5px)] w-[6.2%] -translate-x-1/2 bg-[#d4a24e]/80" />
        </div>
      </div>
    </section>
  );
}

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute left-[74vw] -top-[65vw] aspect-square w-[82vw] rounded-full border-[1.5px] border-[#e2b25e]/80 bg-[#0c0c0e] shadow-[0_0_40px_rgba(226,178,94,0.35),inset_0_0_30px_rgba(226,178,94,0.2)] md:left-auto md:-right-[260px] md:-top-[620px] md:w-[840px]" />
      <div className="absolute -left-[30vw] top-[40%] aspect-square w-[36vw] rounded-full border border-[#b8924f]/25" />
      <div className="absolute -right-[36vw] top-[46%] aspect-square w-[52vw] rounded-full border border-white/[0.06] bg-[#0b0b0e]" />
      <div className="absolute -left-[10vw] top-[22%] h-[1px] w-[40vw] rotate-[18deg] bg-[linear-gradient(to_right,transparent,rgba(210,170,100,0.25),transparent)]" />
      {[
        [3, 3],
        [1.8, 23],
        [0.7, 14],
        [3.4, 51],
        [92, 31],
        [80, 12],
      ].map(([x, y], i) => (
        <span
          key={i}
          className="absolute h-[max(0.3vw,2px)] w-[max(0.3vw,2px)] rounded-full bg-[#e8c27a] opacity-70"
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      ))}
    </div>
  );
}
