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
    <section id="top" className="relative px-6 pb-20 pt-32 sm:pt-40 md:px-10">
      <div className="mx-auto max-w-6xl">
        <SectionEyebrow label="PEOPLE × TECH × GROWTH" tag="IDEAS BUILD IMPACT" />

        <div className="mt-10 grid items-center gap-12 md:grid-cols-2 md:gap-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative order-1 md:order-2"
          >
            <PortraitPlaceholder className="aspect-[4/5] w-full" />
            <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-[linear-gradient(180deg,transparent,rgba(5,6,15,0.85)_70%)] px-4 pb-4 pt-10">
              <p
                dir="ltr"
                className="text-3xl text-white sm:text-4xl"
                style={{ fontFamily: "var(--font-signature)" }}
              >
                Yakov-Eliya
              </p>
              <p
                dir="ltr"
                className="mt-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/60"
              >
                Solving problems. Building growth.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="order-2 md:order-1"
          >
            <h1 className="text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
              אני מתחיל
              <br />
              <span className="text-accent-gradient">מהבעיה שלך</span>
              <br />
              לא מהפתרון המוכן.
            </h1>

            <div className="mt-7 flex items-center gap-4">
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

            <p className="mt-7 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
              אני עוזר לבעלי עסקים ויזמים לחשוב מחדש על תהליכים, לבנות מערכות
              ואוטומציות שמייצרות תוצאות אמיתיות — מהאפיון ועד ההשקה, בגישה
              פשוטה, יצירתית וממוקדת מטרה.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
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
