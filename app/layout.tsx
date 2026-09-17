import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
