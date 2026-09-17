"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { TypingText } from "@/components/ui/TypingText";
import { GradientButton } from "@/components/ui/GradientButton";
import { Eyebrow } from "@/components/ui/Section";

const roles = [
  "יזם טכנולוגיה ואוטומציה",
  "איש שיווק ומכירות",
  "פותר בעיות עסקיות",
  "מוביל פרויקטים",
  "יוצר קהילות וחיבורים",
  "מפתח תוכנה כבר עשור",
  "בונה מוצרים דיגיטליים",
];

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 pt-32 pb-20 text-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Eyebrow>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary-2" />
            Noks Studio
          </span>
        </Eyebrow>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="mt-8 text-4xl font-extrabold leading-tight sm:text-6xl md:text-7xl"
      >
        היי, קוראים לי <span className="text-gradient">יעקב-אליה</span> 👋
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mt-6 h-9 text-xl font-medium text-primary-2 sm:text-2xl"
      >
        <TypingText words={roles} />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl"
      >
        אני עוזר לבעלי עסקים ויזמים לפתור בעיות, לחסוך זמן, להגדיל הכנסות
        ולהשתמש בטכנולוגיה בצורה חכמה יותר.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="mt-10"
      >
        <a href="#services">
          <GradientButton icon={<ArrowLeft className="h-4 w-4" />}>
            בוא נראה איך אפשר לעזור לעסק שלך
          </GradientButton>
        </a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 1 }, y: { repeat: Infinity, duration: 2 } }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted"
      >
        <div className="h-9 w-6 rounded-full border border-border-soft p-1">
          <div className="h-2 w-full rounded-full bg-primary-2" />
        </div>
      </motion.div>
    </section>
  );
}
