import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Aurora } from "@/components/ui/Aurora";
import { ChatProvider } from "@/components/chat/ChatContext";
import { FloatingChat } from "@/components/chat/FloatingChat";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <ChatProvider>
      <Aurora />
      <Nav />
      <main className="relative z-10 flex-1">{children}</main>
      <Footer />
      <FloatingChat />
    </ChatProvider>
  );
}
