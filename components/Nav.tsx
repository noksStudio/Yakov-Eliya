"use client";

import Link from "next/link";
import { motion, useScroll, useSpring } from "framer-motion";
import { Sparkles } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { useChatWidget } from "@/components/chat/ChatContext";

const links = [
  { href: "/#about", label: "מי אני" },
  { href: "/#services", label: "שירותים" },
  { href: "/#work", label: "פרויקטים" },
  { href: "/community", label: "קהילת יזמים" },
];

export function Nav() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 25,
    restDelta: 0.001,
  });
  const { openChat } = useChatWidget();

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <motion.div
        className="h-[3px] origin-right bg-[linear-gradient(90deg,var(--color-primary),var(--color-primary-2),var(--color-accent))]"
        style={{ scaleX }}
      />
      <nav className="glass mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-6xl items-center justify-between rounded-full px-5 py-3 sm:px-7">
        <Link href="/#top" className="text-lg font-bold">
          יעקב<span className="text-gradient">-אליה</span>
        </Link>
        <ul className="hidden items-center gap-7 text-sm text-muted md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="transition-colors hover:text-foreground">
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <button
              onClick={openChat}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary-2" />
              עוזר AI
            </button>
          </li>
        </ul>
        <Link href="/#contact">
          <GradientButton className="px-5 py-2 text-xs sm:text-sm">
            קביעת שיחה
          </GradientButton>
        </Link>
      </nav>
    </header>
  );
}
