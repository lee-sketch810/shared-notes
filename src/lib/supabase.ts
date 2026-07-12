import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const editKey = new URLSearchParams(window.location.search).get("edit") ?? "";

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        global: editKey ? { headers: { "x-edit-key": editKey } } : undefined,
      })
    : null;
