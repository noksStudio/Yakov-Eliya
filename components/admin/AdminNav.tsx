"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, MessageSquare, Megaphone, Sprout, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const marketingLinks = [
  { href: "/admin/marketing/organic", label: "אורגני", icon: Sprout },
  { href: "/admin/marketing/paid", label: "ממומן", icon: Megaphone },
  { href: "/admin/marketing/chat", label: "צ'אט", icon: MessageSquare },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <nav className="fixed inset-y-0 right-0 z-40 hidden w-64 flex-col border-l border-border-soft bg-background-soft px-4 py-6 md:flex">
      <Link href="/admin/leads" className="px-2 text-lg font-bold">
        יעקב<span className="text-gradient">-אליה</span>
        <span className="ms-2 text-xs font-normal text-muted">אדמין</span>
      </Link>

      <div className="mt-8 flex flex-1 flex-col gap-1">
        <Link
          href="/admin/leads"
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors",
            pathname === "/admin/leads"
              ? "bg-surface-strong text-foreground"
              : "text-muted hover:bg-surface hover:text-foreground"
          )}
        >
          <Users className="h-4 w-4" />
          לידים
        </Link>

        <p className="mt-6 px-3 text-xs font-medium text-muted">שיווק</p>
        {marketingLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active ? "bg-surface-strong text-foreground" : "text-muted hover:bg-surface hover:text-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </div>

      <button
        onClick={logout}
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        התנתקות
      </button>
    </nav>
  );
}
