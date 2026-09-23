import { Hero } from "@/components/home/Hero";
import { Services } from "@/components/home/Services";
import { WhatsAppCta } from "@/components/home/WhatsAppCta";
import { AiProof } from "@/components/home/AiProof";
import { Process } from "@/components/home/Process";
import { Partners } from "@/components/home/Partners";
import { ClosingCta } from "@/components/home/ClosingCta";

export default function Home() {
  return (
    <>
      <Hero />
      <Services />
      <WhatsAppCta />
      <AiProof />
      <Process />
      <Partners />
      <ClosingCta />
    </>
  );
}
