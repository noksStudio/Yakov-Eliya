"use client";

import { Check } from "lucide-react";
import { Section, SectionTitle } from "@/components/ui/Section";
import { ScrollReveal, StaggerGroup, staggerItem } from "@/components/ui/ScrollReveal";
import { GradientButton } from "@/components/ui/GradientButton";
import { FinalCTA } from "@/components/sections/FinalCTA";
import type { Track } from "@/lib/tracks";
import { m } from "framer-motion";

export function TrackContent({ track }: { track: Track }) {
  return (
    <>
      <Section glow="top" className="pt-40 sm:pt-44">
        <SectionTitle eyebrow="פתרון מותאם" title={track.title} description={track.pitch} />

        <ScrollReveal className="mt-10 flex justify-center">
          <a href="#contact">
            <GradientButton>קביעת שיחת ייעוץ ללא עלות</GradientButton>
          </a>
        </ScrollReveal>

        <StaggerGroup className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-2">
          {track.bullets.map((bullet) => (
            <TrackBullet key={bullet} text={bullet} />
          ))}
        </StaggerGroup>
      </Section>

      <FinalCTA />
    </>
  );
}

function TrackBullet({ text }: { text: string }) {
  return (
    <m.div
      variants={staggerItem}
      className="glass flex items-start gap-3 rounded-xl px-4 py-3.5"
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))]">
        <Check className="h-3 w-3 text-white" />
      </span>
      <span className="text-sm leading-relaxed">{text}</span>
    </m.div>
  );
}
