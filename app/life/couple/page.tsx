import type { Metadata } from "next";
import { CoupleView } from "@/components/life/CoupleView";

export const metadata: Metadata = { title: "זוגיות" };

export default function LifeCouplePage() {
  return <CoupleView />;
}
