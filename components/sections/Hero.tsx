"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutGrid, Mouse, Send } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { PortraitPlaceholder } from "@/components/ui/PortraitPlaceholder";

export function Hero() {
  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden md:min-h-screen">
      <motion.div
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        <PortraitPlaceholder className="h-full w-full rounded-none" />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1/3 bg-[linear-gradient(180deg,rgba(5,6,15,0.6),transparent)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/3 bg-[linear-gradient(180deg,transparent,rgba(5,6,15,0.65)_50%,rgba(5,6,15,0.96)_92%)]"
        />
      </motion.div>

      <div className="relative z-10 flex min-h-[100svh] flex-col px-6 pb-24 pt-28 md:min-h-screen md:px-10 md:pt-32">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center"
          >
            <span dir="ltr" className="text-xs font-medium uppercase tracking-[0.3em] text-white/70">
              PEOPLE <span className="text-gold">×</span> IDEAS <span className="text-gold">×</span> SOLUTIONS
            </span>
            <span className="mt-3 h-px w-10 bg-gold" />
          </motion.div>

          <motion.p
            dir="ltr"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="absolute end-6 top-24 hidden max-w-[8rem] text-end text-2xl leading-tight text-gold-gradient sm:end-10 md:block"
            style={{ fontFamily: "var(--font-signature)" }}
          >
            Good Ideas Build Businesses
          </motion.p>

          <div className="flex flex-1 flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-center"
            >
              <p className="text-lg text-white/80 sm:text-xl">קוראים לי</p>
              <h1 className="mt-1 text-5xl font-extrabold leading-[1.1] sm:text-6xl lg:text-7xl">
                <span className="text-white">יעקב</span>
                <span className="text-gold-gradient">-אליה</span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-7 flex flex-wrap items-center justify-center gap-4"
            >
              <Link href="/#services">
                <GradientButton variant="ghost" icon={<LayoutGrid className="h-4 w-4" />}>
                  לשירותים שלי
                </GradientButton>
              </Link>
              <Link href="/#contact">
                <GradientButton variant="gold" icon={<Send className="h-4 w-4" />}>
                  בואו נדבר
                </GradientButton>
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="h-8 w-px bg-white/25" />
            <Mouse className="h-5 w-5 text-white/70" strokeWidth={1.5} />
            <span className="text-xs font-medium text-white/60">גלול</span>
          </motion.div>

          <div className="mt-6 flex items-end justify-between" dir="ltr">
            <p className="text-[10px] font-medium uppercase leading-relaxed tracking-[0.15em] text-white/50">
              Turning ideas
              <br />
              into real business
            </p>
            <p className="text-end text-[10px] font-medium uppercase leading-relaxed tracking-[0.15em] text-white/50">
              Tech × Marketing
              <br />
              Automation × Growth
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
