"use client";

import { Calendar } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { GradientButton } from "@/components/ui/GradientButton";

export function FinalCTA() {
  return (
    <Section id="contact" glow="top">
      <ScrollReveal>
        <div className="glow-border glass mx-auto max-w-3xl rounded-3xl px-8 py-14 text-center sm:px-14">
          <h2 className="text-3xl font-bold sm:text-4xl">
            בוא נמצא מה יכול <span className="text-gradient">לקדם את העסק שלך</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl leading-relaxed text-muted">
            לפעמים הפתרון הוא לא אתר. לפעמים הוא לא מערכת. ולפעמים בכלל לא
            צריך תוכנה. בשיחה קצרה נבין מה צוואר הבקבוק בעסק שלך ומה יכול
            לעזור לך להתקדם.
          </p>
          <div className="mt-9">
            <GradientButton icon={<Calendar className="h-4 w-4" />}>
              קביעת שיחת ייעוץ ללא עלות
            </GradientButton>
          </div>
        </div>
      </ScrollReveal>
    </Section>
  );
}
