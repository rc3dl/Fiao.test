import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_CONFIGURED } from "@/lib/env";

if (!SUPABASE_CONFIGURED) {
  console.error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY: copia .env.example a .env.local y vuelve a compilar.");
}

export const supabase = createClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY || "placeholder-anon-key"
);
