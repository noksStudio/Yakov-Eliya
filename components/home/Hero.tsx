"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  m,
  useAnimate,
  useMotionValue,
  useReducedMotionConfig,
  useScroll,
  useSpring,
  useTransform,
  type Transition,
} from "framer-motion";
import { LayoutPanelLeft, Send } from "lucide-react";
import { TalkLink } from "@/components/TalkLink";

type Mode = "full" | "short" | "none";

const SEEN_KEY = "hero-intro-seen";
const EASE = [0.22, 1, 0.36, 1] as const;

// Start times (s) of each beat, measured from the moment the photo has loaded.
const BEATS = {
  full: {
    loaderOut: 0.3,
    lights: 0.32,
    neon: 0.55,
    person: 0.55,
    eyebrow: 0.75,
    line: 0.85,
    pre: 0.95,
    name: 1.05,
    buttons: 1.35,
    captions: 1.6,
    loops: 1.8,
    typeStep: 0.02,
  },
  short: {
    loaderOut: 0,
    lights: 0,
    neon: 0.1,
    person: 0,
    eyebrow: 0.1,
    line: 0.15,
    pre: 0.2,
    name: 0.25,
    buttons: 0.4,
    captions: 0.55,
    loops: 0.8,
    typeStep: 0,
  },
};

const EYEBROW = "PEOPLE X IDEAS X SOLUTIONS";
const PERSON_MASK =
  "radial-gradient(ellipse 42% 27% at 50% 48%, #000 55%, transparent 100%)";

