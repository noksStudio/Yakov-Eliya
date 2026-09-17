import { Nav } from "@/components/Nav";
import { Aurora } from "@/components/ui/Aurora";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { AIAssistant } from "@/components/sections/AIAssistant";
import { PainPoints } from "@/components/sections/PainPoints";
import { Portfolio } from "@/components/sections/Portfolio";
import { Stats } from "@/components/sections/Stats";
import { Testimonials } from "@/components/sections/Testimonials";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Aurora />
      <Nav />
      <main className="relative z-10">
        <Hero />
        <About />
        <AIAssistant />
        <PainPoints />
        <Portfolio />
        <Stats />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
