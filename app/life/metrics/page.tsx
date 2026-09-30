import type { Metadata } from "next";
import { MetricsView } from "@/components/life/MetricsView";

export const metadata: Metadata = { title: "מדדים" };

export default function LifeMetricsViewPage() {
  return <MetricsView />;
}
