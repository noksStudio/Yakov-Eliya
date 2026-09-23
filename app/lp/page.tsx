import type { Metadata } from "next";
import Image from "next/image";
import { lpSections } from "./sections";

export const metadata: Metadata = {
  title: "יעקב-אליה | דף נחיתה",
};

export default function LandingPage() {
  return (
    <main className="bg-background">
      {lpSections.map((section, i) => (
        <Image
          key={section.src}
          src={section.src}
          alt={section.alt}
          width={section.width}
          height={section.height}
          priority={i === 0}
          sizes="100vw"
          className="block h-auto w-full"
        />
      ))}
    </main>
  );
}
