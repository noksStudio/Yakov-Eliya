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
