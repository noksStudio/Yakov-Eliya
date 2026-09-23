"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotionConfig,
  useScroll,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import { whatsappLink } from "@/lib/site-config";
import { openAfter } from "@/lib/open-later";

type Service = {
  n: string;
  title: [string, string?];
  desc: string;
  tags: string[];
  tagsDir: "rtl" | "ltr";
  img: {
    src: string;
    w: number;
    h: number;
    left: string;
    top: string;
    width: string;
  };
  message: string;
};

const services: Service[] = [
  {
    n: "01",
    title: ["מערכי שיווק"],
    desc: "אסטרטגיה, משפכים, קמפיינים, ניהול לידים ושיפור הדרך שבה העסק שלכם מושך וממיר לקוחות.",
    tags: ["אסטרטגיה", "קמפיינים", "משפכים", "לידים"],
    tagsDir: "rtl",
    img: {
      src: "/home/svc-1.webp",
      w: 202,
      h: 236,
      left: "56.3%",
      top: "2.8%",
      width: "42.9%",
    },
    message: "היי יעקב, אשמח לשמוע על מערכי שיווק לעסק שלי",
  },
  {
    n: "02",
    title: ["מערכות CRM", "ואוטומציה"],
    desc: "בניית מערכות שמרכזות לקוחות, תהליכים ומשימות ומורידות עבודה ידנית מהעסק.",
    tags: ["אינטגרציות", "אוטומציות", "WhatsApp", "CRM"],
    tagsDir: "rtl",
    img: {
      src: "/home/svc-2.webp",
      w: 190,
      h: 276,
      left: "58.1%",
      top: "3.4%",
      width: "40.6%",
    },
    message: "היי יעקב, אשמח לשמוע על מערכת CRM ואוטומציות לעסק שלי",
  },
  {
    n: "03",
    title: ["אתרים וחוויות", "דיגיטליות"],
    desc: "אתרי תדמית, דפי נחיתה, חנויות וממשקים שנבנים סביב המטרה העסקית ולא רק סביב העיצוב.",
    tags: ["Websites", "Landing Pages", "Ecommerce"],
    tagsDir: "ltr",
    img: {
      src: "/home/svc-3.webp",
      w: 200,
      h: 296,
      left: "56.9%",
      top: "2.7%",
      width: "42.5%",
    },
    message: "היי יעקב, אשמח לשמוע על בניית אתר או חוויה דיגיטלית לעסק שלי",
  },
  {
    n: "04",
    title: ["AI ומערכות", "בהתאמה אישית"],
    desc: "הטמעת AI, סוכנים חכמים ומערכות פנימיות שנבנות לפי הצורך האמיתי של העסק.",
    tags: ["AI Agents", "Systems", "SaaS", "Custom Solutions"],
    tagsDir: "ltr",
    img: {
      src: "/home/svc-4.webp",
      w: 216,
      h: 232,
      left: "52.6%",
      top: "3.9%",
      width: "46.2%",
    },
    message: "היי יעקב, אשמח לשמוע על AI ומערכות בהתאמה אישית לעסק שלי",
  },
];

const COUNT = services.length;
const STEP_SVH = 70; // scroll distance per card while the section is pinned
const EASE = [0.22, 1, 0.36, 1] as const;
const artMask =
  "linear-gradient(to right, transparent 0%, #000 16%), linear-gradient(to top, transparent 0%, #000 16%)";

type TextState = "shown" | "above" | "below";

const textGroup: Variants = {
  shown: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
  above: { transition: { staggerChildren: 0.03 } },
  below: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};
const textItem: Variants = {
  shown: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
  above: { opacity: 0, y: -14, transition: { duration: 0.3 } },
  below: { opacity: 0, y: 16, transition: { duration: 0.3 } },
};

const subscribeNoop = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

export function Services() {
  const mounted = useMounted();
  const reduce = useReducedMotionConfig();
  // Server and hydration render the pinned version; switch to the plain list only on the
  // client, so the markup always matches during hydration.
  const pinned = !(mounted && reduce);

  return (
    <section id="services" className="relative bg-[#0c0d0f]">
      {pinned ? <PinnedDeck /> : <StaticList />}
      <Tagline />
    </section>
  );
}

