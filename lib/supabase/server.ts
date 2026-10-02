import { createClient } from "@supabase/supabase-js";

/** The server key: the new "secret" key (sb_secret_…) or the legacy service_role key. */
export function supabaseServerKey() {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && supabaseServerKey());
}

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = supabaseServerKey();

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL / SUPABASE_SECRET_KEY environment variables"
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
