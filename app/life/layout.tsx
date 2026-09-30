import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { LifeNav } from "@/components/life/LifeNav";

export const metadata: Metadata = {
  title: { default: "היום שלי", template: "%s · היום שלי" },
  robots: { index: false, follow: false },
  manifest: "/life-manifest.webmanifest",
  appleWebApp: { capable: true, title: "היום שלי", statusBarStyle: "black-translucent" },
  icons: { apple: { url: "/life-icons/apple-touch-icon.png", sizes: "180x180" } },
};

export const viewport: Viewport = {
  themeColor: "#05060f",
};

export default function LifeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100svh] bg-background pb-24 text-foreground">
      <main className="mx-auto max-w-md px-4 pt-[max(1.25rem,env(safe-area-inset-top))]">{children}</main>
      <LifeNav />
    </div>
  );
}
