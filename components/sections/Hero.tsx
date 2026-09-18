"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Headphones, Lightbulb } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { PortraitPlaceholder } from "@/components/ui/PortraitPlaceholder";

const features = [
  { icon: Headphones, label: "הקשבה" },
  { icon: Lightbulb, label: "פתרונות יצירתיים" },
];

export function Hero() {
  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden md:min-h-[92vh]">
      {/* photo — full-screen backdrop on mobile, edge-to-edge right column on desktop */}
      <motion.div
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 overflow-hidden [clip-path:polygon(0_0,100%_0,100%_95%,50%_100%,0_95%)] md:inset-y-0 md:start-auto md:end-0 md:w-[54%]"
      >
        <PortraitPlaceholder className="h-full w-full rounded-none" />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1/3 bg-[linear-gradient(180deg,rgba(5,6,15,0.55),transparent)] md:h-1/4"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-3/5 bg-[linear-gradient(180deg,transparent,rgba(5,6,15,0.6)_45%,rgba(5,6,15,0.95)_88%)] md:hidden"
        />
        <div
          aria-hidden
          className="absolute inset-y-0 start-0 hidden w-1/4 bg-[linear-gradient(90deg,var(--color-background),transparent)] md:block"
        />
        <div className="absolute inset-x-auto bottom-20 hidden start-8 w-auto rounded-2xl bg-[linear-gradient(180deg,transparent,rgba(5,6,15,0.85)_70%)] px-4 pb-4 pt-10 md:block">
          <p
            dir="ltr"
            className="text-3xl text-white sm:text-4xl"
            style={{ fontFamily: "var(--font-signature)" }}
          >
            Yakov-Eliya
          </p>
          <p
            dir="ltr"
            className="mt-1 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.2em] text-white/60"
          >
            Problem-first. Growth-focused.
          </p>
        </div>
      </motion.div>

      <div className="relative z-10 flex min-h-[100svh] flex-col justify-end px-6 pb-24 pt-28 md:block md:min-h-0 md:px-10 md:pb-40 md:pt-40">
        <div className="mx-auto w-full max-w-6xl">
          <SectionEyebrow label="PEOPLE × TECH × GROWTH" tag="IDEAS BUILD IMPACT" />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-5 max-w-lg md:mt-16"
          >
            <h1 className="text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
              אני מתחיל
              <br />
              <span className="text-accent-gradient">מהבעיה שלך</span>
              <br />
              לא מהפתרון המוכן.
            </h1>

            <div className="mt-5 flex items-center gap-4 md:mt-7">
              {features.map((f, i) => (
                <div key={f.label} className="flex items-center gap-4">
                  {i > 0 && <span className="h-6 w-px bg-border-soft" />}
                  <span className="flex items-center gap-2 text-sm font-medium text-muted">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-strong">
                      <f.icon className="h-4 w-4 text-accent" />
                    </span>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg md:mt-7">
              אני עוזר לבעלי עסקים ויזמים לחשוב מחדש על תהליכים, לבנות מערכות
              ואוטומציות שמייצרות תוצאות אמיתיות — מהאפיון ועד ההשקה, בגישה
              פשוטה, יצירתית וממוקדת מטרה.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 md:mt-9">
              <Link href="/#contact">
                <GradientButton icon={<ArrowLeft className="h-4 w-4" />}>
                  בואו נדבר
                </GradientButton>
              </Link>
              <Link href="/#work">
                <GradientButton variant="ghost">צפו בפרויקטים שלי</GradientButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
