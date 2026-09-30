import type { Metadata } from "next";
import { BodyView } from "@/components/life/BodyView";

export const metadata: Metadata = { title: "גוף" };

export default function LifeBodyPage() {
  return <BodyView />;
}
