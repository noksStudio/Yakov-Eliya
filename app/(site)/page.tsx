import dynamic from "next/dynamic";
import { Hero } from "@/components/home/Hero";
import { CHAT_ENABLED } from "@/lib/site-config";

// Sections further down the page ship as separate chunks. They are still rendered on the server
// (full text in the HTML); their code loads in parallel and hydrates in smaller pieces, so the
// first screen becomes interactive sooner.
const Services = dynamic(() => import("@/components/home/Services").then((mod) => mod.Services));
const WhatsAppCta = dynamic(() => import("@/components/home/WhatsAppCta").then((mod) => mod.WhatsAppCta));
const AiProof = dynamic(() => import("@/components/home/AiProof").then((mod) => mod.AiProof));
const Process = dynamic(() => import("@/components/home/Process").then((mod) => mod.Process));
const Partners = dynamic(() => import("@/components/home/Partners").then((mod) => mod.Partners));
const ClosingCta = dynamic(() => import("@/components/home/ClosingCta").then((mod) => mod.ClosingCta));

export default function Home() {
  return (
    <>
      <Hero />
      <Services />
      <WhatsAppCta />
      {CHAT_ENABLED && <AiProof />}
      <Process />
      <Partners />
      <ClosingCta />
    </>
  );
}
