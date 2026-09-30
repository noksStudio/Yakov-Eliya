import type { Metadata } from "next";
import { IdeasView } from "@/components/life/IdeasView";

export const metadata: Metadata = { title: "רעיונות" };

export default function LifeIdeasPage() {
  return <IdeasView />;
}
