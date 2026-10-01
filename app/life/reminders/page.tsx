import type { Metadata } from "next";
import { RemindersView } from "@/components/life/RemindersView";

export const metadata: Metadata = { title: "תזכורות" };

export default function LifeRemindersPage() {
  return <RemindersView />;
}
