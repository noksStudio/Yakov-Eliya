"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  m,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotionConfig,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useScrollMagnet } from "@/lib/use-scroll-magnet";

type Step = {
  n: string;
  // Words before, inside and after the emphasised part of the title.
  title: [string, string, string];
  // Placement: north/south sit in the tall stage's top/bottom bands, east/west inside the
  // compass square. West drops below its node on phones, clear of the accessibility button.
  place: string;
  size: string;
  inSquare: boolean;
};

// The orbit lives in a 400×400 square; the dashed line follows radius R around (200,200).
const R = 108;
const COUNT = 4;
const STEP_SVH = 75;
const EASE = [0.22, 1, 0.36, 1] as const;

const steps: Step[] = [
  {
    n: "01",
    title: ["", "הבנת האתגרים", " בעסק\nוהצבת יעדים"],
    place: "inset-x-[6%] top-0 h-[26%] justify-end pb-[2%] md:h-[20%]",
    size: "text-[length:5.2cqw] md:text-[length:3.7cqw]",
    inSquare: false,
  },
  {
    n: "02",
    title: ["בניית\n", "אסטרטגיה", ""],
    place: "left-[78.5%] right-0 top-1/2 -translate-y-1/2",
    size: "text-[length:4.3cqw] md:text-[length:3.3cqw]",
    inSquare: true,
  },
  {
    n: "03",
    title: ["", "ביצוע", " והטמעה"],
    place: "inset-x-[6%] top-[75%] md:top-[81%]",
    size: "text-[length:5.2cqw] md:text-[length:3.7cqw]",
    inSquare: false,
  },
  {
    n: "04",
    title: ["", "מדידה", "\nושיפור"],
    place: "left-0 right-[78.5%] top-[56%] md:top-1/2 md:-translate-y-1/2",
    size: "text-[length:4.3cqw] md:text-[length:3.3cqw]",
    inSquare: true,
  },
];

// Point on the orbit for progress p ∈ [0,1]: starts at north and runs clockwise to west.
const orbitAngle = (p: number) => -90 + 270 * p;
const orbitPoint = (p: number) => {
  const a = (orbitAngle(p) * Math.PI) / 180;
  return { x: 200 + R * Math.cos(a), y: 200 + R * Math.sin(a) };
};
// 270° arc from north, clockwise, ending at west.
const ORBIT_PATH = `M 200 ${200 - R} A ${R} ${R} 0 1 1 ${200 - R} 200`;

