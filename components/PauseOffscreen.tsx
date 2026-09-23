"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Marks page sections that are on screen; CSS loops elsewhere stay paused (see globals.css).
export function PauseOffscreen() {
  const pathname = usePathname();
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("main section"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) e.target.setAttribute("data-onscreen", "");
          else e.target.removeAttribute("data-onscreen");
        }
      },
      { rootMargin: "50px 0px" }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
