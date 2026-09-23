import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Aurora } from "@/components/ui/Aurora";
import { ChatProvider } from "@/components/chat/ChatContext";
import dynamic from "next/dynamic";
import { CHAT_ENABLED } from "@/lib/site-config";
import { PauseOffscreen } from "@/components/PauseOffscreen";

// Loaded only when the chat is switched on, so a paused chat costs nothing.
const FloatingChat = dynamic(() => import("@/components/chat/FloatingChat").then((m) => m.FloatingChat));

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
      <PauseOffscreen />
      {CHAT_ENABLED && <FloatingChat />}
    </ChatProvider>
  );
}
