"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TalkLink } from "@/components/TalkLink";
import { ScrollReveal, StaggerGroup, staggerItem } from "@/components/ui/ScrollReveal";
import { motion } from "framer-motion";

type Service = {
  n: string;
  title: [string, string?];
  desc: string;
  tags: string[];
  tagsDir: "rtl" | "ltr";
  img: { src: string; w: number; h: number; left: string; top: string; width: string };
  href?: string;
};

const services: Service[] = [
  {
    n: "01",
    title: ["מערכי שיווק"],
    desc: "אסטרטגיה, משפכים, קמפיינים, ניהול לידים ושיפור הדרך שבה העסק שלכם מושך וממיר לקוחות.",
    tags: ["אסטרטגיה", "קמפיינים", "משפכים", "לידים"],
    tagsDir: "rtl",
    img: { src: "/home/svc-1.webp", w: 202, h: 236, left: "56.3%", top: "2.8%", width: "42.9%" },
    href: "/leads",
  },
  {
    n: "02",
    title: ["מערכות CRM", "ואוטומציה"],
    desc: "בניית מערכות שמרכזות לקוחות, תהליכים ומשימות ומורידות עבודה ידנית מהעסק.",
    tags: ["אינטגרציות", "אוטומציות", "WhatsApp", "CRM"],
    tagsDir: "rtl",
    img: { src: "/home/svc-2.webp", w: 190, h: 276, left: "58.1%", top: "3.4%", width: "40.6%" },
    href: "/automation",
  },
  {
    n: "03",
    title: ["אתרים וחוויות", "דיגיטליות"],
    desc: "אתרי תדמית, דפי נחיתה, חנויות וממשקים שנבנים סביב המטרה העסקית ולא רק סביב העיצוב.",
    tags: ["Websites", "Landing Pages", "Ecommerce"],
    tagsDir: "ltr",
    img: { src: "/home/svc-3.webp", w: 200, h: 296, left: "56.9%", top: "2.7%", width: "42.5%" },
    href: "/branding",
  },
  {
    n: "04",
    title: ["AI ומערכות", "בהתאמה אישית"],
    desc: "הטמעת AI, סוכנים חכמים ומערכות פנימיות שנבנות לפי הצורך האמיתי של העסק.",
    tags: ["AI Agents", "Systems", "SaaS", "Custom Solutions"],
    tagsDir: "ltr",
    img: { src: "/home/svc-4.webp", w: 216, h: 232, left: "52.6%", top: "3.9%", width: "46.2%" },
  },
];

const artMask =
  "linear-gradient(to right, transparent 0%, #000 16%), linear-gradient(to top, transparent 0%, #000 16%)";

