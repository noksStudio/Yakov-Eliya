import type { Metadata } from "next";
import { LifeSettings } from "@/components/life/LifeSettings";

export const metadata: Metadata = { title: "הגדרות" };

export default function LifeSettingsPage() {
  return <LifeSettings />;
}
