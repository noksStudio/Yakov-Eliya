import type { Metadata } from "next";
import { SetupGuide } from "@/components/life/SetupGuide";

export const metadata: Metadata = { title: "חיבור המערכת" };

export default function LifeSetupPage() {
  return <SetupGuide />;
}
