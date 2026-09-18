import { Hero } from "@/components/sections/Hero";
import { WhatsAppConnect } from "@/components/sections/WhatsAppConnect";
import { About } from "@/components/sections/About";
import { PainPoints } from "@/components/sections/PainPoints";
import { Portfolio } from "@/components/sections/Portfolio";
import { Stats } from "@/components/sections/Stats";
import { Testimonials } from "@/components/sections/Testimonials";
import { FinalCTA } from "@/components/sections/FinalCTA";

export default function Home() {
  return (
    <>
      <Hero />
      <WhatsAppConnect />
      <About />
      <PainPoints />
      <Portfolio />
      <Stats />
      <Testimonials />
      <FinalCTA />
    </>
  );
}
