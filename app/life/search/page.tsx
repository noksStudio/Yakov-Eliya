import type { Metadata } from "next";
import { SearchView } from "@/components/life/SearchView";

export const metadata: Metadata = { title: "חיפוש" };

export default function LifeSearchPage() {
  return <SearchView />;
}
