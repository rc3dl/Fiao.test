// Envía el mensaje del formulario de Contact a la tabla contact_messages.
import { supabase } from "@/api/supabaseClient";

export async function sendContactMessage({ name, email, message }) {
  const { error } = await supabase.from("contact_messages").insert({ name, email, message });
  if (error) throw new Error(error.message);
}