"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Brain,
  Briefcase,
  CalendarDays,
  Crown,
  Dumbbell,
  LogOut,
  Menu,
  MessageCircle,
  MoonStar,
  Settings,
  ShoppingCart,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

type Tab = { href: string; label: string; icon: LucideIcon; also?: string[] };

// Right to left: menu · chief · my day (centre) · body · shopping.
const LEFT_OF_MENU: Tab[] = [
  { href: "/life/chat", label: "המנהל", icon: Crown },
  { href: "/life", label: "היום שלי", icon: CalendarDays },
  { href: "/life/body", label: "גוף", icon: Dumbbell, also: ["/life/coach"] },
  { href: "/life/shopping", label: "קניות", icon: ShoppingCart },
];

type DrawerItem = { href?: string; label: string; hint?: string; icon: LucideIcon };

const DRAWER: { title: string; items: DrawerItem[] }[] = [
  {
    title: "ראשי",
    items: [
      { href: "/life", label: "היום שלי", icon: CalendarDays },
      { href: "/life/chat", label: "המנהל הראשי", hint: "לו״ז ומשימות", icon: Crown },
    ],
  },
  {
    title: "הצוות",
    items: [
      { href: "/life/coach", label: "מאמן הגוף", hint: "כושר, תזונה ושינה", icon: MessageCircle },
      { href: "/life/agent/business", label: "מנהל העסק", hint: "עסקאות ופעילות מכירה", icon: Briefcase },
      { href: "/life/agent/finance", label: "מנהל הכספים", hint: "רווח ויעד חודשי", icon: Wallet },
      { label: "המלווה הרוחני", hint: "בקרוב", icon: MoonStar },
      { label: "המאמן המנטלי", hint: "בקרוב", icon: Brain },
    ],
  },
  {
    title: "כלים",
    items: [
      { href: "/life/metrics", label: "מדדים", hint: "כל היעדים במקום אחד", icon: BarChart3 },
      { href: "/life/business", label: "עסק", hint: "עסקאות, פולואפים ופעילות", icon: Briefcase },
      { href: "/life/finance", label: "כספים", hint: "רווח מול יעד", icon: Wallet },
      { href: "/life/body", label: "גוף", hint: "תפריט, אימונים ומשקל", icon: Dumbbell },
      { href: "/life/shopping", label: "רשימת קניות", icon: ShoppingCart },
    ],
  },
  {
    title: "מערכת",
    items: [{ href: "/life/settings", label: "הגדרות", icon: Settings }],
  },
];

export function LifeNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Close on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const menuButton = menuButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      menuButton?.focus();
    };
  }, [open]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.replace("/admin/login?next=/life");
  };

  return (
    <>
      <nav
        aria-label="ניווט"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border-soft bg-[#07081a]/95 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 items-end">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="life-drawer"
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
              open ? "text-gold-2" : "text-muted hover:text-foreground"
            }`}
          >
            <Menu className="h-5 w-5" strokeWidth={1.8} />
            תפריט
          </button>

          {LEFT_OF_MENU.map(({ href, label, icon: Icon, also }) => {
            const active = pathname === href || (also?.includes(pathname) ?? false);
            if (href === "/life") {
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className="flex flex-col items-center gap-1 pb-2.5 text-[11px] font-semibold"
                >
                  <span
                    className={`-mt-5 flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#07081a] shadow-[0_6px_20px_-6px_rgba(212,162,78,0.7)] ${
                      active ? "bg-[linear-gradient(135deg,#f8d995,#c98f3e)] text-[#1d1407]" : "bg-[#1a1c33] text-gold-2"
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <span className={active ? "text-gold-2" : "text-muted"}>{label}</span>
                </Link>
              );
            }
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

      {/* Drawer: slides in from the right (the start side in RTL). */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 transition-opacity duration-300 motion-reduce:transition-none ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div
        id="life-drawer"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="תפריט"
        inert={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-[82%] max-w-xs flex-col border-s border-border-soft bg-[#0a0b1c] pb-[env(safe-area-inset-bottom)] pt-[max(1rem,env(safe-area-inset-top))] shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 pb-3">
          <p className="text-lg font-black">
            <span className="text-gold-2">יעקב</span>-אליה
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="סגור תפריט"
            className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {DRAWER.map((section) => (
            <section key={section.title} className="mb-3">
              <h2 className="px-3 pb-1 pt-2 text-[11px] font-semibold tracking-wide text-muted">{section.title}</h2>
              <ul>
                {section.items.map(({ href, label, hint, icon: Icon }) => {
                  const active = href === pathname;
                  const body = (
                    <>
                      <Icon className={`h-5 w-5 shrink-0 ${href ? "text-gold-2" : "text-muted/60"}`} strokeWidth={1.8} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold">{label}</span>
                        {hint && <span className="block text-xs text-muted">{hint}</span>}
                      </span>
                    </>
                  );
                  return (
                    <li key={label}>
                      {href ? (
                        <Link
                          href={href}
                          aria-current={active ? "page" : undefined}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                            active ? "bg-gold/15 text-gold-2" : "hover:bg-white/5"
                          }`}
                        >
                          {body}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 opacity-50" aria-disabled="true">
                          {body}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <button
          type="button"
          onClick={logout}
          className="mx-2 mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted hover:bg-white/5 hover:text-foreground"
        >
          <LogOut className="h-5 w-5" /> התנתקות
        </button>
      </div>
    </>
  );
}
