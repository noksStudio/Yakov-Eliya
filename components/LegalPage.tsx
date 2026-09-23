import type { ReactNode } from "react";

export function LegalPage({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="relative bg-[#0b0b0d] px-5 pb-24 pt-32 md:pt-40">
      <div className="mx-auto max-w-3xl">
        <p dir="ltr" className="font-latin text-center text-xs font-medium tracking-[0.4em] text-white/50">
          {eyebrow}
        </p>
        <span className="mx-auto mt-4 block h-[2px] w-12 bg-[#d4a24e]" />
        <h1 className="mt-6 text-center text-4xl font-black md:text-5xl">{title}</h1>
        <p className="mt-4 text-center text-sm text-white/55">עודכן לאחרונה: {updated}</p>

        <div className="legal-content mt-12 space-y-8 text-[16px] leading-[1.8] text-white/80 md:text-[17px]">
          {children}
        </div>
      </div>
    </article>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-bold text-[#f0c878] md:text-2xl">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
