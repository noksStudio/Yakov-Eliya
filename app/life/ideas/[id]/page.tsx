import type { Metadata } from "next";
import { IdeaDetail } from "@/components/life/IdeaDetail";

export const metadata: Metadata = { title: "רעיון" };

export default async function LifeIdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <IdeaDetail id={id} />;
}
