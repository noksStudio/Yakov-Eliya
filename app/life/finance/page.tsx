import type { Metadata } from "next";
import { FinanceView } from "@/components/life/FinanceView";

export const metadata: Metadata = { title: "כספים" };

export default function LifeFinanceViewPage() {
  return <FinanceView />;
}
