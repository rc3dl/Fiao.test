// Guarda de una sola vez la configuración inicial, también en la cola offline de Android.
import { supabase } from "@/api/supabaseClient";
import { mutate } from "@/offline";

const SETUP_FIELDS = [
  "full_name",
  "store_name",
  "phone",
  "address",
  "ruc",
  "default_credit_limit",
  "default_due_days",
  "auto_block",
];

export async function completeSetup(values) {
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;
  if (!user) throw new Error("Not authenticated");

  const payload = Object.fromEntries(
    SETUP_FIELDS.filter((key) => key in values).map((key) => [key, values[key]])
  );
  const row = { id: user.id, ...payload, updated_at: new Date().toISOString() };

  return mutate(
    {
      type: "profile.update",
      table: "profiles",
      record_id: user.id,
      group: `profiles:${user.id}`,
      payload,
    },
    async () => {
      const { error } = await supabase.from("profiles").upsert(row);
      if (error) throw new Error(error.message);
    }
  );
}