import { Hero } from "@/components/sections/Hero";
import { WhatsAppConnect } from "@/components/sections/WhatsAppConnect";
import { Mindset } from "@/components/sections/Mindset";
import { Portfolio } from "@/components/sections/Portfolio";
import { About } from "@/components/sections/About";
import { Strategy } from "@/components/sections/Strategy";
import { Connections } from "@/components/sections/Connections";
import { PainPoints } from "@/components/sections/PainPoints";
import { Stats } from "@/components/sections/Stats";
import { Testimonials } from "@/components/sections/Testimonials";
import { FinalCTA } from "@/components/sections/FinalCTA";

export default function Home() {
  return (
    <>
      <Hero />
      <WhatsAppConnect />
      <Mindset />
      <Portfolio />
      <About />
      <Strategy />
      <Connections />
      <PainPoints />
      <Stats />
      <Testimonials />
      <FinalCTA />
    </>
  );
}
