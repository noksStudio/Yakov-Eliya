import { Sprout } from "lucide-react";

export default function MarketingOrganicPage() {
  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold">שיווק אורגני</h1>
      <div className="glass mt-6 flex flex-col items-center gap-3 rounded-2xl px-8 py-16 text-center">
        <Sprout className="h-8 w-8 text-primary-2" />
        <p className="font-medium">בקרוב</p>
        <p className="max-w-sm text-sm text-muted">
          כאן יופיעו נתוני שיווק אורגני (רשתות חברתיות, SEO) כשיתחברו המקורות הרלוונטיים.
        </p>
      </div>
    </div>
  );
}
