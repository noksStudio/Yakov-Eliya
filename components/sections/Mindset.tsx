"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowLeft, Lightbulb, Search, Target } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { ScrollReveal, StaggerGroup, staggerItem } from "@/components/ui/ScrollReveal";
import { PortraitPlaceholder } from "@/components/ui/PortraitPlaceholder";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "מבינים",
    text: "איפה העסק נתקע? מה האתגר האמיתי?",
  },
  {
    number: "02",
    icon: Lightbulb,
    title: "מפשטים",
    text: "מה באמת צריך להשתנות?",
  },
  {
    number: "03",
    icon: Target,
    title: "פותרים",
    text: "טכנולוגיה, שיווק, תהליך, חיבור לאדם הנכון — מה שמתאים.",
  },
];

export function Mindset() {
  return (
    <Section glow="top">
      <SectionEyebrow label="MY MINDSET" className="max-w-lg md:mx-0" />

      <div className="mt-8 grid items-center gap-10 md:mt-10 md:grid-cols-2 md:gap-14">
        <ScrollReveal direction="right" className="order-2 text-center md:order-1 md:text-start">
          <h2 className="text-3xl font-extrabold leading-[1.15] sm:text-4xl">
            אני לא מתחיל מהפתרון.
            <br />
            <span className="text-gold-gradient">אני מתחיל מהבעיה.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg md:mx-0">
            אני מאמין שכל עסק הוא ייחודי, ולכן חשוב להקשיב, להבין את התמונה
            המלאה ולמצוא את הדרך הנכונה ביותר להתקדם.
          </p>
        </ScrollReveal>

        <ScrollReveal direction="left" delay={0.1} className="order-1 md:order-2">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[2rem]">
            <PortraitPlaceholder className="h-full w-full" />
            <p
              dir="ltr"
              className="absolute end-4 top-4 max-w-[8rem] text-end text-sm leading-tight text-gold-gradient"
              style={{ fontFamily: "var(--font-signature)" }}
            >
              Good Ideas Build Businesses
            </p>
          </div>
        </ScrollReveal>
      </div>

      <StaggerGroup className="mt-14 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:gap-3 md:mt-20">
        {steps.map((step, i) => (
          <Fragment key={step.number}>
            <motion.div variants={staggerItem} className="glass flex-1 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <span dir="ltr" className="text-xs font-bold tracking-widest text-gold">
                  {step.number}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--gold),var(--gold-2))]">
                  <step.icon className="h-[18px] w-[18px] text-[#14110d]" />
                </span>
              </div>
              <h3 className="mt-3 text-lg font-bold">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.text}</p>
            </motion.div>
            {i < steps.length - 1 && (
              <div className="flex items-center justify-center py-1 sm:py-8">
                <ArrowDown className="h-4 w-4 shrink-0 text-border-soft sm:hidden" />
                <ArrowLeft className="hidden h-4 w-4 shrink-0 text-border-soft sm:block" />
              </div>
            )}
          </Fragment>
        ))}
      </StaggerGroup>

      <ScrollReveal className="mt-10 md:mt-12">
        <blockquote className="glass mx-auto max-w-2xl rounded-2xl border-s-4 border-gold px-6 py-5 text-center text-base leading-relaxed text-muted sm:text-lg">
          &ldquo;לפעמים זה אתר. לפעמים אוטומציה. לפעמים שינוי בתהליך. ולפעמים
          בכלל צריך חיבור לאדם הנכון.&rdquo;
        </blockquote>
      </ScrollReveal>
    </Section>
  );
}
