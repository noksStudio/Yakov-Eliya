"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useReducedMotionConfig,
  useScroll,
  useSpring,
  useTransform,
  type Transition,
} from "framer-motion";
import { ChevronRight, Handshake, MessageCircleMore, Zap } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { whatsappLink } from "@/lib/site-config";
import { openAfter } from "@/lib/open-later";

const EASE = [0.22, 1, 0.36, 1] as const;

const perks = [
  { icon: Handshake, label: "ביחד נבדוק אפשרויות", ambient: "perk-shake" },
  { icon: MessageCircleMore, label: "שיחה ללא התחייבות", ambient: "perk-bob" },
  { icon: Zap, label: "תגובה מהירה", ambient: "perk-flicker" },
];

const topics = [
  { id: "marketing", label: "שיווק", message: "היי יעקב, ראיתי את האתר ואשמח לשמוע על שיווק לעסק שלי" },
  { id: "system", label: "מערכת", message: "היי יעקב, ראיתי את האתר ואשמח לשמוע על מערכת לעסק שלי" },
  { id: "website", label: "אתר", message: "היי יעקב, ראיתי את האתר ואשמח לשמוע על בניית אתר לעסק שלי" },
] as const;
const DEFAULT_MESSAGE = "היי יעקב, ראיתי את האתר ואשמח לשמוע יותר";

// Seconds after the section enters view.
const T = { phone: 0, eyebrow: 0.1, title: 0.25, sub: 0.45, body: 0.55, typing: 0.8, bubble: 1.9, badge: 2.0, line1: 2.5, line2: 3.1, arrow: 3.8, chips: 0.8, button: 0.95, perks: 1.15 };

const phoneMask =
  "linear-gradient(to left, transparent 0%, #000 14%), linear-gradient(to top, transparent 0%, #000 16%)";

// Layer boxes, as % of the 482×640 phone image they were cut from.
const LAYERS = {
  bubble: { left: "9.129%", top: "35.156%", width: "67.635%" },
  note: { left: "6.224%", top: "67.188%", width: "56.017%" },
  arrow: { left: "47.51%", top: "58.75%", width: "14.108%" },
};

