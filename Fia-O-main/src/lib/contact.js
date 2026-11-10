// Reglas del formulario de Contact.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const CONTACT_LIMITS = { name: 100, email: 200, messageMin: 10, messageMax: 2000 };

// Devuelve { error } o { values } listos para enviar.
export function validateContact(form) {
  const name = String(form.name ?? "").trim();
  const email = String(form.email ?? "").trim();
  const message = String(form.message ?? "").trim();
  if (!name) return { error: "Tell us your name." };
  if (name.length > CONTACT_LIMITS.name) return { error: `Your name is too long (maximum ${CONTACT_LIMITS.name} characters).` };
  if (!EMAIL.test(email) || email.length > CONTACT_LIMITS.email) return { error: "Enter a valid email so we can reply." };
  if (message.length < CONTACT_LIMITS.messageMin) return { error: `Your message is too short (at least ${CONTACT_LIMITS.messageMin} characters).` };
  if (message.length > CONTACT_LIMITS.messageMax) return { error: `Your message is too long (maximum ${CONTACT_LIMITS.messageMax} characters).` };
  return { values: { name, email, message } };
}