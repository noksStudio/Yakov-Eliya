import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Aurora } from "@/components/ui/Aurora";
import { ChatProvider } from "@/components/chat/ChatContext";
import { FloatingChat } from "@/components/chat/FloatingChat";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "יעקב-אליה | פותר בעיות עסקיות בעזרת טכנולוגיה",
  description:
    "יעקב-אליה עוזר לבעלי עסקים ויזמים לפתור בעיות, לחסוך זמן, להגדיל הכנסות ולהשתמש בטכנולוגיה בצורה חכמה יותר.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground relative">
        <div className="noise-overlay" />
        <ChatProvider>
          <Aurora />
          <Nav />
          <main className="relative z-10 flex-1">{children}</main>
          <Footer />
          <FloatingChat />
        </ChatProvider>
      </body>
    </html>
  );
}
