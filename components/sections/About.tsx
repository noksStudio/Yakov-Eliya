"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { Section, SectionTitle } from "@/components/ui/Section";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const points = [
  "מי זה יעקב-אליה",
  "רקע בפיתוח תוכנה",
  "יזמות והקמת מוצרים",
  "עבודה עם בעלי עסקים",
  "אהבה לפתרון בעיות",
  "למה הוקם Noks Studio",
];

export function About() {
  const [playing, setPlaying] = useState(false);

  return (
    <Section id="about" glow="top">
      <SectionTitle
        eyebrow="הכירו אותי"
        title="מי אני ומה אני עושה?"
        description="60–90 שניות שיסבירו לך בדיוק למה שווה לך לדבר איתי."
      />

      <div className="mt-14 grid items-center gap-10 md:grid-cols-2">
        <ScrollReveal direction="right">
          <div className="glow-border relative aspect-video overflow-hidden rounded-3xl glass">
            {!playing ? (
              <button
                onClick={() => setPlaying(true)}
                className="group flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(109,91,255,0.25),rgba(139,92,246,0.1))]"
                aria-label="נגן סרטון"
              >
                <motion.span
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 shadow-[0_0_40px_-5px_rgba(139,92,246,0.7)] backdrop-blur"
                >
                  <Play className="h-8 w-8 translate-x-[-2px] fill-white text-white" />
                </motion.span>
              </button>
            ) : (
              <video
                className="h-full w-full object-cover"
                controls
                autoPlay
                src="/media/intro.mp4"
              />
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal direction="left" delay={0.1}>
          <ul className="grid gap-4 sm:grid-cols-2">
            {points.map((p) => (
              <li
                key={p}
                className="glass flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-[linear-gradient(90deg,var(--color-primary),var(--color-primary-2))]" />
                {p}
              </li>
            ))}
          </ul>
        </ScrollReveal>
      </div>
    </Section>
  );
}
