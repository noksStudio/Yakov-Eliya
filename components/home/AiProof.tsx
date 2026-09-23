"use client";

import Image from "next/image";
import { Database, Settings, ShieldCheck } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const badges = [
  { icon: Settings, label: "Custom Rules", color: "text-[#2563eb]" },
  { icon: Database, label: "Business Logic", color: "text-[#9333ea]" },
  { icon: ShieldCheck, label: "ללא כלים חיצוניים", color: "text-[#2563eb]" },
];

const cubeMask =
  "linear-gradient(to bottom, transparent 0%, #000 12%, #000 86%, transparent 100%), linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%)";

export function AiProof() {
  return (
    <section
      id="ai"
      className="relative overflow-hidden bg-[linear-gradient(180deg,#eef0fb_0%,#ecf0fc_45%,#eef1fb_100%)] text-[#141733]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(150,172,228,0.26)_1px,transparent_1px),linear-gradient(to_bottom,rgba(150,172,228,0.26)_1px,transparent_1px)] bg-[length:7.97vw_7.97vw] bg-[position:4.78vw_4.25vw] md:bg-[length:64px_64px] md:bg-[position:center_top]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[20vw] top-[30%] h-[70vw] w-[70vw] rounded-full bg-[radial-gradient(closest-side,rgba(196,170,250,0.35),transparent)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[25vw] top-[10%] h-[60vw] w-[60vw] rounded-full bg-[radial-gradient(closest-side,rgba(170,215,250,0.35),transparent)] blur-2xl"
      />

      <div className="relative mx-auto max-w-[941px] pb-[10vw] pt-[14.2vw] md:pb-24 md:pt-28">
        <ScrollReveal className="px-[5vw] text-center">
          <p className="text-[length:max(3vw,12px)] font-medium tracking-[0.28em] text-[#1b1e3a] md:text-[17px]">
            הוכחה טכנולוגית
            <span className="mx-[3vw] text-[#1b1e3a] md:mx-6">|</span>
            <span className="font-latin tracking-[0.2em] text-[#7b82a8]">05</span>
          </p>

          <h2 className="mt-[7.2vw] text-[length:max(8.3vw,31px)] font-black leading-[1.18] md:mt-12 md:text-[78px]">
            לא עוד צ׳אט גנרי.
            <br />
            <span className="text-violet-cyan">אני בונה</span> אותו.
          </h2>

          <p className="mt-[5.4vw] text-[length:max(3.6vw,14px)] leading-[1.48] text-[#2a2f4d] md:mt-10 md:text-[26px]">
            פיתחתי לו מערכת חוקים ולוגיקה ייחודית
            <br />
            שמגדירה איך הוא מגיב ומנהל שיחה —
            <br />
            ללא שימוש בכלי AI חיצוניים.
          </p>
        </ScrollReveal>

        <ScrollReveal className="mt-[4.4vw] md:mt-8">
          <Image
            src="/home/ai-cube.webp"
            alt="מערכת AI מותאמת — קובייה עם תרשים זרימה ומסמך"
            width={941}
            height={690}
            sizes="(min-width: 941px) 941px, 100vw"
            className="h-auto w-full"
            style={{ maskImage: cubeMask, WebkitMaskImage: cubeMask, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
          />
        </ScrollReveal>

        <ScrollReveal className="mt-[7.4vw] px-[4vw] md:mt-10 md:px-10">
          <div dir="ltr" className="flex justify-center gap-[2.2vw] md:gap-5">
            {badges.map((b) => (
              <div
                key={b.label}
                className="flex h-[max(8.6vw,34px)] flex-1 items-center justify-center gap-[1.8vw] rounded-full border border-[#d4dcf5] bg-white/70 shadow-[0_6px_20px_-10px_rgba(80,100,180,0.35),inset_0_1px_0_#fff] backdrop-blur md:h-[72px] md:max-w-[240px] md:gap-3"
              >
                <b.icon className={`h-[max(3.4vw,14px)] w-[max(3.4vw,14px)] shrink-0 md:h-7 md:w-7 ${b.color}`} strokeWidth={2} />
                <span className="text-[length:max(2.3vw,10px)] font-medium text-[#1b1e3a] md:text-lg">{b.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-[4.6vw] text-center text-[length:max(2.3vw,12px)] text-[#6b7090] md:mt-8 md:text-base">
            המערכת עדיין בתהליך למידה ופיתוח.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
