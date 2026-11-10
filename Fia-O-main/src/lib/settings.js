// Reglas de los formularios de la pantalla Profile (datos del negocio y reglas de crédito).
import { parseAmount, validatePhone } from "@/lib/credit";

const MAX_TEXT = 200;

// --- Datos del negocio ------------------------------------------------------
export const userToForm = (user) => ({
  full_name: user?.full_name || "",
  store_name: user?.store_name || "",
  phone: user?.phone || "",
  address: user?.address || "",
  ruc: user?.ruc || "",
});

const FIELD_LABELS = { full_name: "Full name", store_name: "Store name", phone: "Phone", address: "Address", ruc: "RUC / ID" };

// Devuelve { error } o { values } listos para guardar.
export function validateProfile(form) {
  const values = {};
  for (const key of Object.keys(FIELD_LABELS)) {
    const v = String(form[key] ?? "").trim();
    if (v.length > MAX_TEXT) return { error: `${FIELD_LABELS[key]} is too long (maximum ${MAX_TEXT} characters).` };
    values[key] = v;
  }
  const phoneError = validatePhone(values.phone);
  if (phoneError) return { error: phoneError };
  return { values };
}

// --- Reglas de crédito del negocio -----------------------------------------
export const settingsToForm = (s) => ({
  default_credit_limit: String(s.default_credit_limit),
  default_due_days: String(s.default_due_days),
  auto_block: !!s.auto_block,
});

// Devuelve { error } o { values } listos para guardar.
export function validateSettings(form) {
  const limit = parseAmount(form.default_credit_limit);
  if (Number.isNaN(limit)) return { error: "The credit limit must be a number (for example 100)." };
  if (limit > 100000) return { error: "That credit limit is too high (maximum B/. 100,000)." };
  const raw = String(form.default_due_days ?? "").trim();
  if (!/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > 365) {
    return { error: "Days to pay must be a whole number from 1 to 365." };
  }
  return { values: { default_credit_limit: limit, default_due_days: Number(raw), auto_block: !!form.auto_block } };
}

// ¿El formulario ya es distinto de lo guardado? (para avisar que hay cambios sin guardar)
export function isDirty(draft, original) {
  return draft !== null && JSON.stringify(draft) !== JSON.stringify(original);
}

// ---------------------------------------------------------------------------
// Configuración inicial (la pantalla /setup que aparece antes del Dashboard)
// ---------------------------------------------------------------------------

// Un perfil está completo cuando ya tiene el nombre del dueño y el de la tienda.
export function isProfileComplete(user) {
  return Boolean(String(user?.full_name ?? "").trim() && String(user?.store_name ?? "").trim());
}

// Valores por defecto de las reglas de crédito para quien aún no las ha guardado.
export const DEFAULT_RULES_FORM = { default_credit_limit: "100", default_due_days: "15", auto_block: true };

// Valida todo el formulario inicial. Devuelve { error } o { values } listos para guardar de una vez.
export function validateSetup(info, rules) {
  if (!String(info.full_name ?? "").trim()) return { error: "Tell us your name." };
  if (!String(info.store_name ?? "").trim()) return { error: "Tell us the name of your store." };
  const profile = validateProfile(info);
  if (profile.error) return profile;
  const settings = validateSettings(rules);
  if (settings.error) return settings;
  return { values: { ...profile.values, ...settings.values } };
}

// A dónde ir al terminar. Solo se aceptan rutas internas de la web (nunca otra página ni /setup).
export function setupReturnPath(from) {
  if (typeof from !== "string" || !from.startsWith("/") || from.startsWith("//") || from.startsWith("/\\")) return "/dashboard";
  if (from === "/setup" || from.startsWith("/setup?") || from === "/" || from.startsWith("/login") || from.startsWith("/register")) return "/dashboard";
  return from;
}