import type { Metadata } from "next";
import { EventView } from "@/components/life/EventView";

export const metadata: Metadata = { title: "אירוע" };

export default async function LifeEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventView id={id} />;
}