export function Process() {
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const still = Boolean(useReducedMotionConfig());
  const inView = useInView(frameRef, { once: true, amount: 0.4 });

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 26, restDelta: 0.0005 });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(COUNT - 1, Math.max(0, Math.floor(v * (COUNT - 1) + 0.35))));
  });
  useScrollMagnet(trackRef, COUNT);

  const goTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const top = track.getBoundingClientRect().top + window.scrollY;
    const range = track.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (range * i) / (COUNT - 1), behavior: still ? "auto" : "smooth" });
  };

  return (
    <section
      id="process"
      className="relative bg-[linear-gradient(180deg,#e6ebf1_0%,#edf0f4_40%,#e8ecf1_100%)] text-[#0e1322]"
    >
      <div ref={trackRef} className="relative" style={{ height: `${100 + (COUNT - 1) * STEP_SVH}svh` }}>
        <div ref={frameRef} className="sticky top-0 h-[100svh] overflow-hidden">
          <Backdrop />
          <div className="relative flex h-full flex-col items-center justify-center px-3 pb-6 pt-[84px] md:pt-24">
            <div
              ref={stageRef}
              className="relative aspect-[400/520] w-[min(96vw,calc((100svh-170px)*0.77),620px)] [container-type:inline-size] md:aspect-square md:w-[min(96vw,calc(100svh-190px),620px)]"
            >
              <div className="absolute inset-x-0 top-1/2 aspect-square -translate-y-1/2">
                <Orbit p={p} active={active} inView={inView} still={still} />
                <Compass p={p} inView={inView} still={still} stageRef={stageRef} />
                {steps.map((s, i) =>
                  s.inSquare ? (
                    <StepLabel key={s.n} step={s} index={i} active={active} inView={inView} still={still} onSelect={() => goTo(i)} />
                  ) : null
                )}
              </div>
              {steps.map((s, i) =>
                s.inSquare ? null : (
                  <StepLabel key={s.n} step={s} index={i} active={active} inView={inView} still={still} onSelect={() => goTo(i)} />
                )
              )}
            </div>

            <m.p
              initial={{ opacity: 0, y: 12 }}
              animate={active === COUNT - 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={still ? { duration: 0 } : { duration: 0.6, ease: EASE }}
              className="mt-3 text-[length:max(4.4vw,18px)] font-black md:mt-6 md:text-4xl"
            >
              בלי ניחושים<span className="text-[#c8963e]">.</span>
            </m.p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Orbit({ p, active, inView, still }: { p: MotionValue<number>; active: number; inView: boolean; still: boolean }) {
  const dotX = useTransform(p, (v) => orbitPoint(Math.min(1, Math.max(0, v))).x);
  const dotY = useTransform(p, (v) => orbitPoint(Math.min(1, Math.max(0, v))).y);
  const drawn = useTransform(p, (v) => Math.min(1, Math.max(0.001, v)));

  return (
    <m.svg
      viewBox="0 0 400 400"
      aria-hidden
      className="absolute inset-0 h-full w-full overflow-visible"
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : undefined}
      transition={still ? { duration: 0 } : { duration: 0.8, delay: 0.3 }}
    >
      <defs>
        <mask id="orbit-drawn" maskUnits="userSpaceOnUse">
          <m.path d={ORBIT_PATH} fill="none" stroke="#fff" strokeWidth="8" style={{ pathLength: drawn }} />
        </mask>
        <radialGradient id="orbit-dot" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6dc" />
          <stop offset="45%" stopColor="#f0c878" />
          <stop offset="100%" stopColor="#f0c878" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Remaining route, faint, so the eye knows where the path goes next. */}
      <path d={ORBIT_PATH} fill="none" stroke="#c8963e" strokeOpacity="0.18" strokeWidth="1.4" strokeDasharray="3 6" strokeLinecap="round" />
      <g mask="url(#orbit-drawn)">
        <path
          d={ORBIT_PATH}
          fill="none"
          stroke="#c8963e"
          strokeWidth="1.8"
          strokeDasharray="5 6"
          strokeLinecap="round"
          className="orbit-flow"
        />
      </g>

      {steps.map((_, i) => {
        const pt = orbitPoint(i / (COUNT - 1));
        const on = i <= active;
        return (
          <g key={i}>
            {on && i === active && (
              <circle cx={pt.x} cy={pt.y} r="6" fill="none" stroke="#e0a852" strokeWidth="1.2" className="node-ping" style={{ transformOrigin: `${pt.x}px ${pt.y}px` }} />
            )}
            <circle
              cx={pt.x}
              cy={pt.y}
              r={on ? 5.5 : 4}
              fill={on ? "#e0a852" : "#eef1f5"}
              stroke="#c8963e"
              strokeWidth="1.3"
              style={{ transition: "all 0.35s ease", filter: on ? "drop-shadow(0 0 5px rgba(224,168,82,0.8))" : "none" }}
            />
          </g>
        );
      })}

      <m.circle cx={dotX} cy={dotY} r="11" fill="url(#orbit-dot)" />
      <m.circle cx={dotX} cy={dotY} r="3.2" fill="#fffaf0" />
    </m.svg>
  );
}