export function Services() {
  return (
    <section id="services" className="relative overflow-hidden bg-[#0c0d0f]">
      <Backdrop />

      <div className="relative mx-auto max-w-[1024px] px-[3.2vw] pb-[4vw] pt-[8.8vw] md:px-8 md:pb-16 md:pt-24">
        <ScrollReveal className="text-center">
          <p
            dir="ltr"
            className="font-latin text-[length:max(1.37vw,8px)] font-medium tracking-[0.42em] text-white/55 md:text-[13px]"
          >
            UNDERSTAND <span className="mx-[1em]">×</span> BUILD <span className="mx-[1em]">×</span> GROW
          </p>
          <span className="mx-auto mt-[3.5vw] block h-[max(0.2vw,1.5px)] w-[4.5vw] bg-[#c99a55] md:mt-5 md:h-[2px] md:w-12" />
          <h2 className="mt-[4.2vw] text-[length:max(4.55vw,20px)] font-extrabold leading-[1.17] text-white md:mt-8 md:text-[46px]">
            אני מבין את הקשיים והאתגרים
            <br />
            בעסק שלכם
            <br />
            <span className="text-gold-metal">ובונה פתרונות אישיים ללקוחות שלי</span>
          </h2>
          <p className="mx-auto mt-[4vw] max-w-[660px] text-[length:max(2.3vw,13.5px)] leading-[1.55] text-white/80 md:mt-7 md:text-xl">
            אני מחבר בין שיווק, טכנולוגיה ואוטומציה כדי לעזור לעסקים לצמוח,
            לייעל תהליכים ולהגיע לתוצאות אמיתיות.
          </p>

          <p
            dir="ltr"
            className="font-latin mt-[6.6vw] text-[length:max(1.37vw,8px)] font-medium tracking-[0.42em] text-[#c1924f] md:mt-16 md:text-[13px]"
          >
            MY SERVICES
          </p>
          <span className="mx-auto mt-[2.4vw] block h-[max(0.2vw,1.5px)] w-[4.5vw] bg-[#c99a55] md:mt-4 md:h-[2px] md:w-12" />
          <h2 className="mt-[2.6vw] text-[length:max(5.6vw,27px)] font-black leading-tight text-white md:mt-5 md:text-[56px]">
            השירותים שלי
          </h2>
          <p className="mt-[1.4vw] text-[length:max(2.15vw,13px)] text-white/70 md:mt-3 md:text-lg">
            פתרונות שמותאמים לעסק שלכם, לא תבניות מוכנות.
          </p>
        </ScrollReveal>

        <div dir="ltr" className="mt-[4.6vw] md:mt-12">
          <StaggerGroup className="grid gap-[3.5vw] sm:grid-cols-2 sm:gap-[2vw] md:gap-5">
            {services.map((s) => (
              <motion.div key={s.n} variants={staggerItem} dir="rtl">
                <ServiceCard service={s} />
              </motion.div>
            ))}
          </StaggerGroup>
        </div>

        <ScrollReveal className="mt-[7.5vw] text-center md:mt-20">
          <span className="mx-auto block h-[max(0.2vw,1.5px)] w-[4.5vw] bg-[#c99a55] md:h-[2px] md:w-12" />
          <p className="mt-[3.4vw] text-[length:max(2vw,13px)] tracking-[0.14em] text-white/60 md:mt-7 md:text-lg">
            אותו עסק. יותר אפשרויות.
          </p>
          <p
            dir="ltr"
            className="font-latin mt-[1.6vw] text-[length:max(1.07vw,7.5px)] tracking-[0.55em] text-white/45 md:mt-3 md:text-[11px]"
          >
            TECHNOLOGY FOR A BRIGHTER TOMORROW
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

function ServiceCard({ service: s }: { service: Service }) {
  const linkInner = (
    <>
      <span className="text-[length:3.6cqw] font-semibold text-white">לפרטים נוספים</span>
      <span className="flex h-[7.6cqw] w-[7.6cqw] items-center justify-center rounded-full border border-[#e0a852] transition-colors group-hover:bg-[#e0a852]/15">
        <ArrowRight className="h-[3.8cqw] w-[3.8cqw] text-[#e0a852]" strokeWidth={2} />
      </span>
    </>
  );

  return (
    <article className="@container group relative h-full overflow-hidden rounded-2xl border border-white/[0.13] bg-[linear-gradient(160deg,rgba(30,30,33,0.94),rgba(12,12,14,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_60px_-24px_rgba(0,0,0,0.9)]">
      <div
        className="pointer-events-none absolute"
        style={{
          left: s.img.left,
          top: s.img.top,
          width: s.img.width,
          maskImage: artMask,
          WebkitMaskImage: artMask,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      >
        <Image src={s.img.src} alt="" width={s.img.w} height={s.img.h} className="h-auto w-full" />
      </div>

      <div className="relative flex min-h-[74cqw] flex-col items-end px-[6.2cqw] pb-[5.4cqw] pt-[11.5cqw] text-left">
        <p className="font-latin w-full text-[length:3.9cqw] font-medium leading-none text-[#e0a852]">{s.n}</p>
        <h3 className="mt-[2.6cqw] w-[52cqw] text-[length:7.3cqw] font-bold leading-[1.18] text-white">
          {s.title[0]}
          {s.title[1] && (
            <>
              <br />
              {s.title[1]}
            </>
          )}
        </h3>
        <p className="mt-[3.4cqw] w-[52cqw] text-[length:4.45cqw] leading-[1.5] text-white/80">{s.desc}</p>

        <p dir={s.tagsDir} className="mt-auto w-full pt-[4.4cqw] text-left text-[length:3.3cqw] text-white/55">
          {s.tags.map((t, i) => (
            <span key={t}>
              {i > 0 && <span className="mx-[1.7cqw] text-[#e0a852]/70">•</span>}
              <bdi>{t}</bdi>
            </span>
          ))}
        </p>

        <div className="mt-[5cqw] w-full text-left">
          {s.href ? (
            <Link href={s.href} className="inline-flex items-center gap-[2.8cqw]">
              {linkInner}
            </Link>
          ) : (
            <TalkLink
              message={`היי יעקב, אשמח לשמוע על ${s.title.join(" ")}`}
              className="inline-flex items-center gap-[2.8cqw]"
            >
              {linkInner}
            </TalkLink>
          )}
        </div>
      </div>
    </article>
  );
}

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-y-0 left-0 w-[7vw] bg-[linear-gradient(to_right,rgba(70,72,78,0.28),transparent)]" />
      <div className="absolute right-0 top-0 h-[41vw] w-[6vw] bg-[linear-gradient(to_left,rgba(205,140,72,0.42),rgba(120,78,38,0.14)_60%,transparent)]" />
      <div className="absolute right-0 top-[40vw] h-[0.9vw] w-[5.5vw] bg-[#f2a65c] opacity-80 blur-[3px]" />
      <div className="absolute left-[-8vw] top-[24vw] h-[36vw] w-[24vw] rounded-full bg-[radial-gradient(closest-side,rgba(44,58,36,0.55),transparent)] blur-md" />
      <div className="absolute bottom-[-8vw] left-[-10vw] h-[48vw] w-[48vw] rounded-full bg-[radial-gradient(closest-side,rgba(120,128,58,0.3),transparent)] blur-2xl" />
      <div className="absolute bottom-[10vw] left-[4vw] h-[9vw] w-[9vw] rounded-full bg-[radial-gradient(closest-side,rgba(200,190,90,0.35),transparent)] blur-md" />
      <div className="absolute bottom-[2vw] right-[-12vw] h-[44vw] w-[44vw] rounded-full bg-[radial-gradient(closest-side,rgba(196,112,48,0.32),transparent)] blur-2xl" />
    </div>
  );
}
