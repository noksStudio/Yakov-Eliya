import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { LeadsTable } from "@/components/admin/LeadsTable";
import { SupabaseNotConfigured } from "@/components/admin/SupabaseNotConfigured";
import type { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseNotConfigured />;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="p-8 text-sm text-red-400">שגיאה בטעינת לידים: {error.message}</div>;
  }

  return <LeadsTable leads={(data ?? []) as Lead[]} />;
}
