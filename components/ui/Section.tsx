import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  id,
  glow = "none",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  glow?: "top" | "bottom" | "center" | "none";
}) {
  return (
    <section
      id={id}
      className={cn("relative px-6 py-24 sm:py-32 md:px-10", className)}
    >
      {glow !== "none" && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -z-10 h-[520px] w-[720px] max-w-[90vw] rounded-full blur-[120px] opacity-30",
            "bg-[radial-gradient(closest-side,var(--color-primary),transparent)]",
            glow === "top" && "-top-40 left-1/2 -translate-x-1/2",
            glow === "bottom" && "-bottom-40 left-1/2 -translate-x-1/2",
            glow === "center" && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          )}
        />
      )}
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-border-soft bg-surface px-4 py-1.5 text-sm font-medium text-muted">
      {children}
    </span>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: "center" | "start";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-start"
      )}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="max-w-2xl text-lg leading-relaxed text-muted">
          {description}
        </p>
      )}
    </div>
  );
}
