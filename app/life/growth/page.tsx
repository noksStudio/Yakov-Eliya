import { Suspense } from "react";
import type { Metadata } from "next";
import { GrowthView } from "@/components/life/GrowthView";

export const metadata: Metadata = { title: "צמיחה" };

export default function LifeGrowthPage() {
  return (
    <Suspense>
      <GrowthView />
    </Suspense>
  );
}
