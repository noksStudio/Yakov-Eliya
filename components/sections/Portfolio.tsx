"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Building2, QrCode, UtensilsCrossed, Wand2 } from "lucide-react";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { cn } from "@/lib/utils";

const projects = [
  {
    name: "Mealy",
    category: "FOOD TECH",
    description: "מערכת לניהול מסעדות ותפריטים דיגיטליים.",
    icon: UtensilsCrossed,
  },
  {
    name: "Bossi",
    category: "LEGAL TECH",
    description: "מערכת לניהול משרדי עורכי דין.",
    icon: Building2,
  },
  {
    name: "Here I Am",
    category: "EVENT TECH",
    description: "מערכת לאיסוף תמונות וסרטונים מאירועים באמצעות QR.",
    icon: QrCode,
  },
  {
    name: "Noks Studio",
    category: "DIGITAL SOLUTIONS",
    description: "פיתוח MVP, מערכות ואתרים מותאמים לעסקים ויזמים.",
    icon: Wand2,
  },
];

export function Portfolio() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function scrollToIndex(i: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(projects.length - 1, i));
    const card = track.children[clamped] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setIndex(clamped);
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let closest = 0;
    let closestDist = Infinity;
    Array.from(track.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setIndex(closest);
  }

  return (
    <section id="work" className="relative overflow-hidden bg-paper py-20 text-paper-ink sm:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <SectionEyebrow label="REAL PROJECTS" tone="light" />

        <ScrollReveal className="mt-6 text-center">
          <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">
            דברים שהפכתי מרעיון למציאות
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-paper-muted sm:text-lg">
            מוצרים ומערכות שבניתי לאורך הדרך, כדי לפתור בעיות אמיתיות.
          </p>
        </ScrollReveal>

        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-4"
        >
          {projects.map((project) => (
            <article
              key={project.name}
              className="w-[82%] shrink-0 snap-center overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_10px_40px_-15px_rgba(20,17,13,0.25)] sm:w-[60%] md:w-auto"
            >
              <div className="relative flex aspect-[4/3] items-center justify-center bg-[linear-gradient(135deg,#efe2c8,#f7f2ea)]">
                <span className="absolute start-4 top-4 rounded-full bg-[#14110d] px-3 py-1 text-[10px] font-semibold tracking-wide text-gold-2">
                  {project.category}
                </span>
                <project.icon className="h-16 w-16 text-gold" strokeWidth={1.2} />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold">{project.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-paper-muted">
                  {project.description}
                </p>
                <button className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#14110d]/15 px-4 py-2 text-xs font-semibold text-paper-ink transition-colors hover:bg-[#14110d]/5">
                  לצפייה בפרויקט
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 md:hidden">
          <button
            onClick={() => scrollToIndex(index - 1)}
            aria-label="הפרויקט הקודם"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#14110d]/15 text-paper-ink"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="flex gap-1.5">
            {projects.map((p, i) => (
              <span
                key={p.name}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-6 bg-gold" : "w-1.5 bg-[#14110d]/15"
                )}
              />
            ))}
          </div>
          <button
            onClick={() => scrollToIndex(index + 1)}
            aria-label="הפרויקט הבא"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#14110d]/15 text-paper-ink"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
