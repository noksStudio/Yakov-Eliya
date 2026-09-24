"use client";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
  AnimatePresence,
  m,
  useInView,
  useReducedMotionConfig,
  useScroll,
  useTransform,
  type Transition,
} from "framer-motion";
import { Cog, MessageCircleHeart, Zap } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { whatsappLink } from "@/lib/site-config";
import { openAfter } from "@/lib/open-later";

const EASE = [0.22, 1, 0.36, 1] as const;

type Criterion = { n: string; title: string; phrase: string; icon: ReactNode; glow: string };

const criteria: Criterion[] = [
  {
    n: "01",
    title: "פתוח לטכנולוגיה",
    phrase: "אני פתוח לטכנולוגיה",
    icon: <Zap className="neon-hum h-[46%] w-[46%] text-[#b48cff]" strokeWidth={1.7} />,
    glow: "rgba(168,120,255,0.9)",
  },
  {
    n: "02",
    title: "פתוח לשתף את הקושי",
    phrase: "אני פתוח לשתף את הקושי בעסק",
    icon: <MessageCircleHeart className="neon-hum h-[46%] w-[46%] text-[#8f8cff] [animation-delay:-1.7s]" strokeWidth={1.6} />,
    glow: "rgba(130,120,255,0.9)",
  },
  {
    n: "03",
    title: "רוצה להפוך תהליכים לאוטומטיים",
    phrase: "אני רוצה להפוך תהליכים לאוטומטיים",
    icon: <Cog className="neon-hum gear-spin h-[48%] w-[48%] text-[#69a7ff] [animation-delay:-3.1s]" strokeWidth={1.6} />,
    glow: "rgba(96,165,250,0.9)",
  },
];

const DEFAULT_MESSAGE = "היי יעקב, אשמח לשמוע איך להטמיע AI בעסק שלי";

function buildMessage(selected: boolean[]) {
  const picked = criteria.filter((_, i) => selected[i]).map((c) => c.phrase);
  if (!picked.length) return DEFAULT_MESSAGE;
  return `היי יעקב, ${picked.join(", ")} — אשמח לשמוע איך להטמיע AI בעסק שלי`;
}

export function Partners() {
  const sectionRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLDivElement>(null);
  const inView = useInView(headRef, { once: true, amount: 0.4 });
  const closeInView = useInView(closeRef, { once: true, amount: 0.5 });
  const still = Boolean(useReducedMotionConfig());
  const [selected, setSelected] = useState([false, false, false]);
  const count = selected.filter(Boolean).length;
  const message = buildMessage(selected);

  const at = (delay: number, duration = 0.7, extra?: Transition): Transition =>
    still ? { duration: 0 } : { delay, duration, ease: EASE, ...extra };

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end end"] });
  const planetY = useTransform(scrollYProgress, [0, 1], still ? [0, 0] : [40, 0]);

  const toggle = (i: number) => {
    setSelected((prev) => prev.map((v, k) => (k === i ? !v : v)));
    if (!still) navigator.vibrate?.(8);
  };

  return (
    <section ref={sectionRef} id="partners" className="relative overflow-hidden bg-[#07070e] text-white">
      <Backdrop inView={inView} still={still} />

      <div className="relative mx-auto max-w-[1024px] pt-[12vw] md:pt-28">
        <div ref={headRef} className="px-[5vw] text-center">
          <m.p
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={at(0.2)}
            className="text-[length:max(3.4vw,14px)] font-medium text-white/60 md:text-2xl"
          >
            הטמעת AI לא מתאימה לכל בעל עסק.
          </m.p>
          <h2 className="mt-[3vw] overflow-hidden pb-[0.08em] text-[length:max(10.4vw,40px)] font-black leading-[1.05] md:mt-6 md:text-[96px]">
            <m.span
              className="inline-block"
              initial={{ y: "110%" }}
              animate={inView ? { y: "0%" } : undefined}
              transition={at(0.55, 0.9)}
            >
              אבל אם <span className="text-violet-blue">אתה</span>
              <span aria-hidden className="typing-ellipsis text-[#5b8cff]">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </m.span>
          </h2>
        </div>

        <div
          role="group"
          aria-label="אבל אם אתה…"
          dir="ltr"
          className="mt-[7vw] grid gap-[3vw] pl-[52px] pr-[5vw] md:mt-16 md:grid-cols-3 md:gap-0 md:px-6"
        >
          {criteria.map((c, i) => (
            <CriterionCard
              key={c.n}
              c={c}
              index={i}
              checked={selected[i]}
              onToggle={() => toggle(i)}
              show={inView}
              still={still}
            />
          ))}
        </div>

        <div ref={closeRef} className="mt-[9vw] px-[5vw] text-center md:mt-16">
          <m.a
            href={whatsappLink(message)}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 12 }}
            animate={closeInView ? { opacity: 0.5 + (0.5 * count) / 3, y: 0 } : undefined}
            transition={still ? { duration: 0 } : { duration: 0.6, ease: EASE }}
            className="inline-block text-[length:max(7vw,28px)] font-black leading-tight text-violet-wave md:text-[64px]"
          >
            יש לנו על מה לדבר.
          </m.a>
          <m.p
            initial={{ opacity: 0, y: 10 }}
            animate={closeInView ? { opacity: 1, y: 0 } : undefined}
            transition={at(0.15, 0.6)}
            className="mt-[1.6vw] text-[length:max(3.4vw,14px)] text-white/75 md:mt-4 md:text-2xl"
          >
            כנראה שאוכל לעזור לך להטמיע AI בעסק שלך.
          </m.p>

          <div className="mt-[5vw] flex min-h-[max(12vw,56px)] justify-center md:mt-10 md:min-h-[72px]">
            <AnimatePresence>
              {count > 0 && <TalkButton key="talk" message={message} complete={count === 3} still={still} />}
            </AnimatePresence>
          </div>
        </div>

        <m.div style={{ y: planetY }} className="relative mt-[4vw] h-[max(28vw,120px)] md:mt-8 md:h-[260px]">
          <Sunrise level={count / 3} still={still} />
          <div className="absolute left-1/2 top-0 aspect-square w-[210vw] -translate-x-1/2 rounded-full border-t-[1.5px] border-[#a99bff]/90 bg-[radial-gradient(ellipse_at_50%_0%,#1b1a3a_0%,#0c0c1c_18%,#07070e_40%)] shadow-[0_-6px_40px_rgba(124,58,237,0.45),inset_0_10px_30px_rgba(139,122,255,0.25)] md:w-[2200px]" />
          <span className="absolute left-1/2 top-[max(2vw,9px)] h-[max(4.9vw,20px)] w-px -translate-x-1/2 overflow-hidden bg-white/25 md:top-5 md:h-12">
            <span className="line-drip absolute inset-x-0 top-0 h-2/5 bg-[linear-gradient(to_bottom,transparent,#c9c2ff,transparent)]" />
          </span>
          <div
            dir="ltr"
            className="font-latin absolute inset-x-0 top-[max(9.2vw,38px)] text-center text-[length:max(1.1vw,7px)] font-medium leading-[2.2] tracking-[0.45em] text-[#8e90ad] md:top-24 md:text-xs"
          >
            GOOD BUSINESSES
            <br />
            BUILD A BRIGHTER TOMORROW
          </div>
        </m.div>
      </div>
    </section>
  );
}

