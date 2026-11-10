// Reglas del fiado. Toda la lógica de saldos y estados vive AQUÍ, en un solo lugar,
// para que Clients, Credit, Dashboard y Reports muestren siempre los mismos números.

// Trabajamos en centavos (enteros) para evitar errores de decimales (0.1 + 0.2).
const toCents = (n) => Math.round(Number(n || 0) * 100);

// 35 -> "B/. 35.00"   |   1450 -> "B/. 1,450.00"
export function money(value) {
  const n = Number(value || 0);
  return `B/. ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Fecha de hoy en Panamá, como "2026-10-11".
export function todayPanama() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Panama" }).format(new Date());
}

// Convierte una fecha-hora de la base de datos a la fecha de Panamá ("2026-10-11").
export function dateInPanama(timestamp) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Panama" }).format(new Date(timestamp));
}

function daysBetween(fromYmd, toYmd) {
  const ms = Date.parse(`${toYmd}T00:00:00Z`) - Date.parse(`${fromYmd}T00:00:00Z`);
  return Math.round(ms / 86400000);
}

// Calcula la situación de UN cliente a partir de sus movimientos (fiados y pagos).
// Regla: los pagos cubren primero los fiados más antiguos.
//   saldo   = fiados - pagos
//   vencido = lo que queda sin pagar de los fiados cuya fecha límite ya pasó
//   estado  = Overdue (hay vencido) | Pending (hay saldo) | On Time (saldo en cero)
export function computeClientStats(entries, today = todayPanama()) {
  const fiados = entries
    .filter((e) => e.kind === "fiado")
    .sort((a, b) => {
      const diff = Date.parse(a.created_at) - Date.parse(b.created_at);
      return diff !== 0 ? diff : String(a.id).localeCompare(String(b.id));
    });
  let coverage = entries
    .filter((e) => e.kind === "pago")
    .reduce((sum, e) => sum + toCents(e.amount), 0);

  let balance = 0;
  let overdue = 0;
  let oldestPendingDate = null;

  for (const f of fiados) {
    const amount = toCents(f.amount);
    const covered = Math.min(coverage, amount);
    coverage -= covered;
    const remaining = amount - covered;
    if (remaining > 0) {
      balance += remaining;
      if (!oldestPendingDate) oldestPendingDate = dateInPanama(f.created_at);
      if (f.due_date && f.due_date < today) overdue += remaining;
    }
  }

  const status = overdue > 0 ? "Overdue" : balance > 0 ? "Pending" : "On Time";
  return {
    balance: balance / 100,
    overdue: overdue / 100,
    purchases: fiados.length,
    status,
    oldestPendingDate,
    daysPending: oldestPendingDate ? Math.max(0, daysBetween(oldestPendingDate, today)) : 0,
  };
}

// "Ramón Batista" -> "RB"
export function initials(name) {
  return (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

// Teléfono opcional. Devuelve un texto de error, o "" si está bien.
export function validatePhone(value) {
  const v = (value || "").trim();
  if (!v) return "";
  if (!/^[+\d\s()-]+$/.test(v)) return "Use only numbers, spaces, + ( ) or -.";
  const digits = v.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return "Phone must have between 7 and 15 digits.";
  return "";
}

// Enlace para abrir WhatsApp con un mensaje ya escrito (gratis, sin API).
// En Panamá los números tienen 8 dígitos y el código del país es 507.
export function waLink(phone, text) {
  let digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 8) digits = `507${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

// Mensaje para WhatsApp; utiliza el idioma elegido en la interfaz.
export function reminderText({ name, balance, store, language = "es" }) {
  const first = (name || "").trim().split(/\s+/)[0] || "";
  if (language === "en") {
    return `Hi ${first}, this is a friendly reminder that you have an outstanding balance of ${money(balance)} at ${store || "our store"}. Thank you, and we hope to see you soon!`;
  }
  return `Hola ${first}, te recordamos que tienes ${money(balance)} pendiente en ${store || "nuestro negocio"}. ¡Gracias y te esperamos!`;
}

// ---------------------------------------------------------------------------
// Reglas para registrar fiados y pagos (se usan en la pantalla Credit)
// ---------------------------------------------------------------------------

// Convierte lo que escribe el usuario en un número con 2 decimales.
// Acepta "12.5", "12,50" o "B/. 12.50". Devuelve NaN si no es un número válido.
export function parseAmount(value) {
  const cleaned = String(value ?? "")
    .replace(/B\/\.?/gi, "")
    .replace(/\s/g, "")
    .replace(",", ".");
  if (cleaned === "" || !/^\d*\.?\d+$|^\d+\.$/.test(cleaned)) return NaN;
  return Math.round(Number(cleaned) * 100) / 100;
}

// Límite que se aplica a un cliente: el suyo, o el del negocio si no tiene.
export function effectiveLimit(client, settings) {
  const own = client?.credit_limit;
  return own === null || own === undefined ? Number(settings?.default_credit_limit ?? 100) : Number(own);
}

// ¿Se puede registrar este fiado? Devuelve un mensaje de error, o "" si está bien.
export function checkFiado({ amount, balance, limit, autoBlock }) {
  if (!(amount > 0)) return "Enter an amount greater than 0.";
  if (autoBlock && toCents(balance) + toCents(amount) > toCents(limit)) {
    const room = Math.max(0, toCents(limit) - toCents(balance)) / 100;
    return `Blocked: this credit would pass the limit of ${money(limit)}. Current debt is ${money(balance)} (room left: ${money(room)}).`;
  }
  return "";
}

// ¿Se puede registrar este pago? Devuelve un mensaje de error, o "" si está bien.
export function checkPayment({ amount, balance }) {
  if (!(balance > 0)) return "This customer has no debt.";
  if (!(amount > 0)) return "Enter an amount greater than 0.";
  if (toCents(amount) > toCents(balance)) return `The payment is higher than the debt (${money(balance)}).`;
  return "";
}

// Suma días a una fecha "YYYY-MM-DD" y devuelve "YYYY-MM-DD".
export function addDays(ymd, days) {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Number(days));
  return d.toISOString().slice(0, 10);
}

// "Today", "Yesterday" o "14 JUL".
export function relativeDay(timestamp, today = todayPanama(), locale = "en-GB") {
  const day = dateInPanama(timestamp);
  if (day === today) return "Today";
  if (day === addDays(today, -1)) return "Yesterday";
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", timeZone: "America/Panama" })
    .format(new Date(timestamp))
    .toUpperCase();
}

// Historial de UN cliente, del más nuevo al más viejo, con el estado de cada fiado:
//   Paid (ya cubierto) | Pending (debe, aún a tiempo) | Overdue (debe y ya venció)
// Los pagos se muestran como "Paid". Usa la misma regla: los pagos cubren primero lo más viejo.
export function annotateEntries(entries, today = todayPanama()) {
  const ordered = [...entries].sort((a, b) => {
    const diff = Date.parse(a.created_at) - Date.parse(b.created_at);
    return diff !== 0 ? diff : String(a.id).localeCompare(String(b.id));
  });
  let coverage = ordered.filter((e) => e.kind === "pago").reduce((s, e) => s + toCents(e.amount), 0);
  const status = new Map();
  for (const e of ordered) {
    if (e.kind !== "fiado") continue;
    const amount = toCents(e.amount);
    const covered = Math.min(coverage, amount);
    coverage -= covered;
    const remaining = amount - covered;
    status.set(e.id, remaining === 0 ? "Paid" : e.due_date && e.due_date < today ? "Overdue" : "Pending");
  }
  return ordered.reverse().map((e) => ({ ...e, status: e.kind === "pago" ? "Paid" : status.get(e.id) }));
}

// Resumen de todo el negocio (lo usan Credit, Dashboard y Reports).
//   clients = lista con balance/status ya calculados | entries = todos los movimientos
export function summarize(clients, entries, today = todayPanama()) {
  return {
    outstanding: clients.reduce((s, c) => s + toCents(c.balance), 0) / 100,
    customersWithDebt: clients.filter((c) => c.balance > 0).length,
    overdueCustomers: clients.filter((c) => c.status === "Overdue").length,
    paymentsToday:
      entries
        .filter((e) => e.kind === "pago" && dateInPanama(e.created_at) === today)
        .reduce((s, e) => s + toCents(e.amount), 0) / 100,
  };
}

// "14 JUL" a partir de una fecha-hora de la base de datos (hora de Panamá).
export function shortDate(timestamp, locale = "en-GB") {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", timeZone: "America/Panama" })
    .format(new Date(timestamp))
    .toUpperCase();
}

// "24 OCT" a partir de una fecha sin hora ("2026-10-24"), como la fecha límite de un fiado.
export function shortYmd(ymd, locale = "en-GB") {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", timeZone: "UTC" })
    .format(new Date(`${ymd}T00:00:00Z`))
    .toUpperCase();
}

// Qué porcentaje del límite se ha usado (0 a 100). Se calcula con centavos para no fallar con decimales.
export function percentUsed(balance, limit) {
  const b = toCents(balance);
  const l = toCents(limit);
  if (b <= 0) return 0;
  if (l <= 0) return 100;
  return Math.min(100, Math.round((b * 100) / l));
}
// Clientes que deben, primero los vencidos y luego los de mayor deuda.
export function rankDebtors(clients) {
  return clients
    .filter((c) => c.balance > 0)
    .sort((a, b) => (b.overdue > 0) - (a.overdue > 0) || b.balance - a.balance);
}

// ¿Al producto le queda poco (o nada)? Stock igual o menor que su mínimo.
export function isLowStock(product) {
  return Number(product.stock) <= Number(product.min_stock);
}

// "Graciela Moreno" -> "Graciela"
export function firstName(fullName) {
  return (fullName || "").trim().split(/\s+/)[0] || "";
}