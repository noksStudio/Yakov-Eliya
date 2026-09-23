"use client";

import Image from "next/image";
import { ChevronRight, Handshake, MessageCircleMore, Zap } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { whatsappLink } from "@/lib/site-config";

const perks = [
  { icon: Handshake, label: "ביחד נבדוק אפשרויות" },
  { icon: MessageCircleMore, label: "שיחה ללא התחייבות" },
  { icon: Zap, label: "תגובה מהירה" },
];

const phoneMask =
  "linear-gradient(to left, transparent 0%, #000 14%), linear-gradient(to top, transparent 0%, #000 16%)";

export function WhatsAppCta() {
  return (
    <section id="whatsapp" className="relative overflow-hidden bg-[#0d0e11]">
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-[2vw] w-[62vw] bg-[linear-gradient(to_left,#26272c,#1c1d21)] [clip-path:polygon(0_0,100%_0,100%_100%,35%_100%)] md:h-5"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[10vw] -top-[20vw] h-[60vw] w-[70vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.05),transparent)]"
      />

      <div className="relative mx-auto grid max-w-[1100px] grid-cols-[61fr_39fr] items-start md:grid-cols-[49fr_47fr]">
        <ScrollReveal className="py-[6.4vw] pe-[2vw] ps-[4.3vw] md:py-16 md:pe-4 md:ps-10">
          <div className="flex items-center gap-[3vw] md:gap-5">
            <span dir="ltr" className="font-latin text-[length:max(1.4vw,7.5px)] font-medium tracking-[0.35em] text-white/60 md:text-[13px]">
              LET&apos;S CONNECT
            </span>
            <span className="h-px w-[7vw] bg-white/30 md:w-20" />
          </div>

          <h2 className="mt-[3.4vw] text-[length:max(7.4vw,30px)] font-black leading-[1.05] text-white md:mt-8 md:text-[76px]">
            בעל עסק?
          </h2>
          <p className="mt-[1.2vw] whitespace-nowrap text-[length:max(4.3vw,14px)] font-extrabold leading-tight text-white md:mt-3 md:text-[42px]">
            אני אשמח שנישאר בקשר.
          </p>
          <p className="mt-[3.4vw] text-[length:max(2vw,12px)] leading-[1.6] text-white/80 md:mt-7 md:text-xl">
            יש לך שאלה, רעיון או התלבטות?
            <br />
            לחץ כאן ושלח לי הודעה בוואטסאפ – שנהיה בקשר.
          </p>

          <a
            href={whatsappLink("היי יעקב, ראיתי את האתר ואשמח לשמוע יותר")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-[4vw] flex h-[max(7.6vw,42px)] w-full items-center justify-between rounded-full bg-[linear-gradient(180deg,#36e47c,#1fc05e)] px-[max(2.6vw,12px)] whitespace-nowrap text-[length:max(2.2vw,12px)] font-bold text-white shadow-[0_12px_30px_-12px_rgba(37,211,102,0.7)] transition-transform hover:scale-[1.02] md:mt-9 md:h-[78px] md:max-w-[455px] md:px-7 md:text-[22px]"
          >
            <ChevronRight className="h-[max(2.6vw,15px)] w-[max(2.6vw,15px)] md:h-7 md:w-7" strokeWidth={2.4} />
            <span>שלח לי הודעה בוואטסאפ</span>
            <WhatsAppIcon className="h-[max(4.2vw,22px)] w-[max(4.2vw,22px)] md:h-11 md:w-11" />
          </a>

          <div className="mt-[5vw] grid grid-cols-3 md:mt-12">
            {perks.map((p, i) => (
              <div
                key={p.label}
                className={`flex flex-col items-center gap-[1.4vw] px-[0.8vw] text-center md:gap-3 md:px-2 ${i > 0 ? "border-s border-white/15" : ""}`}
              >
                <p.icon className="h-[max(3vw,18px)] w-[max(3vw,18px)] text-[#7ea6ff] md:h-8 md:w-8" strokeWidth={1.5} />
                <span className="text-[length:max(1.6vw,10px)] font-medium leading-tight text-white/90 md:text-[15px]">
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal direction="left" className="relative">
          <Image
            src="/home/whatsapp-phone.webp"
            alt="הודעת וואטסאפ: היי, אשמח לשמוע יותר ולבדוק איך אפשר להתקדם יחד"
            width={482}
            height={640}
            sizes="(min-width: 768px) 520px, 44vw"
            className="h-auto w-full"
            style={{ maskImage: phoneMask, WebkitMaskImage: phoneMask, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
          />
        </ScrollReveal>
      </div>
    </section>
  );
}
