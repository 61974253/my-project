import { createClient } from "@supabase/supabase-js";

// Retrieve config from LocalStorage (UI manual input) or Vite .env
export function getSupabaseConfig() {
  const localConfig = localStorage.getItem("supabase_custom_config");
  if (localConfig) {
    try {
      const parsed = JSON.parse(localConfig);
      if (parsed.url && parsed.key) {
        return parsed;
      }
    } catch {
      // ignore JSON parse error
    }
  }

  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && !envUrl.includes("your-project-id")) {
    return { url: envUrl, key: envKey };
  }

  return null;
}

export function saveSupabaseConfig(url, key) {
  if (!url || !key) {
    localStorage.removeItem("supabase_custom_config");
  } else {
    localStorage.setItem("supabase_custom_config", JSON.stringify({ url: url.trim(), key: key.trim() }));
  }
}

let supabaseInstance = null;

export function getSupabase() {
  const config = getSupabaseConfig();
  if (!config) return null;

  if (!supabaseInstance || supabaseInstance.supabaseUrl !== config.url) {
    try {
      supabaseInstance = createClient(config.url, config.key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.error("Failed to initialize Supabase client:", err);
      return null;
    }
  }
  return supabaseInstance;
}

export function isSupabaseConfigured() {
  return !!getSupabaseConfig();
}
