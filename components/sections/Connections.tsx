"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Briefcase,
  Code2,
  DoorOpen,
  Handshake,
  Lightbulb,
  Network,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { ScrollReveal, StaggerGroup, staggerItem } from "@/components/ui/ScrollReveal";
import { PortraitPlaceholder } from "@/components/ui/PortraitPlaceholder";

const circle = [
  { icon: Briefcase, title: "בעלי עסקים", text: "צמיחה והתרחבות" },
  { icon: BarChart3, title: "אנשי שיווק", text: "חשיפה ותוצאות" },
  { icon: Handshake, title: "מומחים", text: "ידע וניסיון" },
  { icon: Users, title: "חברי BNI", text: "קהילה וחיבורים" },
  { icon: TrendingUp, title: "משקיעים", text: "הזדמנויות וצמיחה" },
  { icon: Wrench, title: "נותני שירות", text: "פתרונות משלימים" },
  { icon: Code2, title: "מפתחים", text: "טכנולוגיה ומוצרים" },
  { icon: Lightbulb, title: "יזמים", text: "רעיונות למציאות" },
];

const pillars = [
  { icon: Network, label: "יוצר הזדמנויות" },
  { icon: DoorOpen, label: "פותח דלתות" },
  { icon: Users, label: "מחבר אנשים" },
];

export function Connections() {
  return (
    <Section glow="top">
      <SectionEyebrow label="PEOPLE × CONNECTIONS" className="max-w-lg" />

      <ScrollReveal className="mx-auto mt-6 max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold leading-[1.15] sm:text-4xl">
          טכנולוגיה פותרת בעיות.
          <br />
          <span className="text-gold-gradient">אבל אנשים יוצרים הזדמנויות.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
          אני מאמין שחיבור נכון בין אנשים יכול להיות שווה יותר מעוד כלי או
          מערכת. חלק מהעבודה שלי היא להכיר צמתים, להבין מה הם צריכים ולחבר
          בין הזדמנויות.
        </p>
      </ScrollReveal>

      <ScrollReveal className="mt-12 flex justify-center md:mt-14">
        <div className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-gold/60">
          <PortraitPlaceholder className="h-full w-full" />
        </div>
      </ScrollReveal>

      <StaggerGroup className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
        {circle.map((node) => (
          <motion.div
            key={node.title}
            variants={staggerItem}
            className="glass flex flex-col items-center gap-2 rounded-2xl px-3 py-5 text-center"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--gold),var(--gold-2))]">
              <node.icon className="h-5 w-5 text-[#14110d]" />
            </span>
            <h3 className="text-sm font-bold">{node.title}</h3>
            <p className="text-xs leading-snug text-muted">{node.text}</p>
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

      <ScrollReveal className="mt-10 md:mt-12">
        <blockquote className="glass mx-auto max-w-2xl rounded-2xl border-s-4 border-gold px-6 py-5 text-center text-base leading-relaxed text-muted sm:text-lg">
          &ldquo;לפעמים הפתרון שאני יכול לתת לך הוא לא משהו שאני בונה — אלא
          מישהו שאני מכיר.&rdquo;
        </blockquote>
      </ScrollReveal>
    </Section>
  );
}
