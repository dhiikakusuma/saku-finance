import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Default ke project pribadi user. Bisa di-override via settings.supabaseUrl/key.
const DEFAULT_URL = "https://bwqwnsdqnqwofjndskoe.supabase.co";
const DEFAULT_ANON_KEY =
  "sb_publishable_5skqM1wuzOH9UcW_4NFdxg_JHVHukya";

let client: SupabaseClient | null = null;
let cachedUrl: string | null = null;
let cachedKey: string | null = null;

export function getSupabase(
  urlOverride?: string,
  keyOverride?: string,
): SupabaseClient {
  const url = urlOverride?.trim() || DEFAULT_URL;
  const key = keyOverride?.trim() || DEFAULT_ANON_KEY;
  if (client && cachedUrl === url && cachedKey === key) return client;
  client = createClient(url, key, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  cachedUrl = url;
  cachedKey = key;
  return client;
}

export const supabase = getSupabase();