function PinnedDeck() {
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const inView = useInView(frameRef, { once: true, amount: 0.3 });
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });
  const t = useTransform(scrollYProgress, (p) => p * (COUNT - 1));
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const activeRef = useRef(0);

  useMotionValueEvent(t, "change", (v) => {
    const next = Math.min(COUNT - 1, Math.max(0, Math.floor(v + 0.4)));
    if (next !== activeRef.current) {
      setDir(next > activeRef.current ? 1 : -1);
      activeRef.current = next;
      setActive(next);
    }
  });

  useCardMagnet(trackRef);

  // Keyboard users tabbing onto a covered card get scrolled to the point where it is on top.
  const scrollToCard = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const top = track.getBoundingClientRect().top + window.scrollY;
    const range = track.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: top + (range * i) / (COUNT - 1),
      behavior: "smooth",
    });
  };

  return (
    <div
      ref={trackRef}
      className="relative"
      style={{ height: `${100 + (COUNT - 1) * STEP_SVH}svh` }}
    >
      <div ref={frameRef} className="sticky top-0 h-[100svh] overflow-hidden">
        <Backdrop />
        <div className="relative mx-auto flex h-full max-w-[1180px] flex-col px-[3.2vw] pb-3 pt-[84px] md:grid md:grid-cols-2 md:items-center md:gap-12 md:px-10 md:pb-10 md:pt-24">
          <Headings inView={inView} />

          <div className="relative flex min-h-0 flex-1 flex-col md:h-[min(74vh,640px)] md:flex-none">
            {/* Left inset on phones keeps card text clear of the fixed accessibility button. */}
            <div className="relative min-h-0 flex-1 overflow-hidden pl-[34px] [container-type:size] md:pl-0">
              {services.map((s, i) => (
                <StackCard
                  key={s.n}
                  service={s}
                  index={i}
                  t={t}
                  textState={
                    !inView
                      ? "below"
                      : i === active
                        ? "shown"
                        : i < active
                          ? "above"
                          : "below"
                  }
                  isTop={i === active}
                  onFocus={() => scrollToCard(i)}
                />
              ))}
            </div>
            <Counter active={active} dir={dir} t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}

// When scrolling stops part-way between two cards, glide to the nearer card in the direction
// of travel so the deck never rests on a half-entered card whose text is still hidden.
function useCardMagnet(trackRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    let idle = 0;
    let touching = false;
    let lastY = window.scrollY;
    let travel = 0;

    const settle = () => {
      const track = trackRef.current;
      if (!track || touching) return;
      const top = track.getBoundingClientRect().top + window.scrollY;
      const range = track.offsetHeight - window.innerHeight;
      const step = range / (COUNT - 1);
      const offset = window.scrollY - top;
      if (offset <= 2 || offset >= range - 2) return;
      const v = offset / step;
      const frac = v - Math.floor(v);
      if (frac < 0.02 || frac > 0.98) return;
      const target = travel >= 0 ? (frac > 0.25 ? Math.ceil(v) : Math.floor(v)) : frac < 0.75 ? Math.floor(v) : Math.ceil(v);
      window.scrollTo({ top: top + target * step, behavior: "smooth" });
    };

    const onScroll = () => {
      const y = window.scrollY;
      if (y !== lastY) travel = y - lastY;
      lastY = y;
      window.clearTimeout(idle);
      idle = window.setTimeout(settle, 140);
    };
    const onTouchStart = () => {
      touching = true;
    };
    const onTouchEnd = () => {
      touching = false;
      window.clearTimeout(idle);
      idle = window.setTimeout(settle, 140);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      window.clearTimeout(idle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [trackRef]);
}

function StackCard({
  service,
  index,
  t,
  textState,
  isTop,
  onFocus,
}: {
  service: Service;
  index: number;
  t: MotionValue<number>;
  textState: TextState;
  isTop: boolean;
  onFocus: () => void;
}) {
  const clamp = (v: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, v));
  const enter = useTransform(t, (v) => {
    if (index === 0) return "0%";
    const e = clamp(v - index + 1, 0, 1);
    const eased = 1 - Math.pow(1 - e, 3);
    return `${(1 - eased) * 105}cqh`;
  });
  const depth = useTransform(t, (v) => clamp(v - index, 0, 3));
  const scale = useTransform(depth, (d) => 1 - d * 0.05);
  const lift = useTransform(depth, (d) => -d * 8);
  const shade = useTransform(depth, (d) => Math.min(d, 1) * 0.55);

  return (
    <motion.div
      style={{ y: lift, scale, zIndex: index }}
      className="pointer-events-none absolute inset-x-0 top-7 flex origin-top justify-center"
    >
      <motion.div
        style={{ y: enter }}
        className="pointer-events-auto w-[min(100cqw,calc((100cqh_-_1.75rem)/0.98))]"
      >
        <ServiceCard
          service={service}
          textState={textState}
          isTop={isTop}
          shade={shade}
          onFocus={onFocus}
        />
      </motion.div>
    </motion.div>
  );
}

