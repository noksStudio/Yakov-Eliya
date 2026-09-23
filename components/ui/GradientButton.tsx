"use client";

import { m } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ConflictingHandlers =
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, ConflictingHandlers> & {
  children: ReactNode;
  variant?: "primary" | "ghost" | "gold";
  icon?: ReactNode;
};

export function GradientButton({
  children,
  variant = "primary",
  icon,
  className,
  ...props
}: Props) {
  if (variant === "ghost") {
    return (
      <m.button
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-strong",
          className
        )}
        {...props}
      >
        {children}
        {icon}
      </m.button>
    );
  }

  if (variant === "gold") {
    return (
      <m.button
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-7 py-3.5 text-sm font-semibold text-[#14110d] shadow-[0_0_30px_-8px_rgba(212,162,78,0.6)] transition-shadow hover:shadow-[0_0_45px_-8px_rgba(212,162,78,0.8)]",
          className
        )}
        {...props}
      >
        <span
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(115deg,var(--gold),var(--gold-2))] bg-[length:200%_200%] transition-[background-position] duration-500 group-hover:bg-[position:100%_0]"
        />
        <span className="relative z-10 flex items-center gap-2">
          {children}
          {icon}
        </span>
      </m.button>
    );
  }

  return (
    <m.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_30px_-5px_rgba(109,91,255,0.6)] transition-shadow hover:shadow-[0_0_45px_-5px_rgba(139,92,246,0.8)]",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(115deg,var(--color-primary),var(--color-primary-2)_45%,var(--color-accent))] bg-[length:200%_200%] transition-[background-position] duration-500 group-hover:bg-[position:100%_0]"
      />
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {icon}
      </span>
    </m.button>
  );
}
