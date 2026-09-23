"use client";

import { useEffect, type RefObject } from "react";

// For a pinned scroll track split into `count` stops: when scrolling stops part-way between two
// stops, glide to the next one in the direction of travel (or back), so the pinned scene never
// rests half-way through a transition.
export function useScrollMagnet(trackRef: RefObject<HTMLDivElement | null>, count: number) {
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
      const step = range / (count - 1);
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
  }, [trackRef, count]);
}
