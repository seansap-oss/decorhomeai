import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

/**
 * Client-side Supabase instance for use in browser/Client Components.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export default createClient;
