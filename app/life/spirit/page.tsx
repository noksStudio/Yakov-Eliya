import type { Metadata } from "next";
import { SpiritView } from "@/components/life/SpiritView";

export const metadata: Metadata = { title: "רוח" };

export default function LifeSpiritViewPage() {
  return <SpiritView />;
}