function readSeen() {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

// Mobile keeps the mockup's exact 941×1672 proportions: every element is placed by % of
// height and sized in vw, so it lines up with the matching spots in the photo.
// The intro plays in full once per session, in a short form on later visits, and not at all
// when the visitor asked for reduced motion (device setting or the accessibility menu).
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotionConfig();
  const [seen] = useState(readSeen);
  const [ready, setReady] = useState(false);
  const mode: Mode = reduce ? "none" : seen ? "short" : "full";
  const beats = mode === "short" ? BEATS.short : BEATS.full;

  useEffect(() => {
    try {
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {}
    const fallback = setTimeout(() => setReady(true), 1400);
    return () => clearTimeout(fallback);
  }, []);

  const at = (
    beat: keyof typeof BEATS.full,
    duration: number,
    extra?: Transition,
  ): Transition =>
    mode === "none"
      ? { duration: 0 }
      : {
          delay: beats[beat],
          duration: mode === "short" ? Math.min(duration, 0.5) : duration,
          ease: EASE,
          ...extra,
        };

  // Styles stay bound on every render (keeps SSR and hydration identical); "still" just
  // flattens the ranges so nothing moves.
  const still = mode === "none";
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const photoY = useTransform(
    scrollYProgress,
    [0, 1],
    still ? ["0%", "0%"] : ["0%", "16%"],
  );
  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.55],
    still ? [1, 1] : [1, 0],
  );
  const contentY = useTransform(
    scrollYProgress,
    [0, 0.55],
    still ? [0, 0] : [0, -40],
  );
  const darken = useTransform(
    scrollYProgress,
    [0, 0.8],
    still ? [0, 0] : [0, 0.6],
  );

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const tiltX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const tiltY = useSpring(mouseY, { stiffness: 60, damping: 20 });
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || still || !window.matchMedia("(pointer: fine)").matches)
      return;
    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      mouseX.set(((e.clientX - r.left) / r.width - 0.5) * -12);
      mouseY.set(((e.clientY - r.top) / r.height - 0.5) * -12);
    };
    section.addEventListener("pointermove", onMove);
    return () => {
      section.removeEventListener("pointermove", onMove);
      mouseX.set(0);
      mouseY.set(0);
    };
  }, [still, mouseX, mouseY]);

  const [neonScope, animateNeon] = useAnimate<HTMLDivElement>();
  const [neonLive, setNeonLive] = useState(false);
  const [personDone, setPersonDone] = useState(false);
  useEffect(() => {
    if (!ready || !neonScope.current) return;
    if (mode === "none") {
      animateNeon(neonScope.current, { opacity: 0.85 }, { duration: 0 });
      return;
    }
    let cancelled = false;
    const intro = animateNeon(
      neonScope.current,
      { opacity: [0, 0.9, 0.25, 1] },
      { delay: beats.neon, duration: 0.55 },
    );
    intro.then(() => {
      if (!cancelled) setNeonLive(true);
    });
    return () => {
      cancelled = true;
      intro.stop();
    };
  }, [ready, mode, beats.neon, animateNeon, neonScope]);

  const lights =
    mode === "full"
      ? {
          filter: [
            "brightness(0.1)",
            "brightness(0.1)",
            "brightness(0.75)",
            "brightness(0.3)",
            "brightness(1)",
          ],
          transitionEnd: { filter: "none" },
        }
      : { filter: "brightness(1)", transitionEnd: { filter: "none" } };

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative aspect-[941/1672] w-full overflow-hidden bg-[#0b0a09] md:grid md:aspect-auto md:min-h-[100svh] md:grid-cols-2"
    >
      {/* Loader: a gold line draws itself, then the curtain lifts. */}
      <m.div
        aria-hidden
        initial={{ opacity: 1 }}
        animate={
          ready ? { opacity: 0, transitionEnd: { display: "none" } } : undefined
        }
        transition={
          mode === "full"
            ? { delay: beats.loaderOut, duration: 0.3, ease: "easeOut" }
            : { duration: 0 }
        }
        className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-[#050505]"
      >
        <m.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: mode === "full" ? 0.45 : 0, ease: EASE }}
          className="h-[2px] w-24 rounded-full bg-[linear-gradient(90deg,transparent,#f0c878,transparent)] shadow-[0_0_14px_rgba(240,200,120,0.8)]"
        />
      </m.div>

      <m.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="absolute inset-0 z-10 md:relative md:flex md:flex-col md:items-start md:justify-center md:px-[7%] md:py-32"
      >
        <div className="absolute inset-x-0 top-[8.75%] flex flex-col items-center md:static md:items-start">
          <p
            dir="ltr"
            aria-label={EYEBROW}
            className={`font-latin text-[2.05vw] font-medium tracking-[0.34em] text-white/90 md:text-[13px] ${ready ? "type-on" : "type-off"}`}
            style={{
              ["--type-start" as string]: `${still ? 0 : beats.eyebrow}s`,
              ["--type-step" as string]: `${still ? 0 : beats.typeStep || 0.012}s`,
            }}
          >
            {EYEBROW.split("").map((ch, i) => (
              <span
                key={i}
                aria-hidden
                style={{ ["--i" as string]: i }}
                className={
                  ch === "X" ? "mx-[0.55em] text-[#e9b863]" : undefined
                }
              >
                {ch}
              </span>
            ))}
          </p>
          <m.span
            initial={{ scaleX: 0 }}
            animate={ready ? { scaleX: 1 } : undefined}
            transition={at("line", 0.6)}
            className="mt-[2.5vw] h-[max(0.45vw,2px)] w-[7.6vw] rounded-full bg-[#e2ad58] md:mt-5 md:h-[3px] md:w-16"
          />
        </div>

        <m.p
          initial={{ opacity: 0, y: 10 }}
          animate={ready ? { opacity: 1, y: 0 } : undefined}
          transition={at("pre", 0.6)}
          className="absolute inset-x-0 top-[14%] text-center text-[4.7vw] font-light leading-[1.2] text-white/90 md:static md:mt-10 md:text-start md:text-3xl"
        >
          קוראים לי
        </m.p>

        <m.h1
          initial={{ opacity: 0, clipPath: "inset(-20% -5% -20% 100%)" }}
          animate={
            ready
              ? { opacity: 1, clipPath: "inset(-20% -5% -20% -5%)" }
              : undefined
          }
          transition={at("name", 0.9)}
          className="absolute inset-x-0 top-[17%] text-center text-[13.4vw] font-black leading-[1.1] tracking-[-0.01em] text-white md:static md:mt-2 md:text-start md:text-[88px] lg:text-[104px]"
        >
          <span className="hero-shine">יעקב</span>-אליה
        </m.h1>

        <div className="absolute inset-x-[14.6%] top-[68.06%] grid h-[9.14vw] grid-cols-2 gap-[2vw] md:static md:mt-12 md:h-16 md:w-[460px] md:gap-4">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={at("buttons", 0.7)}
          >
            <TalkLink
              message="היי יעקב, ראיתי את האתר ואשמח לדבר"
              className="relative flex h-full w-full items-center justify-center gap-[2.4vw] overflow-hidden rounded-[1.9vw] bg-[linear-gradient(180deg,#f8d995,#e7b262_60%,#dfa650)] text-[3.55vw] font-bold text-[#1d1407] shadow-[0_6px_24px_-8px_rgba(231,178,98,0.7)] transition-[transform,box-shadow] duration-200 hover:shadow-[0_8px_34px_-6px_rgba(240,190,100,0.95)] active:scale-[0.97] md:gap-3 md:rounded-2xl md:text-lg"
            >
              <span
                aria-hidden
                className="btn-sweep pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)]"
              />
              <Send
                className="relative h-[3.6vw] w-[3.6vw] md:h-5 md:w-5"
                strokeWidth={2.4}
              />
              <span className="relative">בואו נדבר</span>
            </TalkLink>
          </m.div>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={at("buttons", 0.7, {
              delay: mode === "none" ? 0 : beats.buttons + 0.12,
            })}
          >
            <Link
              href="/#services"
              className="flex h-full w-full items-center justify-center gap-[3.4vw] rounded-[1.9vw] border-[max(0.22vw,1px)] border-[#e3b869] bg-[rgba(8,7,6,0.84)] text-[3.55vw] font-bold text-white transition-[transform,box-shadow,background-color] duration-200 hover:bg-black hover:shadow-[0_0_22px_-4px_rgba(227,184,105,0.55)] active:scale-[0.97] md:gap-3 md:rounded-2xl md:border-[1.5px] md:text-lg"
            >
              לשירותים שלי
              <LayoutPanelLeft
                className="h-[3.3vw] w-[3.3vw] md:h-5 md:w-5"
                strokeWidth={1.8}
              />
            </Link>
          </m.div>
        </div>
      </m.div>

      <m.div
        style={{ y: photoY }}
        className="absolute inset-0 overflow-hidden md:relative"
      >
        <m.div style={{ x: tiltX, y: tiltY }} className="absolute inset-0">
          <div
            className={`absolute inset-x-0 top-0 aspect-[941/1672] scale-[1.02] ${ready && !still ? "hero-kenburns" : ""}`}
          >
            <m.div
              initial={{ filter: "brightness(0.1)" }}
              animate={ready ? lights : undefined}
              transition={
                mode === "full"
                  ? {
                      delay: beats.lights,
                      duration: 0.9,
                      times: [0, 0.15, 0.3, 0.42, 1],
                      ease: "easeOut",
                    }
                  : at("lights", 0.6)
              }
              className="absolute inset-0"
            >
              <Image
                src="/home/hero.webp"
                alt="יעקב-אליה במשרד"
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
                onLoad={() => setReady(true)}
              />
              {/* Blurred, dimmed copy over the person that dissolves into the sharp photo. */}
              {!personDone && (
                <m.div
                  aria-hidden
                  initial={{ opacity: 1 }}
                  animate={ready ? { opacity: 0 } : undefined}
                  transition={at("person", 1.1, { ease: "easeInOut" })}
                  onAnimationComplete={() => ready && setPersonDone(true)}
                  className="absolute inset-0"
                  style={{
                    maskImage: PERSON_MASK,
                    WebkitMaskImage: PERSON_MASK,
                  }}
                >
                  <Image
                    src="/home/hero.webp"
                    alt=""
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="scale-105 object-cover blur-[14px] brightness-[0.35]"
                  />
                </m.div>
              )}
            </m.div>
            <div
              ref={neonScope}
              aria-hidden
              style={{ opacity: 0 }}
              className={`absolute left-[76%] top-[22%] h-[24%] w-[30%] rounded-full bg-[radial-gradient(closest-side,rgba(255,178,84,0.5),rgba(255,150,60,0.18)_55%,transparent)] mix-blend-screen ${neonLive ? "hero-neon" : ""}`}
            />
          </div>
        </m.div>
        <div
          aria-hidden
          className="absolute inset-0 hidden bg-[linear-gradient(to_left,#0b0a09_0%,transparent_28%),linear-gradient(to_top,#0b0a09_0%,transparent_30%)] md:block"
        />
        <m.div
          aria-hidden
          style={{ opacity: darken }}
          className="absolute inset-0 bg-black"
        />
      </m.div>

      <m.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : undefined}
        transition={at("captions", 0.8)}
        className="pointer-events-none absolute inset-0 z-10"
      >
        <span className="absolute left-1/2 top-[77.75%] z-10 h-[4.2%] w-px -translate-x-1/2 overflow-hidden bg-white/40 md:top-auto md:bottom-[104px] md:h-10">
          <span className="line-drip absolute inset-x-0 top-0 h-2/5 bg-[linear-gradient(to_bottom,transparent,#fff,transparent)]" />
        </span>
        <span className="absolute left-1/2 top-[83.7%] z-10 -translate-x-1/2 md:top-auto md:bottom-[56px]">
          <span className="scroll-bob relative block h-[6.7vw] w-[4.05vw] rounded-full border-[max(0.3vw,1.5px)] border-white/90 md:h-9 md:w-[22px] md:border-2">
            <span className="scroll-dot absolute left-1/2 top-[18%] h-[0.8vw] w-[0.8vw] rounded-full bg-white md:h-1 md:w-1" />
          </span>
        </span>
        <span className="absolute inset-x-0 top-[88%] z-10 text-center text-[3.4vw] font-medium leading-[1.2] text-white md:top-auto md:bottom-6 md:text-sm">
          גלול
        </span>
      </m.div>

      <m.p
        dir="ltr"
        initial={{ opacity: 0, letterSpacing: "0.6em" }}
        animate={ready ? { opacity: 1, letterSpacing: "0.28em" } : undefined}
        transition={at("captions", 1.1)}
        className="font-latin absolute left-[5.5%] top-[86.85%] z-10 text-[1.45vw] font-medium uppercase leading-[1.75] text-white/85 md:top-auto md:bottom-8 md:left-28 md:text-[11px]"
      >
        Turning ideas
        <br />
        into real business
      </m.p>
      <m.p
        dir="ltr"
        initial={{ opacity: 0, letterSpacing: "0.6em" }}
        animate={ready ? { opacity: 1, letterSpacing: "0.28em" } : undefined}
        transition={at("captions", 1.1, {
          delay: mode === "none" ? 0 : beats.captions + 0.12,
        })}
        className="font-latin absolute right-[5.3%] top-[86.85%] z-10 text-right text-[1.45vw] font-medium uppercase leading-[1.75] text-white/85 md:top-auto md:bottom-8 md:right-10 md:text-[11px]"
      >
        Tech <span className="mx-[0.6em] text-[#e9b863]">X</span> Marketing
        <br />
        Automation <span className="mx-[0.6em] text-[#e9b863]">X</span> Growth
      </m.p>
    </section>
  );
}
