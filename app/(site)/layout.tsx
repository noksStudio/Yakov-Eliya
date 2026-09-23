import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Aurora } from "@/components/ui/Aurora";
import { ChatProvider } from "@/components/chat/ChatContext";
import { FloatingChat } from "@/components/chat/FloatingChat";
import { CHAT_ENABLED } from "@/lib/site-config";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <ChatProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-black focus:px-4 focus:py-2 focus:text-white"
      >
        דלג לתוכן הראשי
      </a>
      <Aurora />
      <Nav />
      <main id="main" className="relative z-10 flex-1">
        {children}
      </main>
      <Footer />
      {CHAT_ENABLED && <FloatingChat />}
    </ChatProvider>
  );
}
