export type LeadStatus = "new" | "contacted" | "qualified" | "customer" | "lost";

export type Lead = {
  id: string;
  created_at: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  business_type: string | null;
  pain: string | null;
  track_slug: string | null;
  gender: string | null;
  age: number | null;
  status: LeadStatus;
  notes: string | null;
  conversation_id: string | null;
  /** When to get back to him (set on arrival, moved when he postpones). Older rows may lack it. */
  follow_up_date?: string | null;
  /** The deal opened from this lead, once there was money on the table. */
  deal_id?: string | null;
  /** "site" (the website chat/form), "manual" (added in the app or Telegram), or a connected
   * system's name ("bossi"). */
  source?: string | null;
  /** The lead's id in that connected system, so its updates land on the same lead. */
  external_id?: string | null;
};

export type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

export type Conversation = {
  id: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
  business_type: string | null;
  pain: string | null;
  track_slugs: string[];
};
