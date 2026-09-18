"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3, Eye, MapPin, Settings, Target as TargetIcon, Zap } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { ScrollReveal, StaggerGroup, staggerItem } from "@/components/ui/ScrollReveal";

const callouts = [
  {
    number: "01",
    icon: BarChart3,
    title: "איפה אנחנו?",
    text: "מבינים את המצב הקיים, הנתונים והאתגרים.",
  },
  {
    number: "02",
    icon: TargetIcon,
    title: "לאן רוצים להגיע?",
    text: "מגדירים יעד ברור ומדיד.",
  },
  {
    number: "03",
    icon: Settings,
    title: "במה מתקדמים עכשיו?",
    text: "בוחרים את הפעולות שייצרו את ההשפעה הגדולה ביותר.",
  },
];

const pillars = [
  { icon: Eye, label: "תמונה ברורה" },
  { icon: Zap, label: "פעולות מדויקות" },
  { icon: BarChart3, label: "תוצאות אמיתיות" },
];

const milestones = ["BETTER BUSINESS", "BIGGER OPPORTUNITIES", "MORE FREEDOM"];

export function Strategy() {
  return (
    <Section glow="center">
      <SectionEyebrow label="FOCUS × STRATEGY" className="max-w-lg" />

      <ScrollReveal className="mx-auto mt-6 max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold leading-[1.15] sm:text-4xl">
          לא כל הזדמנות
          <br />
          <span className="text-gold-gradient">היא הכיוון הנכון.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
          אני עוזר לעשות סדר ברעש, להבין מה באמת חשוב עכשיו ולבנות דרך פעולה
          ברורה שמתאימה לעסק ולמטרות שלו.
        </p>
      </ScrollReveal>

      <ScrollReveal className="mt-14 flex justify-center md:mt-16">
        <Compass />
      </ScrollReveal>

      <StaggerGroup className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
        {callouts.map((c) => (
          <motion.div key={c.number} variants={staggerItem} className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2.5">
              <span dir="ltr" className="text-xs font-bold tracking-widest text-gold">
                {c.number}
              </span>
              <c.icon className="h-4 w-4 text-gold" />
            </div>
            <h3 className="mt-3 text-base font-bold">{c.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.text}</p>
          </motion.div>
        ))}
      </StaggerGroup>

      <StaggerGroup className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 md:mt-14">
        {pillars.map((p) => (
          <motion.span
            key={p.label}
            variants={staggerItem}
            className="flex items-center gap-2 text-sm font-medium text-muted"
          >
            <p.icon className="h-4 w-4 text-gold" />
            {p.label}
          </motion.span>
        ))}
      </StaggerGroup>

      <ScrollReveal className="mx-auto mt-16 max-w-2xl text-center md:mt-24">
        <h3 className="text-2xl font-extrabold leading-tight sm:text-3xl">
          פחות רעש. יותר מיקוד. החלטות טובות יותר.
        </h3>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
          בין אם מדובר בשיווק, מכירות, טכנולוגיה או ההליך בעסק — המטרה היא
          אחת: להתקדם בכיוון הנכון.
        </p>
        <Link
          href="/#contact"
          className="mt-7 inline-flex items-center gap-2.5 rounded-full bg-[linear-gradient(115deg,var(--gold),var(--gold-2))] px-7 py-3.5 text-sm font-semibold text-[#14110d] shadow-[0_0_30px_-8px_rgba(212,162,78,0.6)] transition-transform hover:scale-[1.02]"
        >
          בוא נדבר על האסטרטגיה שלך
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </ScrollReveal>

      <StaggerGroup className="mx-auto mt-14 flex max-w-xs flex-col gap-3 md:mt-16">
        {milestones.map((m) => (
          <motion.div
            key={m}
            variants={staggerItem}
            dir="ltr"
            className="glass flex items-center gap-3 rounded-full px-4 py-2.5 text-xs font-semibold tracking-wide text-muted"
          >
            <MapPin className="h-4 w-4 shrink-0 text-gold" />
            {m}
          </motion.div>
        ))}
      </StaggerGroup>
    </Section>
  );
}

function Compass() {
  return (
    <div className="relative h-48 w-48 sm:h-56 sm:w-56">
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <circle cx="100" cy="100" r="96" fill="none" stroke="var(--border-soft)" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="76" fill="none" stroke="var(--border-soft)" strokeWidth="1" />
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          const isMajor = i % 6 === 0;
          const r1 = isMajor ? 76 : 84;
          const r2 = 96;
          const rad = (angle * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={100 + r1 * Math.sin(rad)}
              y1={100 - r1 * Math.cos(rad)}
              x2={100 + r2 * Math.sin(rad)}
              y2={100 - r2 * Math.cos(rad)}
              stroke="var(--gold)"
              strokeOpacity={isMajor ? 0.9 : 0.35}
              strokeWidth={isMajor ? 1.5 : 1}
            />
          );
        })}
        <text x="100" y="26" textAnchor="middle" fill="var(--gold)" fontSize="11" fontWeight="700">N</text>
        <text x="180" y="104" textAnchor="middle" fill="var(--muted)" fontSize="10">E</text>
        <text x="100" y="182" textAnchor="middle" fill="var(--muted)" fontSize="10">S</text>
        <text x="20" y="104" textAnchor="middle" fill="var(--muted)" fontSize="10">W</text>
        <polygon points="100,50 108,100 100,150 92,100" fill="var(--gold)" opacity="0.9" />
        <polygon points="100,50 108,100 100,90" fill="var(--gold-2)" />
        <circle cx="100" cy="100" r="6" fill="var(--background)" stroke="var(--gold)" strokeWidth="2" />
      </svg>
    </div>
  );
}
