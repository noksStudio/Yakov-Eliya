"use client";

import { Building2, QrCode, UtensilsCrossed, Wand2 } from "lucide-react";
import { Section, SectionTitle } from "@/components/ui/Section";
import { StaggerGroup, staggerItem } from "@/components/ui/ScrollReveal";
import { motion } from "framer-motion";

const projects = [
  {
    name: "Bossi",
    description: "מערכת לניהול משרדי עורכי דין.",
    icon: Building2,
  },
  {
    name: "Mealy",
    description: "מערכת לניהול מסעדות ותפריטים דיגיטליים.",
    icon: UtensilsCrossed,
  },
  {
    name: "Here I Am",
    description: "מערכת לאיסוף תמונות וסרטונים מאירועים באמצעות QR.",
    icon: QrCode,
  },
  {
    name: "Noks Studio",
    description: "פיתוח MVP, מערכות ואתרים מותאמים לעסקים ויזמים.",
    icon: Wand2,
  },
];

export function Portfolio() {
  return (
    <Section id="work">
      <SectionTitle eyebrow="פרויקטים" title="כמה מהדברים שבניתי לאורך הדרך" />

      <StaggerGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {projects.map((p) => (
          <motion.div
            key={p.name}
            variants={staggerItem}
            whileHover={{ y: -6 }}
            className="glass flex flex-col gap-4 rounded-2xl p-6"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))]">
              <p.icon className="h-6 w-6 text-white" />
            </span>
            <h3 className="text-lg font-bold">{p.name}</h3>
            <p className="text-sm leading-relaxed text-muted">{p.description}</p>
          </motion.div>
        ))}
      </StaggerGroup>
    </Section>
  );
}
