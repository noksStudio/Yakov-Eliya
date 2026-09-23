"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutPanelLeft, Send } from "lucide-react";
import { useChatWidget } from "@/components/chat/ChatContext";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const },
});

// Mobile keeps the mockup's exact 941×1672 proportions: every element is placed by % of
// height and sized in vw, so it lines up with the matching spots in the photo.
export function Hero() {
  const { openChat } = useChatWidget();

  return (
    <section
      id="top"
      className="relative aspect-[941/1672] w-full overflow-hidden bg-[#0b0a09] md:grid md:aspect-auto md:min-h-[100svh] md:grid-cols-2"
    >
      <div className="absolute inset-0 z-10 md:relative md:flex md:flex-col md:items-start md:justify-center md:px-[7%] md:py-32">
        <motion.div
          {...fade(0.1)}
          className="absolute inset-x-0 top-[8.75%] flex flex-col items-center md:static md:items-start"
        >
          <p
            dir="ltr"
            className="font-latin text-[2.05vw] font-medium tracking-[0.34em] text-white/90 md:text-[13px]"
          >
            PEOPLE <span className="mx-[0.55em] text-[#e9b863]">X</span> IDEAS{" "}
            <span className="mx-[0.55em] text-[#e9b863]">X</span> SOLUTIONS
          </p>
          <span className="mt-[2.5vw] h-[max(0.45vw,2px)] w-[7.6vw] rounded-full bg-[#e2ad58] md:mt-5 md:h-[3px] md:w-16" />
        </motion.div>

        <motion.p
          {...fade(0.2)}
          className="absolute inset-x-0 top-[14%] text-center text-[4.7vw] font-light leading-[1.2] text-white/90 md:static md:mt-10 md:text-start md:text-3xl"
        >
          קוראים לי
        </motion.p>

        <motion.h1
          {...fade(0.3)}
          className="absolute inset-x-0 top-[17%] text-center text-[13.4vw] font-black leading-[1.1] tracking-[-0.01em] text-white md:static md:mt-2 md:text-start md:text-[88px] lg:text-[104px]"
        >
          <span className="text-gold-soft">יעקב</span>-אליה
        </motion.h1>

        <motion.div
          {...fade(0.45)}
          className="absolute inset-x-[14.6%] top-[68.06%] grid h-[9.14vw] grid-cols-2 gap-[2vw] md:static md:mt-12 md:h-16 md:w-[460px] md:gap-4"
        >
          <button
            onClick={openChat}
            className="flex items-center justify-center gap-[2.4vw] rounded-[1.9vw] bg-[linear-gradient(180deg,#f8d995,#e7b262_60%,#dfa650)] text-[3.55vw] font-bold text-[#1d1407] shadow-[0_6px_24px_-8px_rgba(231,178,98,0.7)] transition-transform hover:scale-[1.02] md:gap-3 md:rounded-2xl md:text-lg"
          >
            <Send className="h-[3.6vw] w-[3.6vw] md:h-5 md:w-5" strokeWidth={2.4} />
            בואו נדבר
          </button>
          <Link
            href="/#services"
            className="flex items-center justify-center gap-[3.4vw] rounded-[1.9vw] border-[max(0.22vw,1px)] border-[#e3b869] bg-[rgba(8,7,6,0.84)] text-[3.55vw] font-bold text-white transition-colors hover:bg-black md:gap-3 md:rounded-2xl md:border-[1.5px] md:text-lg"
          >
            לשירותים שלי
            <LayoutPanelLeft className="h-[3.3vw] w-[3.3vw] md:h-5 md:w-5" strokeWidth={1.8} />
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 md:relative"
      >
        <Image
          src="/home/hero.webp"
          alt="יעקב-אליה במשרד"
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover md:object-top"
        />
        <div
          aria-hidden
          className="absolute inset-0 hidden bg-[linear-gradient(to_left,#0b0a09_0%,transparent_28%),linear-gradient(to_top,#0b0a09_0%,transparent_30%)] md:block"
        />
      </motion.div>

      <span
        aria-hidden
        className="absolute left-1/2 top-[77.75%] z-10 h-[4.2%] w-px -translate-x-1/2 bg-white/40 md:top-auto md:bottom-[104px] md:h-10"
      />
      <span
        aria-hidden
        className="absolute left-1/2 top-[83.7%] z-10 h-[6.7vw] w-[4.05vw] -translate-x-1/2 rounded-full border-[max(0.3vw,1.5px)] border-white/90 md:top-auto md:bottom-[56px] md:h-9 md:w-[22px] md:border-2"
      >
        <span className="absolute left-1/2 top-[18%] h-[0.8vw] w-[0.8vw] -translate-x-1/2 rounded-full bg-white md:h-1 md:w-1" />
      </span>
      <span className="absolute inset-x-0 top-[88%] z-10 text-center text-[3.4vw] font-medium leading-[1.2] text-white md:top-auto md:bottom-6 md:text-sm">
        גלול
      </span>

      <p
        dir="ltr"
        className="font-latin absolute left-[5.5%] top-[86.85%] z-10 text-[1.45vw] font-medium uppercase leading-[1.75] tracking-[0.28em] text-white/85 md:top-auto md:bottom-8 md:left-28 md:text-[11px]"
      >
        Turning ideas
        <br />
        into real business
      </p>
      <p
        dir="ltr"
        className="font-latin absolute right-[5.3%] top-[86.85%] z-10 text-right text-[1.45vw] font-medium uppercase leading-[1.75] tracking-[0.28em] text-white/85 md:top-auto md:bottom-8 md:right-10 md:text-[11px]"
      >
        Tech <span className="mx-[0.6em] text-[#e9b863]">X</span> Marketing
        <br />
        Automation <span className="mx-[0.6em] text-[#e9b863]">X</span> Growth
      </p>
    </section>
  );
}
