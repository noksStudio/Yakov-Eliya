import { Suspense } from "react";
import type { Metadata } from "next";
import { AgentChat } from "@/components/life/AgentChat";

export const metadata: Metadata = { title: "מאמן הגוף" };

export default function LifeCoachPage() {
  return (
    <Suspense>
      <AgentChat agent="body" />
    </Suspense>
  );
}
