"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Section, SectionTitle } from "@/components/ui/Section";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const testimonials = [
  {
    name: "לקוח מרוצה",
    role: "בעל עסק בתחום השירותים",
    quote:
      "יעקב-אליה הבין בדיוק מה חסר לנו לפני שאנחנו בכלל הצלחנו לנסח את זה. תוך זמן קצר ראינו שיפור אמיתי בזרימת הלידים.",
  },
  {
    name: "לקוחה מרוצה",
    role: "בעלת מסעדה",
    quote:
      "המערכת שנבנתה לנו חסכה שעות של עבודה ידנית כל שבוע. תמיכה זמינה, מקצועית ותמיד עם פתרון פרקטי.",
  },
  {
    name: "לקוח מרוצה",
    role: "יזם טכנולוגי",
    quote:
      "הליווי לא הצטמצם רק לפיתוח – קיבלנו חשיבה עסקית אמיתית שעזרה לנו למקד את המוצר ולצאת לשוק מהר יותר.",
  },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const current = testimonials[index];

  function go(dir: 1 | -1) {
    setIndex((i) => (i + dir + testimonials.length) % testimonials.length);
  }

  return (
    <Section>
      <SectionTitle eyebrow="המלצות" title="מה אומרים על העבודה איתי?" />

      <ScrollReveal className="mx-auto mt-14 max-w-2xl">
        <div className="glow-border glass relative rounded-3xl px-8 py-10 text-center">
          <Quote className="mx-auto h-8 w-8 text-primary-2/60" />
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35 }}
              className="mt-4"
            >
              <p className="text-lg leading-relaxed sm:text-xl">
                &ldquo;{current.quote}&rdquo;
              </p>
              <p className="mt-6 font-semibold">{current.name}</p>
              <p className="text-sm text-muted">{current.role}</p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() => go(1)}
              aria-label="הבא"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border-soft transition-colors hover:bg-surface-strong"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="flex gap-1.5">
              {testimonials.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-6 bg-primary-2" : "w-1.5 bg-border-soft"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => go(-1)}
              aria-label="הקודם"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border-soft transition-colors hover:bg-surface-strong"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </ScrollReveal>
    </Section>
  );
}
