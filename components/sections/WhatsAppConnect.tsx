"use client";

import { motion } from "framer-motion";
import { Handshake, MessageCircle, Zap } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { ScrollReveal, StaggerGroup, staggerItem } from "@/components/ui/ScrollReveal";
import { whatsappLink } from "@/lib/site-config";

const perks = [
  { icon: Zap, label: "תגובה מהירה" },
  { icon: MessageCircle, label: "שיחה ללא התחייבות" },
  { icon: Handshake, label: "ביחד נבדוק מה מתאים" },
];

export function WhatsAppConnect() {
  return (
    <section className="relative border-t border-border-soft px-6 py-20 sm:py-28 md:px-10">
      <div className="mx-auto max-w-6xl">
        <SectionEyebrow label="LET'S CONNECT" />

        <div className="mt-10 grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <ScrollReveal direction="right">
            <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">
              בעל עסק?
              <br />
              אני כאן — כתבו לי בוואטסאפ.
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">
              יש לך שאלה, התלבטות או רעיון לעסק? הכי פשוט לכתוב לי הודעה —
              אני עונה אישית, בלי טפסים ובלי המתנה.
            </p>

            <a
              href={whatsappLink("היי יעקב, ראיתי את האתר ורציתי לדבר איתך")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-[#25D366] px-7 py-3.5 text-sm font-semibold text-[#052e17] shadow-[0_0_30px_-8px_rgba(37,211,102,0.6)] transition-transform hover:scale-[1.02]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              שלח לי הודעה בוואטסאפ
            </a>

            <StaggerGroup className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
              {perks.map((perk) => (
                <motion.span
                  key={perk.label}
                  variants={staggerItem}
                  className="flex items-center gap-2 text-sm text-muted"
                >
                  <perk.icon className="h-4 w-4 text-primary-2" />
                  {perk.label}
                </motion.span>
              ))}
            </StaggerGroup>
          </ScrollReveal>

          <ScrollReveal direction="left" delay={0.1} className="relative flex justify-center">
            <PhoneMock />
            <p className="text-hand absolute -bottom-2 start-2 max-w-[10rem] text-center text-sm text-primary-2 sm:start-0">
              לפעמים כל מה שצריך זה הודעה אחת.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function PhoneMock() {
  return (
    <div className="glow-border relative w-64 overflow-hidden rounded-[2.5rem] border-4 border-[#111] bg-[#0b0d1f] shadow-2xl sm:w-72">
      <div className="flex items-center gap-2.5 bg-[#1f8a4c] px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
          י
        </span>
        <div>
          <p className="text-sm font-semibold text-white">יעקב-אליה</p>
          <p className="text-[11px] text-white/80">אונליין</p>
        </div>
      </div>
      <div className="flex min-h-64 flex-col justify-end gap-2 bg-[#0a1014] px-3 py-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="max-w-[85%] self-start rounded-2xl rounded-tr-sm bg-[#202c33] px-3.5 py-2.5 text-sm text-white"
        >
          היי! שמח שהתעניינת 🙌 איך אפשר לעזור?
          <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-white/50">
            12:24
          </span>
        </motion.div>
      </div>
    </div>
  );
}
