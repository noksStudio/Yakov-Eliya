import { Suspense } from "react";
import type { Metadata } from "next";
import { ChiefChat } from "@/components/life/ChiefChat";

export const metadata: Metadata = { title: "המנהל הראשי" };

export default function LifeChatPage() {
  return (
    <Suspense>
      <ChiefChat />
    </Suspense>
  );
}
