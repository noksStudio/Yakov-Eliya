"use client";

import { Handshake } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { StaggerGroup, staggerItem } from "@/components/ui/ScrollReveal";
import { Counter } from "@/components/ui/Counter";
import { motion } from "framer-motion";

const stats = [
  { to: 10, suffix: "+", label: "שנות ניסיון בפיתוח תוכנה" },
  { to: 4, suffix: "+", label: "מוצרים ומיזמים שהוקמו" },
  { to: 100, suffix: "+", label: "שעות פיתוח ואוטומציה" },
];

export function Stats() {
  return (
    <Section glow="center" className="py-16 sm:py-20">
      <div className="glass rounded-3xl px-6 py-12 sm:px-12">
        <StaggerGroup className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div key={i} variants={staggerItem} className="flex flex-col gap-2">
              <span className="text-3xl font-extrabold text-gradient sm:text-5xl">
                <Counter to={s.to} suffix={s.suffix} />
              </span>
              <span className="text-sm text-muted sm:text-base">{s.label}</span>
            </motion.div>
          ))}
          <motion.div variants={staggerItem} className="flex flex-col items-center gap-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))] sm:h-14 sm:w-14">
              <Handshake className="h-6 w-6 text-white sm:h-7 sm:w-7" />
            </span>
            <span className="text-sm text-muted sm:text-base">
              עבודה מול בעלי עסקים, יזמים וארגונים
            </span>
          </motion.div>
        </StaggerGroup>
      </div>
    </Section>
  );
}
