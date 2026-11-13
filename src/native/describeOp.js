// Textos legibles para el panel de sincronización (puro: se puede probar sin la app).

const TEXT = {
  es: {
    "client.create": (n) => `Nuevo cliente${n ? `: ${n}` : ""}`,
    "client.update": (n) => `Cliente editado${n ? `: ${n}` : ""}`,
    "client.archive": (n) => `Cliente archivado${n ? `: ${n}` : ""}`,
    "product.create": (n) => `Nuevo producto${n ? `: ${n}` : ""}`,
    "product.update": (n) => `Producto editado${n ? `: ${n}` : ""}`,
    "product.archive": (n) => `Producto quitado${n ? `: ${n}` : ""}`,
    "credit.fiado": (n, a) => `Fiado de ${a}`,
    "credit.pago": (n, a) => `Pago de ${a}`,
    "sale.fiado": () => "Venta fiada",
    "reminder.log": () => "Recordatorio enviado",
    "profile.update": () => "Ajustes del negocio",
  },
  en: {
    "client.create": (n) => `New customer${n ? `: ${n}` : ""}`,
    "client.update": (n) => `Customer edited${n ? `: ${n}` : ""}`,
    "client.archive": (n) => `Customer archived${n ? `: ${n}` : ""}`,
    "product.create": (n) => `New product${n ? `: ${n}` : ""}`,
    "product.update": (n) => `Product edited${n ? `: ${n}` : ""}`,
    "product.archive": (n) => `Product removed${n ? `: ${n}` : ""}`,
    "credit.fiado": (n, a) => `Credit of ${a}`,
    "credit.pago": (n, a) => `Payment of ${a}`,
    "sale.fiado": () => "Credit sale",
    "reminder.log": () => "Reminder sent",
    "profile.update": () => "Business settings",
  },
};

export function describeOp(op, language, money = (v) => String(v)) {
  const texts = TEXT[language] || TEXT.en;
  const name = op.payload?.name || op.before?.name || "";
  const amount = op.payload?.amount !== undefined ? money(Number(op.payload.amount)) : "";
  return (texts[op.type] || (() => op.type))(name, amount);
}

// Campos que cambió mi edición frente a la versión del servidor (para revisar un conflicto)
export function conflictLines(op) {
  const server = op.server || {};
  return Object.keys(op.payload || {})
    .filter((key) => String(op.payload[key] ?? "") !== String(server[key] ?? ""))
    .map((key) => ({ field: key, mine: op.payload[key] ?? "—", server: server[key] ?? "—" }));
}

export function timeAgo(iso, language, now = Date.now()) {
  if (!iso) return null;
  const seconds = Math.round((Date.parse(iso) - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(language === "es" ? "es" : "en", { numeric: "auto" });
  const abs = Math.abs(seconds);
  if (abs < 60) return rtf.format(0, "second");
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  return rtf.format(Math.round(seconds / 86400), "day");
}
