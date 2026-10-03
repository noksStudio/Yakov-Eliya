// The rules engine's shapes, client-safe (the settings screen and the day card use them).

export const RULE_AREAS = ["plan", "business", "money", "body", "spirit", "mind"] as const;
export type RuleArea = (typeof RULE_AREAS)[number];
export const RULE_AREA_LABELS: Record<RuleArea, string> = {
  plan: "תכנון",
  business: "מכירות ולידים",
  money: "כסף",
  body: "גוף ושינה",
  spirit: "רוחניות",
  mind: "מנטלי",
};

/** alert: something slipping, act today · tip: worth a look · good: worth noticing. */
export type InsightLevel = "alert" | "tip" | "good";

/** Where a rule's conclusion is shown. Notifications only ever read rules, never a model. */
export type RulePlace = "today" | "morning" | "assistant";

export type Insight = {
  rule: string;
  area: RuleArea;
  level: InsightLevel;
  text: string;
  detail?: string;
  href?: string;
};

/** A rule as the settings screen lists it. */
export type RuleInfo = { id: string; area: RuleArea; title: string; when: string; places: RulePlace[]; enabled: boolean };
