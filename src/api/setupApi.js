// Guarda de una sola vez toda la configuración inicial: datos del negocio y reglas de crédito.
import { supabase } from "@/api/supabaseClient";

export async function completeSetup(values) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: auth.user.id, ...values, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}