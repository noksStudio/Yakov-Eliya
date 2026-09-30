"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Crown, Dumbbell, Settings, ShoppingCart } from "lucide-react";

const TABS = [
  { href: "/life", label: "היום שלי", icon: CalendarDays, also: [] as string[] },
  { href: "/life/body", label: "גוף", icon: Dumbbell, also: ["/life/coach"] },
  { href: "/life/shopping", label: "קניות", icon: ShoppingCart, also: [] },
  { href: "/life/chat", label: "המנהל", icon: Crown, also: [] },
  { href: "/life/settings", label: "הגדרות", icon: Settings, also: [] },
];

export function LifeNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="ניווט"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-soft bg-[#07081a]/95 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map(({ href, label, icon: Icon, also }) => {
          const active = pathname === href || also.includes(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                active ? "text-gold-2" : "text-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.3 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
