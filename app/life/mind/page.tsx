import type { Metadata } from "next";
import { MindView } from "@/components/life/MindView";

export const metadata: Metadata = { title: "מנטלי" };

export default function LifeMindViewPage() {
  return <MindView />;
}
