import type { Metadata } from "next";
import { RulesSettings } from "@/components/life/RulesSettings";

export const metadata: Metadata = { title: "החוקים של המערכת" };

export default function RulesPage() {
  return <RulesSettings />;
}
