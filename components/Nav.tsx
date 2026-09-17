"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { GradientButton } from "@/components/ui/GradientButton";

const links = [
  { href: "#about", label: "מי אני" },
  { href: "#assistant", label: "עוזר AI" },
  { href: "#services", label: "שירותים" },
  { href: "#work", label: "פרויקטים" },
  { href: "#contact", label: "יצירת קשר" },
];

export function Nav() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 25,
    restDelta: 0.001,
  });

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <motion.div
        className="h-[3px] origin-right bg-[linear-gradient(90deg,var(--color-primary),var(--color-primary-2),var(--color-accent))]"
        style={{ scaleX }}
      />
      <nav className="glass mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-6xl items-center justify-between rounded-full px-5 py-3 sm:px-7">
        <a href="#top" className="text-lg font-bold">
          יעקב<span className="text-gradient">-אליה</span>
        </a>
        <ul className="hidden items-center gap-7 text-sm text-muted md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="transition-colors hover:text-foreground">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a href="#contact">
          <GradientButton className="px-5 py-2 text-xs sm:text-sm">
            קביעת שיחה
          </GradientButton>
        </a>
      </nav>
    </header>
  );
}
