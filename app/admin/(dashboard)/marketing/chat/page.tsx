import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { ConversationsList } from "@/components/admin/ConversationsList";
import { SupabaseNotConfigured } from "@/components/admin/SupabaseNotConfigured";
import type { Conversation } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MarketingChatPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseNotConfigured />;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    return <div className="p-8 text-sm text-red-400">שגיאה בטעינת שיחות: {error.message}</div>;
  }

  return <ConversationsList conversations={(data ?? []) as Conversation[]} />;
}