function ServiceCard({
  service: s,
  textState,
  isTop,
  shade,
  onFocus,
  instant,
}: {
  service: Service;
  textState: TextState;
  isTop?: boolean;
  shade?: MotionValue<number>;
  onFocus?: () => void;
  instant?: boolean;
}) {
  const [ripple, setRipple] = useState<{
    x: number;
    y: number;
    key: number;
  } | null>(null);
  const [launching, setLaunching] = useState(false);
  const url = whatsappLink(s.message);

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (instant) return;
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
      onFocus={(e) =>
        onFocus && e.currentTarget.matches(":focus-visible") && onFocus()
      }
      aria-label={`${s.title.join(" ")} — שליחת הודעה בוואטסאפ`}
      animate={launching ? { scale: [1, 0.965, 1.015, 1] } : { scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="@container group relative block overflow-hidden rounded-2xl border border-white/[0.13] bg-[linear-gradient(160deg,rgba(30,30,33,0.97),rgba(12,12,14,0.98))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_60px_-24px_rgba(0,0,0,0.9)] transition-[border-color,box-shadow] duration-300 hover:border-[#e0a852]/40 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_60px_-20px_rgba(224,168,82,0.35)]"
    >
      <span
        aria-hidden
        className={`card-border-run ${isTop ? "opacity-100" : "opacity-0"}`}
      />

      <div
        className="card-float pointer-events-none absolute"
        style={{
          left: s.img.left,
          top: s.img.top,
          width: s.img.width,
          maskImage: artMask,
          WebkitMaskImage: artMask,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
          animationDelay: `${Number(s.n) * -1.3}s`,
        }}
      >
        <Image
          src={s.img.src}
          alt=""
          width={s.img.w}
          height={s.img.h}
          className="h-auto w-full"
        />
      </div>

      <motion.div
        variants={textGroup}
        initial={instant ? false : "below"}
        animate={textState}
        className="relative flex min-h-[74cqw] flex-col items-end px-[6.2cqw] pb-[5.4cqw] pt-[11.5cqw] text-left"
      >
        <motion.p
          variants={textItem}
          className="font-latin w-full text-[length:3.9cqw] font-medium leading-none text-[#e0a852]"
        >
          {s.n}
        </motion.p>
        <motion.h3
          variants={textItem}
          className="mt-[2.6cqw] w-[52cqw] text-[length:7.3cqw] font-bold leading-[1.18] text-white"
        >
          {s.title[0]}
          {s.title[1] && (
            <>
              <br />
              {s.title[1]}
            </>
          )}
        </motion.h3>
        <motion.p
          variants={textItem}
          className="mt-[3.4cqw] w-[52cqw] text-[length:4.45cqw] leading-[1.5] text-white/80"
        >
          {s.desc}
        </motion.p>
        <motion.p
          variants={textItem}
          dir={s.tagsDir}
          className="mt-auto w-full pt-[4.4cqw] text-left text-[length:3.3cqw] text-white/55"
        >
          {s.tags.map((tag, i) => (
            <span key={tag}>
              {i > 0 && (
                <span className="mx-[1.7cqw] text-[#e0a852]/70">•</span>
              )}
              <bdi>{tag}</bdi>
            </span>
          ))}
        </motion.p>
        <motion.div variants={textItem} className="mt-[5cqw] w-full text-left">
          <span className="inline-flex items-center gap-[2.8cqw]">
            <span className="text-[length:3.6cqw] font-semibold text-white">
              לפרטים נוספים
            </span>
            <span
              className={`relative flex h-[7.6cqw] w-[7.6cqw] items-center justify-center overflow-hidden rounded-full border border-[#e0a852] transition-colors duration-300 group-hover:bg-[#e0a852]/15 ${launching ? "bg-[#e0a852]" : ""}`}
            >
              <motion.span
                animate={
                  launching ? { x: ["0%", "160%", "-160%", "0%"] } : { x: "0%" }
                }
                transition={{
                  duration: 0.55,
                  times: [0, 0.45, 0.46, 1],
                  ease: "easeInOut",
                }}
                className="flex"
              >
                <ArrowRight
                  className={`h-[3.8cqw] w-[3.8cqw] transition-colors ${launching ? "text-[#1d1407]" : "text-[#e0a852]"}`}
                  strokeWidth={2}
                />
              </motion.span>
            </span>
          </span>
        </motion.div>
      </motion.div>

      {shade && (
        <motion.span
          aria-hidden
          style={{ opacity: shade }}
          className="pointer-events-none absolute inset-0 bg-black"
        />
      )}

      <AnimatePresence>
        {ripple && (
          <motion.span
            key={ripple.key}
            aria-hidden
            initial={{ scale: 0, opacity: 0.55 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            onAnimationComplete={() => setRipple(null)}
            className="pointer-events-none absolute h-[260%] w-[260%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(240,200,120,0.55),rgba(224,168,82,0.18)_60%,transparent)]"
            style={{ left: ripple.x, top: ripple.y }}
          />
        )}
      </AnimatePresence>
    </motion.a>
  );
}

function Counter({
  active,
  dir,
  t,
}: {
  active: number;
  dir: 1 | -1;
  t: MotionValue<number>;
}) {
  const progress = useTransform(t, (v) => v / (COUNT - 1));
  return (
    <div
      dir="ltr"
      className="mx-auto mt-2 flex w-[min(100%,260px)] items-center gap-3 md:mt-5"
    >
      <span className="font-latin relative inline-flex h-5 w-6 overflow-hidden text-sm font-semibold text-[#e0a852]">
        <AnimatePresence initial={false} mode="popLayout" custom={dir}>
          <motion.span
            key={active}
            custom={dir}
            variants={{
              enter: (d: number) => ({
                y: d > 0 ? "100%" : "-100%",
                opacity: 0,
              }),
              center: { y: "0%", opacity: 1 },
              exit: (d: number) => ({
                y: d > 0 ? "-100%" : "100%",
                opacity: 0,
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: EASE }}
            className="absolute inset-0"
          >
            {services[active].n}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="relative h-px flex-1 bg-white/15">
        <motion.span
          style={{ scaleX: progress }}
          className="absolute inset-0 origin-left bg-[#e0a852]"
        />
      </span>
      <span className="font-latin text-sm font-medium text-white/45">
        {services[COUNT - 1].n}
      </span>
    </div>
  );
}

function Headings({ inView }: { inView: boolean }) {
  const rise = (delay: number) => ({
    initial: { y: "110%" },
    animate: inView ? { y: "0%" } : undefined,
    transition: { duration: 0.8, delay, ease: EASE },
  });
  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: inView ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.6, delay, ease: EASE },
  });

  return (
    <div className="relative shrink-0 text-center md:text-start">
      <motion.p
        dir="ltr"
        initial={{ opacity: 0, letterSpacing: "0.8em" }}
        animate={inView ? { opacity: 1, letterSpacing: "0.42em" } : undefined}
        transition={{ duration: 1, ease: EASE }}
        className="font-latin text-[length:max(1.37vw,8px)] font-medium text-white/55 md:text-right md:text-[13px]"
      >
        UNDERSTAND <span className="mx-[1em]">×</span> BUILD{" "}
        <span className="mx-[1em]">×</span> GROW
      </motion.p>
      <motion.span
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : undefined}
        transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
        className="mx-auto mt-[2.4vw] block h-[max(0.2vw,1.5px)] w-[4.5vw] bg-[#c99a55] md:mx-0 md:mt-4 md:h-[2px] md:w-12"
      />
      <h2 className="mt-[2.8vw] text-[length:max(4.55vw,19px)] font-extrabold leading-[1.17] text-white md:mt-6 md:text-[40px]">
        <span className="block overflow-hidden">
          <motion.span className="block" {...rise(0.2)}>
            אני מבין את הקשיים והאתגרים
          </motion.span>
        </span>
        <span className="block overflow-hidden">
          <motion.span className="block" {...rise(0.3)}>
            בעסק שלכם
          </motion.span>
        </span>
        <span className="block overflow-hidden pb-[0.08em]">
          <motion.span className="block" {...rise(0.4)}>
            <span className={inView ? "shine-metal" : "text-gold-metal"}>
              ובונה פתרונות אישיים ללקוחות שלי
            </span>
          </motion.span>
        </span>
      </h2>
      <motion.p
        {...fade(0.55)}
        className="mx-auto mt-[2.6vw] max-w-[660px] text-[length:max(2.3vw,13px)] leading-[1.5] text-white/80 md:mx-0 md:mt-6 md:text-lg [@media(max-height:720px)]:hidden"
      >
        אני מחבר בין שיווק, טכנולוגיה ואוטומציה כדי לעזור לעסקים לצמוח, לייעל
        תהליכים ולהגיע לתוצאות אמיתיות.
      </motion.p>

      <motion.div {...fade(0.7)}>
        <p
          dir="ltr"
          className="font-latin mt-[4.4vw] text-[length:max(1.37vw,8px)] font-medium tracking-[0.42em] text-[#c1924f] md:mt-12 md:text-right md:text-[13px] [@media(max-height:720px)]:mt-[3vw]"
        >
          MY SERVICES
        </p>
        <span className="mx-auto mt-[1.8vw] block h-[max(0.2vw,1.5px)] w-[4.5vw] bg-[#c99a55] md:mx-0 md:mt-3 md:h-[2px] md:w-12" />
        <h2 className="mt-[1.8vw] text-[length:max(5.6vw,25px)] font-black leading-tight text-white md:mt-4 md:text-[52px]">
          השירותים שלי
        </h2>
        <p className="mt-[0.8vw] text-[length:max(2.15vw,12.5px)] text-white/70 md:mt-2 md:text-lg">
          פתרונות שמותאמים לעסק שלכם, לא תבניות מוכנות.
        </p>
      </motion.div>
    </div>
  );
}

function StaticList() {
  return (
    <div className="relative mx-auto max-w-[1024px] px-[3.2vw] pb-[4vw] pt-[8.8vw] md:px-8 md:pb-10 md:pt-24">
      <Backdrop />
      <Headings inView />
      <div
        dir="ltr"
        className="relative mt-[4.6vw] grid gap-[3.5vw] sm:grid-cols-2 sm:gap-[2vw] md:mt-12 md:gap-5"
      >
        {services.map((s) => (
          <div key={s.n} dir="rtl">
            <ServiceCard service={s} textState="shown" instant />
          </div>
        ))}
      </div>
    </div>
  );
}

const TAGLINE = "אותו עסק. יותר אפשרויות.";

function Tagline() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotionConfig();
  return (
    <div
      ref={ref}
      className="relative mx-auto max-w-[1024px] px-[3.2vw] pb-[5vw] pt-[6vw] text-center md:pb-16 md:pt-14"
    >
      <motion.span
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : undefined}
        transition={{ duration: 0.6, ease: EASE }}
        className="mx-auto block h-[max(0.2vw,1.5px)] w-[4.5vw] bg-[#c99a55] md:h-[2px] md:w-12"
      />
      <motion.p
        aria-label={TAGLINE}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        variants={{
          hidden: {},
          show: {
            transition: reduce
              ? {}
              : { delayChildren: 0.3, staggerChildren: 0.045 },
          },
        }}
        className="mt-[3.4vw] text-[length:max(2vw,13px)] tracking-[0.14em] text-white/60 md:mt-7 md:text-lg"
      >
        {TAGLINE.split("").map((ch, i) => (
          <motion.span
            key={i}
            aria-hidden
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { duration: 0.05 } },
            }}
          >
            {ch}
          </motion.span>
        ))}
      </motion.p>
      <motion.p
        dir="ltr"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : undefined}
        transition={{
          duration: 0.8,
          delay: reduce ? 0 : 0.3 + TAGLINE.length * 0.045,
        }}
        className="font-latin mt-[1.6vw] text-[length:max(1.07vw,7.5px)] tracking-[0.55em] text-white/45 md:mt-3 md:text-[11px]"
      >
        TECHNOLOGY FOR A BRIGHTER TOMORROW
      </motion.p>
    </div>
  );
}

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-y-0 left-0 w-[7vw] bg-[linear-gradient(to_right,rgba(70,72,78,0.28),transparent)]" />
      <div className="lamp-breathe absolute right-0 top-0 h-[41vw] w-[6vw] bg-[linear-gradient(to_left,rgba(205,140,72,0.42),rgba(120,78,38,0.14)_60%,transparent)] md:h-[55%]" />
      <div className="lamp-breathe absolute right-0 top-[40vw] h-[0.9vw] w-[5.5vw] bg-[#f2a65c] opacity-80 blur-[3px] md:top-[54%]" />
      <div className="absolute left-[-8vw] top-[24vw] h-[36vw] w-[24vw] rounded-full bg-[radial-gradient(closest-side,rgba(44,58,36,0.55),transparent)] blur-md" />
      <div className="absolute bottom-[-8vw] left-[-10vw] h-[48vw] w-[48vw] rounded-full bg-[radial-gradient(closest-side,rgba(120,128,58,0.3),transparent)] blur-2xl" />
      <div className="absolute bottom-[2vw] right-[-12vw] h-[44vw] w-[44vw] rounded-full bg-[radial-gradient(closest-side,rgba(196,112,48,0.32),transparent)] blur-2xl" />
    </div>
  );
}
