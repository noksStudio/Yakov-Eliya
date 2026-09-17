"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Banknote,
  Clock,
  Globe2,
  LayoutDashboard,
  MessageCircleMore,
  Rocket,
  Share2,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  Users2,
  Workflow,
} from "lucide-react";
import { Section, SectionTitle } from "@/components/ui/Section";
import { StaggerGroup, staggerItem } from "@/components/ui/ScrollReveal";
import { cn } from "@/lib/utils";

const cards = [
  {
    id: "pain-leads",
    icon: TrendingDown,
    emoji: "📉",
    title: "אין מספיק פניות חדשות לעסק?",
    text: "האתר שלך לא מביא לקוחות? הלקוחות לא משאירים פרטים?",
  },
  {
    id: "pain-reviews",
    icon: Star,
    emoji: "⭐",
    title: "קשה לקבל ביקורות טובות בגוגל?",
    text: "לקוחות מרוצים אבל אף אחד לא משאיר ביקורת?",
  },
  {
    id: "pain-whatsapp",
    icon: MessageCircleMore,
    emoji: "📱",
    title: "מבזבז שעות על הודעות ווטסאפ?",
    text: "מוצא את עצמך עונה שוב ושוב על אותן שאלות?",
  },
  {
    id: "pain-scattered",
    icon: Share2,
    emoji: "🗂️",
    title: "הלקוחות והמידע מפוזרים בכל מקום?",
    text: "וואטסאפ, פתקים, אקסל ומיילים?",
  },
  {
    id: "pain-deals",
    icon: Banknote,
    emoji: "💸",
    title: "מרגיש שאתה מפספס עסקאות?",
    text: "לקוחות מתעניינים אבל לא סוגרים?",
  },
  {
    id: "pain-time",
    icon: Clock,
    emoji: "⏳",
    title: "אין לך זמן לנהל את העסק?",
    text: "העסק עובד סביבך במקום בשבילך?",
  },
  {
    id: "pain-idea",
    icon: Rocket,
    emoji: "🚀",
    title: "יש לך רעיון למיזם אבל לא יודע מאיפה להתחיל?",
    text: "חושב על אפליקציה או מערכת כבר חודשים?",
  },
  {
    id: "pain-data",
    icon: LayoutDashboard,
    emoji: "📊",
    title: "אין לך מושג מה באמת קורה בעסק?",
    text: "כמה פניות הגיעו? מאיפה? מה עובד?",
  },
  {
    id: "pain-followup",
    icon: Users2,
    emoji: "🤝",
    title: "לקוחות נופלים בין הכיסאות?",
    text: "אין תהליך מסודר למעקב?",
  },
  {
    id: "pain-repetitive",
    icon: Workflow,
    emoji: "🔄",
    title: "אתה עושה פעולות שחוזרות על עצמן כל יום?",
    text: "העתקות, תזכורות, מעקבים ושליחת הודעות?",
  },
  {
    id: "pain-brand",
    icon: Globe2,
    emoji: "🌐",
    title: "העסק שלך לא נראה כמו שהוא באמת?",
    text: "הנוכחות הדיגיטלית לא משדרת את הערך שלך?",
  },
  {
    id: "pain-tools",
    icon: Sparkles,
    emoji: "🧠",
    title: "מרגיש שטכנולוגיה יכולה לעזור אבל לא יודע איך?",
    text: "יש מאות כלים בחוץ ואתה לא יודע מה באמת מתאים לך?",
  },
] as const;

const diagnosis = {
  id: "pain-diagnosis",
  icon: Target,
  emoji: "🎯",
  title: "לא בטוח מה הבעיה הכי גדולה בעסק שלך?",
  text: "ענה על כמה שאלות קצרות וקבל כיוון אישי.",
  cta: "התחל אבחון",
};

export function PainPoints() {
  return (
    <Section id="services" glow="bottom">
      <SectionTitle
        eyebrow="שירותים לפי כאב"
        title="מה האתגר הכי גדול שלך היום?"
        description="תבחר את מה שהכי מדבר אליך – ונדבר על פתרון אמיתי, לא על עוד מוצר."
      />

      <StaggerGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <PainCard key={card.id} {...card} />
        ))}

        <motion.div variants={staggerItem} className="sm:col-span-2 lg:col-span-3">
          <a href="#assistant" id={diagnosis.id} className="block scroll-mt-28">
            <motion.div
              whileHover={{ y: -4 }}
              className="glow-border glass relative flex flex-col items-center gap-4 overflow-hidden rounded-2xl px-8 py-10 text-center"
            >
              <span
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(120deg,rgba(109,91,255,0.18),rgba(139,92,246,0.06),rgba(79,139,255,0.18))]"
              />
              <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))]">
                <diagnosis.icon className="h-8 w-8 text-white" />
              </span>
              <h3 className="relative z-10 text-xl font-bold sm:text-2xl">
                {diagnosis.emoji} {diagnosis.title}
              </h3>
              <p className="relative z-10 text-muted">{diagnosis.text}</p>
              <span className="relative z-10 mt-2 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(115deg,var(--color-primary),var(--color-primary-2))] px-6 py-3 text-sm font-semibold text-white">
                {diagnosis.cta}
                <ArrowLeft className="h-4 w-4" />
              </span>
            </motion.div>
          </a>
        </motion.div>
      </StaggerGroup>
    </Section>
  );
}

function PainCard({
  id,
  icon: Icon,
  emoji,
  title,
  text,
}: (typeof cards)[number]) {
  return (
    <motion.a
      href="#assistant"
      id={id}
      variants={staggerItem}
      whileHover={{ y: -6 }}
      className={cn(
        "glass group relative flex scroll-mt-28 flex-col gap-4 overflow-hidden rounded-2xl p-6 transition-colors hover:border-primary-2/50"
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))]">
        <Icon className="h-5 w-5 text-white" />
      </span>
      <div className="flex-1">
        <h3 className="text-base font-semibold leading-snug sm:text-lg">
          {emoji} {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
      </div>
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-2">
        גלה פתרון
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
      </span>
      <Icon className="pointer-events-none absolute -bottom-3 -left-3 h-16 w-16 -rotate-6 text-white/[0.03] transition-transform group-hover:scale-110" />
    </motion.a>
  );
}
