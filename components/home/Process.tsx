"use client";

import { motion } from "framer-motion";
import { BarChart3, FileText, Lightbulb, Search } from "lucide-react";
import { ScrollReveal, StaggerGroup, staggerItem } from "@/components/ui/ScrollReveal";

const steps = [
  { n: "01", icon: Search, title: "מבין", text: "מבין את העסק, הקהל והאתגרים." },
  { n: "02", icon: FileText, title: "ממפה", text: "מזהה מה מעכב, מה אפשר לשפר ואיפה יש הזדמנות." },
  { n: "03", icon: Lightbulb, title: "בונה", text: "יוצר פתרון מדויק שמתאים לתהליך שלכם." },
  { n: "04", icon: BarChart3, title: "מלווה ומשפר", text: "מטמיעים, בודקים ומשפרים לאורך הדרך." },
];

export function Process() {
  return (
    <section
      id="process"
      className="relative overflow-hidden bg-[linear-gradient(180deg,#e6ebf1_0%,#edf0f4_40%,#e8ecf1_100%)] text-[#0e1322]"
    >
      <Backdrop />

      <div className="relative mx-auto max-w-[941px] pb-[14vw] pt-[11.4vw] md:pb-28 md:pt-24">
        <ScrollReveal className="px-[5vw] text-center">
          <p className="text-[length:max(3.2vw,12.5px)] font-medium tracking-[0.12em] text-[#2a2f45] md:text-lg">
            איך אני עובד
            <span className="mx-[3vw] text-[#c9953f] md:mx-5">|</span>
            <span className="font-latin tracking-[0.25em] text-[#7c8196]">06</span>
          </p>
          <span className="mx-auto mt-[4.2vw] block h-[max(0.32vw,1.5px)] w-[8vw] bg-[#d1a152] md:mt-7 md:h-[3px] md:w-16" />

          <h2 className="mt-[5.8vw] text-[length:max(6.6vw,25px)] font-black leading-[1.23] md:mt-10 md:text-[60px]">
            אני לא קופץ ישר לפתרון.
            <br />
            קודם מבין, <span className="text-gold-bronze">אחר כך בונה.</span>
          </h2>
          <p className="mt-[4vw] text-[length:max(3.4vw,14px)] leading-[1.35] text-[#464c63] md:mt-7 md:text-2xl">
            תהליך ברור, חשיבה מדויקת וביצוע שמחובר
            <br />
            לעסק שלכם.
          </p>
        </ScrollReveal>

        <div className="relative ml-[14.7vw] mr-[11.4vw] mt-[5.6vw] md:mx-auto md:mt-12 md:max-w-[720px]">
          <span
            aria-hidden
            className="absolute bottom-[-3.4vw] left-[max(3.72vw,14px)] top-[max(8.5vw,35px)] w-[1.5px] -translate-x-1/2 bg-[#d4ad63] md:bottom-[-28px] md:left-[34px] md:top-[70px]"
          />
          <span
            aria-hidden
            className="absolute bottom-[-4.6vw] left-[max(3.72vw,14px)] h-[max(2vw,9px)] w-[max(2vw,9px)] -translate-x-1/2 rounded-full border-2 border-[#f4e3bd] bg-[#d9aa55] shadow-[0_0_10px_rgba(217,170,85,0.6)] md:bottom-[-38px] md:left-[34px] md:h-3.5 md:w-3.5"
          />

          <StaggerGroup className="flex flex-col gap-[4.4vw] md:gap-8">
            {steps.map((step) => (
              <motion.div key={step.n} variants={staggerItem} className="flex items-center">
                <div className="flex min-h-[max(17vw,70px)] flex-1 items-center rounded-[max(2.6vw,12px)] border border-white bg-white/75 py-[3.4vw] shadow-[0_14px_36px_-16px_rgba(40,52,80,0.28)] backdrop-blur md:min-h-[150px] md:rounded-3xl md:py-7">
                  <div className="flex-1 pe-[3.4vw] ps-[3vw] text-left md:pe-6 md:ps-10">
                    <h3 className="text-[length:max(4.3vw,16px)] font-extrabold leading-tight md:text-[38px]">{step.title}</h3>
                    <p className="mt-[0.8vw] text-[length:max(2.9vw,12px)] leading-[1.35] text-[#3a3f55] md:mt-2 md:text-xl">
                      {step.text}
                    </p>
                  </div>
                  <span className="h-[62%] min-h-[40px] w-px self-center bg-[#dcc59a]" />
                  <span className="mx-[2.9vw] flex h-[max(10.8vw,40px)] w-[max(10.8vw,40px)] shrink-0 items-center justify-center rounded-full bg-[#efebe4] shadow-[inset_0_2px_6px_rgba(120,100,70,0.12)] md:mx-7 md:h-24 md:w-24">
                    <step.icon className="h-[45%] w-[45%] text-[#8a6a32]" strokeWidth={1.6} />
                  </span>
                </div>

                <span className="h-[1.5px] w-[max(3vw,10px)] bg-[#d4ad63] md:w-7" />
                <span className="font-latin flex h-[max(7.44vw,28px)] w-[max(7.44vw,28px)] shrink-0 items-center justify-center rounded-full border-2 border-[#d6a64e] bg-[radial-gradient(circle_at_40%_30%,#fdf3dc,#efd29a)] text-[length:max(2.6vw,11px)] font-bold text-[#1d1a14] shadow-[0_0_14px_rgba(215,169,79,0.45)] md:h-[68px] md:w-[68px] md:text-lg">
                  {step.n}
                </span>
              </motion.div>
            ))}
          </StaggerGroup>
        </div>

        <ScrollReveal className="mt-[9.4vw] px-[5vw] text-center md:mt-20">
          <span className="mx-auto block h-[max(0.32vw,1.5px)] w-[8vw] bg-[#d1a152] md:h-[3px] md:w-16" />
          <p className="mt-[5.2vw] text-[length:max(4.2vw,16px)] font-extrabold md:mt-9 md:text-4xl">
            בלי ניחושים. בלי פתרונות מדף.
          </p>
          <p className="mt-[1.4vw] text-[length:max(3.4vw,14px)] text-[#464c63] md:mt-3 md:text-2xl">
            רק תהליך מסודר שמחובר לעסק שלכם.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -right-[38vw] -top-[58vw] aspect-square w-[88vw] rounded-full border border-[#d9b36c]/70 shadow-[0_0_24px_rgba(217,179,108,0.25)] md:-right-[260px] md:-top-[480px] md:w-[760px]" />
      <div className="absolute -bottom-[46vw] -left-[66vw] aspect-square w-[88vw] rounded-full border border-[#e2c58c]/60 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.55),transparent_60%)] md:-bottom-[380px] md:-left-[560px] md:w-[760px]" />
      <div className="absolute -left-[8vw] top-[48%] h-[22vw] w-[22vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.9),transparent)] blur-xl" />
      <div className="absolute -right-[6vw] bottom-[12%] h-[26vw] w-[26vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.85),transparent)] blur-xl" />
      <div className="absolute bottom-[-4vw] right-[18vw] h-[18vw] w-[18vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.8),transparent)] blur-xl" />
    </div>
  );
}