export function WhatsAppCta() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.35 });
  const still = Boolean(useReducedMotionConfig());
  const [topic, setTopic] = useState<(typeof topics)[number]["id"] | null>(null);
  const message = topics.find((t) => t.id === topic)?.message ?? DEFAULT_MESSAGE;

  const at = (delay: number, duration = 0.7, extra?: Transition): Transition =>
    still ? { duration: 0 } : { delay, duration, ease: EASE, ...extra };
  const show = (to: Record<string, string | number>) => (inView ? to : undefined);

  return (
    <section ref={sectionRef} id="whatsapp" className="relative overflow-hidden bg-[#0d0e11]">
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-[2vw] w-[62vw] bg-[linear-gradient(to_left,#26272c,#1c1d21)] [clip-path:polygon(0_0,100%_0,100%_100%,35%_100%)] md:h-5"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[10vw] -top-[20vw] h-[60vw] w-[70vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.05),transparent)]"
      />

      <div className="relative mx-auto grid max-w-[1100px] grid-cols-[61fr_39fr] items-start md:grid-cols-[49fr_47fr]">
        <div className="py-[6.4vw] pe-[2vw] ps-[4.3vw] md:py-16 md:pe-4 md:ps-10">
          <div className="flex items-center gap-[3vw] md:gap-5">
            <motion.span
              dir="ltr"
              initial={{ opacity: 0, letterSpacing: "0.7em" }}
              animate={show({ opacity: 1, letterSpacing: "0.35em" })}
              transition={at(T.eyebrow, 0.9)}
              className="font-latin text-[length:max(1.4vw,7.5px)] font-medium text-white/60 md:text-[13px]"
            >
              LET&apos;S CONNECT
            </motion.span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={show({ scaleX: 1 })}
              transition={at(T.eyebrow + 0.2, 0.7)}
              className="h-px w-[7vw] origin-right bg-white/30 md:w-20"
            />
          </div>

          <h2 className="mt-[3.4vw] overflow-hidden pb-[0.06em] text-[length:max(7.4vw,30px)] font-black leading-[1.05] text-white md:mt-8 md:text-[76px]">
            <motion.span className="inline-block" initial={{ y: "110%" }} animate={show({ y: "0%" })} transition={at(T.title, 0.8)}>
              בעל עסק
              <motion.span
                className="inline-block"
                initial={{ y: 0 }}
                animate={inView && !still ? { y: [0, "-0.18em", 0, "-0.06em", 0] } : undefined}
                transition={{ delay: T.title + 0.75, duration: 0.6, ease: "easeOut" }}
              >
                ?
              </motion.span>
            </motion.span>
          </h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={show({ opacity: 1, y: 0 })}
            transition={at(T.sub)}
            className="mt-[1.2vw] whitespace-nowrap text-[length:max(4.3vw,14px)] font-extrabold leading-tight text-white md:mt-3 md:text-[42px]"
          >
            אני אשמח שנישאר בקשר.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={show({ opacity: 1, y: 0 })}
            transition={at(T.body)}
            className="mt-[3.4vw] text-[length:max(2vw,12px)] leading-[1.6] text-white/80 md:mt-7 md:text-xl"
          >
            יש לך שאלה, רעיון או התלבטות?
            <br />
            לחץ כאן ושלח לי הודעה בוואטסאפ – שנהיה בקשר.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={show({ opacity: 1, y: 0 })}
            transition={at(T.chips)}
            className="mt-[3.6vw] md:mt-8"
          >
            <p id="wa-topic-label" className="text-[length:max(1.7vw,11px)] font-medium text-white/55 md:text-sm">
              על מה נדבר?
            </p>
            <div role="group" aria-labelledby="wa-topic-label" className="mt-[1.4vw] flex flex-wrap gap-[1.4vw] md:mt-3 md:gap-2.5">
              {topics.map((t) => {
                const selected = topic === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setTopic(selected ? null : t.id)}
                    className={`relative rounded-full border px-[max(2.4vw,11px)] py-[max(0.9vw,5px)] text-[length:max(1.8vw,11.5px)] font-semibold transition-colors duration-200 active:scale-95 md:px-5 md:py-2 md:text-[15px] ${
                      selected
                        ? "border-[#2bd46d] bg-[#25d366]/15 text-white"
                        : "border-white/15 bg-white/[0.03] text-white/75 hover:border-white/35 hover:text-white"
                    }`}
                  >
                    {selected && (
                      <motion.span
                        layoutId="wa-topic-glow"
                        className="absolute inset-0 rounded-full shadow-[0_0_16px_-2px_rgba(37,211,102,0.65)]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={show({ opacity: 1, y: 0 })} transition={at(T.button)}>
            <WhatsAppButton message={message} still={still} />
          </motion.div>

          <div className="mt-[5vw] grid grid-cols-3 md:mt-12">
            {perks.map((p, i) => (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 10 }}
                animate={show({ opacity: 1, y: 0 })}
                transition={at(T.perks + i * 0.12, 0.6)}
                className={`flex flex-col items-center gap-[1.4vw] px-[0.8vw] text-center md:gap-3 md:px-2 ${i > 0 ? "border-s border-white/15" : ""}`}
              >
                <span className={p.ambient}>
                  <p.icon
                    className={`icon-draw h-[max(3vw,18px)] w-[max(3vw,18px)] text-[#7ea6ff] md:h-8 md:w-8 ${inView ? "is-drawn" : ""}`}
                    style={{ ["--draw-delay" as string]: `${T.perks + 0.1 + i * 0.12}s` }}
                    strokeWidth={1.5}
                  />
                </span>
                <span className="text-[length:max(1.6vw,10px)] font-medium leading-tight text-white/90 md:text-[15px]">
                  {p.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <Phone inView={inView} still={still} sectionRef={sectionRef} />
      </div>
    </section>
  );
}

function WhatsAppButton({ message, still }: { message: string; still: boolean }) {
  const [ripple, setRipple] = useState<{ x: number; y: number; key: number } | null>(null);
  const [launching, setLaunching] = useState(false);
  const url = whatsappLink(message);

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (still) return;
    e.preventDefault();
    if (launching) return;
    const r = e.currentTarget.getBoundingClientRect();
    setRipple({ x: e.clientX - r.left, y: e.clientY - r.top, key: Date.now() });
    setLaunching(true);
    openAfter(url, 420);
    window.setTimeout(() => setLaunching(false), 900);
  };

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      animate={launching ? { scale: [1, 0.96, 1.02, 1] } : { scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="wa-pulse relative mt-[3vw] flex h-[max(7.6vw,42px)] w-full items-center justify-between rounded-full bg-[linear-gradient(180deg,#36e47c,#1fc05e)] px-[max(2.6vw,12px)] whitespace-nowrap text-[length:max(2.2vw,12px)] font-bold text-white shadow-[0_12px_30px_-12px_rgba(37,211,102,0.7)] transition-shadow duration-300 hover:shadow-[0_14px_40px_-10px_rgba(37,211,102,0.95)] md:mt-6 md:h-[78px] md:max-w-[455px] md:px-7 md:text-[22px]"
    >
      <span className="absolute inset-0 overflow-hidden rounded-full">
        <AnimatePresence>
          {ripple && (
            <motion.span
              key={ripple.key}
              aria-hidden
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              onAnimationComplete={() => setRipple(null)}
              className="absolute h-[500%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.7),rgba(255,255,255,0.15)_60%,transparent)]"
              style={{ left: ripple.x, top: ripple.y }}
            />
          )}
        </AnimatePresence>
      </span>
      <motion.span
        className="relative flex"
        animate={launching ? { x: [0, -10, 0] } : { x: 0 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
      >
        <ChevronRight className="h-[max(2.6vw,15px)] w-[max(2.6vw,15px)] md:h-7 md:w-7" strokeWidth={2.4} />
      </motion.span>
      <span className="relative">שלח לי הודעה בוואטסאפ</span>
      <span className="wa-wiggle relative flex">
        <WhatsAppIcon className="h-[max(4.2vw,22px)] w-[max(4.2vw,22px)] md:h-11 md:w-11" />
      </span>
    </motion.a>
  );
}

function Phone({
  inView,
  still,
  sectionRef,
}: {
  inView: boolean;
  still: boolean;
  sectionRef: React.RefObject<HTMLElement | null>;
}) {
  const at = (delay: number, duration = 0.7, extra?: Transition): Transition =>
    still ? { duration: 0 } : { delay, duration, ease: EASE, ...extra };

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const drift = useTransform(scrollYProgress, [0, 1], still ? [0, 0] : [30, -30]);

  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(tiltX, { stiffness: 80, damping: 18 });
  const rotateY = useSpring(tiltY, { stiffness: 80, damping: 18 });
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || still || !window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      tiltY.set(((e.clientX - r.left) / r.width - 0.5) * 10);
      tiltX.set(((e.clientY - r.top) / r.height - 0.5) * -8);
    };
    const reset = () => {
      tiltX.set(0);
      tiltY.set(0);
    };
    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", reset);
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", reset);
      reset();
    };
  }, [still, sectionRef, tiltX, tiltY]);

  // Typing dots show between T.typing and T.bubble.
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (!inView || still) return;
    const on = window.setTimeout(() => setTyping(true), T.typing * 1000);
    const off = window.setTimeout(() => setTyping(false), T.bubble * 1000);
    return () => {
      window.clearTimeout(on);
      window.clearTimeout(off);
    };
  }, [inView, still]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -40, rotate: -4 }}
      animate={inView ? { opacity: 1, x: 0, rotate: 0 } : undefined}
      transition={at(T.phone, 1)}
      className="relative [perspective:900px]"
    >
      <motion.div style={{ y: drift, rotateX, rotateY }} className="phone-float">
        <div
          className="relative aspect-[482/640] w-full [-webkit-mask-composite:source-in] [mask-composite:intersect] [mask-image:var(--phone-mask)] md:[mask-image:var(--phone-mask),linear-gradient(to_right,transparent,#000_14%)]"
          style={{ ["--phone-mask" as string]: phoneMask }}
          role="img"
          aria-label="הודעת וואטסאפ: היי, אשמח לשמוע יותר ולבדוק איך אפשר להתקדם יחד! — רעיונות גדולים מתחילים בשיחה קטנה"
        >
          <Image src="/home/wa-phone-base.webp" alt="" fill sizes="(min-width: 768px) 520px, 44vw" className="object-cover" />

          <motion.span
            aria-hidden
            initial={{ scale: 0, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : undefined}
            transition={still ? { duration: 0 } : { delay: T.badge, type: "spring", stiffness: 520, damping: 14 }}
            className="absolute left-[41.3%] top-[22%] flex aspect-square w-[5%] items-center justify-center rounded-full bg-[#ff3b30] text-[length:max(1.3vw,8px)] font-bold leading-none text-white shadow-[0_2px_8px_rgba(255,59,48,0.6)] md:text-[11px]"
          >
            1
          </motion.span>

          <AnimatePresence>
            {typing && (
              <motion.span
                aria-hidden
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 420, damping: 24 }}
                className="absolute left-[60%] top-[45%] flex h-[4.8%] w-[13%] -rotate-[7.4deg] items-center justify-center gap-[6%] rounded-full border border-white/15 bg-[rgba(70,82,104,0.6)] backdrop-blur-sm"
              >
                {[0, 1, 2].map((d) => (
                  <span key={d} className="typing-dot aspect-square w-[14%] rounded-full bg-white/85" style={{ animationDelay: `${d * 0.15}s` }} />
                ))}
              </motion.span>
            )}
          </AnimatePresence>

          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.55, y: "12%" }}
            animate={inView ? { opacity: 1, scale: 1, y: "0%" } : undefined}
            transition={still ? { duration: 0 } : { delay: T.bubble, type: "spring", stiffness: 260, damping: 20 }}
            className="absolute origin-[92%_75%]"
            style={LAYERS.bubble}
          >
            <Image src="/home/wa-bubble.webp" alt="" width={326} height={163} className="h-auto w-full" />
          </motion.div>

          <div aria-hidden className="absolute" style={LAYERS.note}>
            <motion.div
              initial={{ clipPath: "polygon(100% 0%, 100% 0%, 100% 34%, 100% 34%)" }}
              animate={inView ? { clipPath: "polygon(0% 0%, 100% 0%, 100% 34%, 0% 57.2%)" } : undefined}
              transition={at(T.line1, 0.75, { ease: "easeInOut" })}
            >
              <Image src="/home/wa-note.webp" alt="" width={270} height={102} className="h-auto w-full" />
            </motion.div>
            <motion.div
              className="absolute inset-0"
              initial={{ clipPath: "polygon(100% 34%, 100% 34%, 100% 100%, 100% 100%)" }}
              animate={inView ? { clipPath: "polygon(0% 57.2%, 100% 34%, 100% 100%, 0% 100%)" } : undefined}
              transition={at(T.line2, 0.9, { ease: "easeInOut" })}
            >
              <Image src="/home/wa-note.webp" alt="" width={270} height={102} className="h-auto w-full" />
            </motion.div>
          </div>

          <motion.div
            aria-hidden
            initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
            animate={inView ? { clipPath: "inset(0% 0% 0% 0%)" } : undefined}
            transition={at(T.arrow, 0.55, { ease: "easeOut" })}
            className="absolute"
            style={LAYERS.arrow}
          >
            <Image src="/home/wa-arrow.webp" alt="" width={68} height={80} className="h-auto w-full" />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
