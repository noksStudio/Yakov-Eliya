import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AgentChat } from "@/components/life/AgentChat";
import { AGENTS, type AgentId } from "@/lib/life/types";

const TITLES: Record<AgentId, string> = {
  chief: "המנהל הראשי",
  body: "מאמן הגוף",
  business: "מנהל העסק",
  finance: "מנהל הכספים",
  spirit: "המלווה הרוחני",
  mind: "המאמן המנטלי",
  couple: "היועץ הזוגי",
};

export async function generateMetadata({ params }: { params: Promise<{ agent: string }> }) {
  const { agent } = await params;
  return { title: TITLES[agent as AgentId] ?? "סוכן" };
}

export default async function LifeAgentPage({ params }: { params: Promise<{ agent: string }> }) {
  const { agent } = await params;
  if (!(AGENTS as readonly string[]).includes(agent)) notFound();
  return (
    <Suspense>
      <AgentChat agent={agent as AgentId} />
    </Suspense>
  );
}
