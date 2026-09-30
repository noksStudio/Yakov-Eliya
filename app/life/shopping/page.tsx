import type { Metadata } from "next";
import { ShoppingView } from "@/components/life/ShoppingView";

export const metadata: Metadata = { title: "רשימת קניות" };

export default function LifeShoppingPage() {
  return <ShoppingView />;
}
