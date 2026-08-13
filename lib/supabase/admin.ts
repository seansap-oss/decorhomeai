import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

/**
 * Privileged Admin Supabase client utilizing the Service Role Key.
 * MUST only be invoked in secure server-side environments (e.g. Webhooks, Credit Reconciliation).
 * Bypasses Row Level Security (RLS).
 */
export function createAdminClient() {
  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
