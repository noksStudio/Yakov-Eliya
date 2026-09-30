import type { Metadata } from "next";
import { BusinessView } from "@/components/life/BusinessView";

export const metadata: Metadata = { title: "עסק" };

export default function LifeBusinessViewPage() {
  return <BusinessView />;
}