function Compass({
  p,
  inView,
  still,
  stageRef,
}: {
  p: MotionValue<number>;
  inView: boolean;
  still: boolean;
  stageRef: React.RefObject<HTMLDivElement | null>;
}) {
  // Needle target follows the travelling dot; a loose spring gives it a real needle's overshoot.
  const pull = useMotionValue(0);
  const target = useTransform([p, pull], ([v, m]: number[]) => 270 * Math.min(1, Math.max(0, v)) + m);
  const swing = useSpring(target, still ? { stiffness: 1000, damping: 100 } : { stiffness: 55, damping: 6.5, mass: 1.1 });
  const jitter = useMotionValue(0);
  const onScreen = useInView(stageRef);
  useAnimationFrame((t) => {
    if (still || !onScreen) return;
    jitter.set(1.1 * Math.sin(t / 430) + 0.6 * Math.sin(t / 173 + 1.3) + 0.35 * Math.sin(t / 71 + 0.4));
  });
  const rotate = useTransform([swing, jitter], ([a, j]: number[]) => a + j);

  // The card under the needle floats a touch too, and the glass glare drifts with scroll.
  const glareX = useTransform(p, [0, 1], still ? ["0%", "0%"] : ["-6%", "8%"]);
  const glareY = useTransform(p, [0, 1], still ? ["0%", "0%"] : ["-4%", "6%"]);

  // Desktop: the needle is pulled slightly toward the cursor, like a magnet passing by.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || still || !window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      pull.set(Math.max(-9, Math.min(9, dx / 30)));
    };
    const reset = () => pull.set(0);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", reset);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", reset);
      reset();
    };
  }, [still, stageRef, pull]);

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.9, rotate: -25 }}
      animate={inView ? { opacity: 1, scale: 1, rotate: 0 } : undefined}
      transition={still ? { duration: 0 } : { duration: 1.2, ease: EASE }}
      className="absolute left-1/2 top-1/2 aspect-square w-[47%] -translate-x-1/2 -translate-y-1/2"
    >
      <div className="absolute inset-[4%] translate-x-[3%] translate-y-[5%] rounded-full bg-black/35 blur-[14px]" />
      <div className="compass-bob absolute inset-0">
        <Image src="/home/compass-dial-v1.webp" alt="מצפן" fill sizes="(min-width: 768px) 280px, 44vw" className="object-contain" priority={false} />
        <div className="absolute inset-0 drop-shadow-[2px_5px_4px_rgba(0,0,0,0.45)]">
          <m.div style={{ rotate }} className="absolute inset-0">
            <Image src="/home/compass-needle-v1.webp" alt="" fill sizes="(min-width: 768px) 280px, 44vw" className="object-contain" />
          </m.div>
        </div>
        {/* Glass dome: soft edge vignette, a moving glare and a thin rim highlight. */}
        <div className="pointer-events-none absolute inset-[13%] overflow-hidden rounded-full shadow-[inset_0_0_18px_rgba(0,0,0,0.35)]">
          <m.div
            style={{ x: glareX, y: glareY }}
            className="absolute -left-[10%] -top-[18%] h-[70%] w-[80%] rotate-[-28deg] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.38),rgba(255,255,255,0.08)_60%,transparent)]"
          />
          <div className="compass-sweep absolute inset-0" />
        </div>
      </div>
    </m.div>
  );
}

function StepLabel({
  step,
  index,
  active,
  inView,
  still,
  onSelect,
}: {
  step: Step;
  index: number;
  active: number;
  inView: boolean;
  still: boolean;
  onSelect: () => void;
}) {
  const reached = index <= active;
  const current = index === active;

  return (
    <m.button
      type="button"
      onClick={onSelect}
      aria-current={current ? "step" : undefined}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: reached ? 1 : 0.32, y: 0 } : undefined}
      transition={still ? { duration: 0 } : { duration: 0.5, ease: EASE, delay: inView && index === 0 ? 0.5 : 0 }}
      className={`absolute flex flex-col items-center text-center ${step.place}`}
    >
      <span
        className={`font-latin text-[length:3.2cqw] font-semibold tracking-[0.2em] transition-colors duration-300 md:text-[length:2.4cqw] ${reached ? "text-[#c8963e]" : "text-[#7c8196]"}`}
      >
        {step.n}
      </span>
      <span className={`mt-[0.8cqw] whitespace-pre-line font-extrabold leading-[1.22] ${step.size}`}>
        {step.title[0]}
        <span className="relative inline-block">
          {step.title[1]}
          <m.span
            aria-hidden
            initial={{ scaleX: 0 }}
            animate={{ scaleX: reached && inView ? 1 : 0 }}
            transition={still ? { duration: 0 } : { duration: 0.6, ease: EASE, delay: reached ? 0.15 : 0 }}
            className="absolute -bottom-[0.12em] left-0 right-0 h-[0.14em] origin-right rounded-full bg-[linear-gradient(to_left,#e8b85c,#c8963e)]"
          />
        </span>
        {step.title[2]}
      </span>
    </m.button>
  );
}

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute left-1/2 top-1/2 aspect-square w-[min(120vw,900px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.85),rgba(255,255,255,0.25)_55%,transparent)]" />
      <div className="orbit-slow absolute -right-[38vw] -top-[58vw] aspect-square w-[88vw] rounded-full border border-[#d9b36c]/70 shadow-[0_0_24px_rgba(217,179,108,0.25)] md:-right-[260px] md:-top-[480px] md:w-[760px]" />
      <div className="orbit-slow-rev absolute -bottom-[46vw] -left-[66vw] aspect-square w-[88vw] rounded-full border border-[#e2c58c]/60 md:-bottom-[380px] md:-left-[560px] md:w-[760px]" />
      <div className="bokeh-drift absolute -left-[8vw] top-[48%] h-[22vw] w-[22vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.9),transparent)] blur-xl" />
      <div className="bokeh-drift absolute -right-[6vw] bottom-[12%] h-[26vw] w-[26vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.85),transparent)] blur-xl [animation-delay:-4s]" />
    </div>
  );
}