function CriterionCard({
  c,
  index,
  checked,
  onToggle,
  show,
  still,
}: {
  c: Criterion;
  index: number;
  checked: boolean;
  onToggle: () => void;
  show: boolean;
  still: boolean;
}) {
  const delay = 0.95 + index * 0.15;
  return (
    <m.button
      type="button"
      dir="rtl"
      aria-pressed={checked}
      onClick={onToggle}
      initial={{ opacity: 0, y: 16 }}
      animate={show ? { opacity: 1, y: 0 } : undefined}
      transition={still ? { duration: 0 } : { delay, duration: 0.6, ease: EASE }}
      whileTap={still ? undefined : { scale: 0.97 }}
      className={`group relative flex items-center gap-[4vw] rounded-2xl border px-[4vw] py-[3.4vw] text-right transition-[border-color,background-color,box-shadow] duration-300 md:flex-col md:gap-0 md:rounded-none md:border-0 md:bg-transparent md:px-5 md:py-2 md:text-center md:shadow-none ${
        index > 0 ? "md:border-l md:border-white/[0.07]" : ""
      } ${
        checked
          ? "border-[#8b7cf6]/60 bg-[#6d5bd0]/[0.12] shadow-[0_0_28px_-10px_rgba(139,92,246,0.8)]"
          : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
      }`}
    >
      <span className="relative flex shrink-0 items-center justify-center md:flex-col">
        <span className="relative hidden md:block">
          <span className="font-latin text-outline-num block text-[150px] font-bold leading-[0.9]">{c.n}</span>
          <m.span
            aria-hidden
            initial={false}
            animate={{ clipPath: checked ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)" }}
            transition={still ? { duration: 0 } : { duration: 0.55, ease: EASE }}
            className="font-latin text-violet-blue absolute inset-0 block text-[150px] font-bold leading-[0.9] opacity-80"
          >
            {c.n}
          </m.span>
        </span>
        <span
          className={`relative flex aspect-square w-[max(13vw,52px)] items-center justify-center rounded-[28%] border bg-[linear-gradient(160deg,#1b1c33,#0f1020)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_30px_-10px_rgba(99,102,241,0.45)] transition-[border-color,box-shadow] duration-300 md:-mt-9 md:w-[118px] ${
            checked ? "border-[#a096ff]/70" : "border-[#a096ff]/20"
          } ${show ? "neon-on" : "opacity-0"}`}
          style={{
            ["--neon" as string]: c.glow,
            animationDelay: `${delay + 0.1}s`,
            boxShadow: checked ? `0 0 26px -4px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.08)` : undefined,
          }}
        >
          {c.icon}
          <span className="font-latin absolute -top-[0.9em] right-[-0.2em] text-[length:max(3vw,11px)] font-bold text-[#8a86c8] md:hidden">
            {c.n}
          </span>
        </span>
      </span>

      <span className="flex-1 text-[length:max(4.6vw,17px)] font-extrabold leading-[1.25] md:mt-8 md:text-[30px]">{c.title}</span>

      <CheckMark checked={checked} still={still} />
    </m.button>
  );
}

function CheckMark({ checked, still }: { checked: boolean; still: boolean }) {
  return (
    <span
      aria-hidden
      className={`relative flex h-[max(7.4vw,30px)] w-[max(7.4vw,30px)] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-[background-color,border-color,box-shadow] duration-300 md:mt-6 md:h-11 md:w-11 ${
        checked
          ? "border-transparent bg-[linear-gradient(135deg,#a855f7,#4d8bf6)] shadow-[0_0_18px_-2px_rgba(139,92,246,0.9)]"
          : "border-white/25 group-hover:border-white/50"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-[58%] w-[58%]">
        <m.path
          d="M5 12.5l4.2 4.2L19 7"
          fill="none"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={still ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
        />
      </svg>
    </span>
  );
}

function TalkButton({ message, complete, still }: { message: string; complete: boolean; still: boolean }) {
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
    <m.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      initial={{ opacity: 0, y: 14, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: launching ? [1, 0.96, 1.02, 1] : 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.96 }}
      transition={still ? { duration: 0 } : { duration: 0.45, ease: EASE }}
      className={`relative inline-flex h-[max(12vw,52px)] items-center gap-3 overflow-hidden rounded-full px-[max(6vw,24px)] text-[length:max(4vw,16px)] font-bold text-white transition-shadow duration-500 md:h-[68px] md:px-9 md:text-xl ${
        complete
          ? "bg-[linear-gradient(115deg,#8b5cf6,#5f8ef8)] shadow-[0_0_40px_-6px_rgba(139,92,246,0.95)]"
          : "border border-[#8b7cf6]/60 bg-[#12122a] shadow-[0_0_24px_-10px_rgba(139,92,246,0.7)]"
      }`}
    >
      <AnimatePresence>
        {ripple && (
          <m.span
            key={ripple.key}
            aria-hidden
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            onAnimationComplete={() => setRipple(null)}
            className="absolute h-[400%] w-[160%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.6),rgba(255,255,255,0.12)_60%,transparent)]"
            style={{ left: ripple.x, top: ripple.y }}
          />
        )}
      </AnimatePresence>
      <WhatsAppIcon className="relative h-[1.3em] w-[1.3em]" />
      <span className="relative">בוא נדבר בוואטסאפ</span>
    </m.a>
  );
}

// Warm light rising behind the planet: one step per ticked criterion.
function Sunrise({ level, still }: { level: number; still: boolean }) {
  return (
    <m.div
      aria-hidden
      initial={false}
      animate={{ opacity: 0.15 + level * 0.85, y: `${(1 - level) * 30}%` }}
      transition={still ? { duration: 0 } : { duration: 1.1, ease: EASE }}
      className="pointer-events-none absolute left-1/2 top-[-60%] aspect-[2/1] w-[min(130vw,1100px)] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,226,170,0.55)_0%,rgba(190,140,255,0.35)_28%,rgba(99,102,241,0.15)_52%,transparent_70%)]"
    />
  );
}

function Backdrop({ inView, still }: { inView: boolean; still: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <m.div
        initial={{ opacity: 0, rotate: -12 }}
        animate={inView ? { opacity: 1, rotate: 0 } : undefined}
        transition={still ? { duration: 0 } : { duration: 1.4, ease: EASE }}
        className="absolute -left-[46.8vw] -top-[51.6vw] aspect-square w-[74vw] rounded-full border-[1.5px] border-[#8f7bff]/80 bg-[radial-gradient(circle_at_75%_75%,rgba(124,92,246,0.28),transparent_45%)] shadow-[0_0_40px_rgba(139,92,246,0.45)] md:-left-[480px] md:-top-[530px] md:w-[760px]"
      />
      <div className="absolute -right-[10vw] top-[54%] aspect-square w-[16vw] rounded-full border border-[#6d5bd0]/45" />
      <div className="absolute -right-[12vw] top-[16%] h-[34vw] w-[26vw] rounded-full bg-[radial-gradient(closest-side,rgba(99,80,220,0.22),transparent)] blur-xl" />
      <div className="absolute right-[3vw] top-[30%] grid grid-cols-3 gap-[1.6vw] opacity-50">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className="twinkle h-[0.35vw] min-h-[2px] w-[0.35vw] min-w-[2px] rounded-full bg-[#7c7fd6]" style={{ animationDelay: `${(i * 0.7) % 4}s` }} />
        ))}
      </div>
    </div>
  );
}
