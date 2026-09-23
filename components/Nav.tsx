"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useSpring } from "framer-motion";
import { Sparkles } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { useChatWidget } from "@/components/chat/ChatContext";

const links = [
  { href: "/#services", label: "שירותים" },
  { href: "/#process", label: "איך אני עובד" },
  { href: "/#partners", label: "למי זה מתאים" },
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
  const isHome = usePathname() === "/";
  const [pastHero, setPastHero] = useState(false);

  // On the homepage the hero carries its own branding, so the bar only appears once it's scrolled past.
  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const visible = !isHome || pastHero;

  return (
    <motion.header
      initial={false}
      animate={{ y: visible ? 0 : -110, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      <motion.div
        className="h-[3px] origin-right bg-[linear-gradient(90deg,#b8863b,#f0c878,#d4a24e)]"
        style={{ scaleX }}
      />
      <nav className="mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-6xl items-center justify-between rounded-full border border-white/10 bg-[rgba(10,10,12,0.72)] px-5 py-3 backdrop-blur-xl sm:px-7">
        <Link href="/#top" className="text-lg font-black">
          <span className="text-gold-soft">יעקב</span>-אליה
        </Link>
        <ul className="hidden items-center gap-7 text-sm text-white/65 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="transition-colors hover:text-white">
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <button
              onClick={openChat}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#e2b25e]" />
              עוזר AI
            </button>
          </li>
        </ul>
        <Link href="/#contact">
          <GradientButton variant="gold" className="px-5 py-2 text-xs sm:text-sm">
            קביעת שיחה
          </GradientButton>
        </Link>
      </nav>
    </motion.header>
  );
}
