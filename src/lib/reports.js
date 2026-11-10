// Todos los cálculos de la pantalla Reports. Aquí no hay pantalla: solo reglas y números,
// así se pueden probar aparte y se usan igual para la vista, el Excel y el PDF.
import { addDays, dateInPanama, todayPanama, annotateEntries, money, shortYmd } from "@/lib/credit";

const toCents = (n) => Math.round(Number(n || 0) * 100);

export function daysBetween(fromYmd, toYmd) {
  return Math.round((Date.parse(`${toYmd}T00:00:00Z`) - Date.parse(`${fromYmd}T00:00:00Z`)) / 86400000);
}
export const startOfMonth = (ymd) => `${ymd.slice(0, 7)}-01`;
export function endOfMonth(ymd) {
  const [y, m] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Períodos
// ---------------------------------------------------------------------------
export const PRESETS = [
  { key: "month", label: "This month" },
  { key: "lastMonth", label: "Last month" },
  { key: "last30", label: "Last 30 days" },
  { key: "year", label: "This year" },
];

export function presetRange(key, today = todayPanama()) {
  switch (key) {
    case "lastMonth": {
      const to = addDays(startOfMonth(today), -1);
      return { from: startOfMonth(to), to };
    }
    case "last30":
      return { from: addDays(today, -29), to: today };
    case "year":
      return { from: `${today.slice(0, 4)}-01-01`, to: today };
    default:
      return { from: startOfMonth(today), to: today };
  }
}

// El período anterior, del mismo largo, justo antes del actual.
export function previousRange(from, to) {
  const length = daysBetween(from, to) + 1;
  const prevTo = addDays(from, -1);
  return { from: addDays(prevTo, -(length - 1)), to: prevTo };
}

const inRange = (ymd, from, to) => ymd >= from && ymd <= to;

// Divide el período en semanas (o en meses si es muy largo) para el gráfico.
export function buildBuckets(from, to, locale = "en-GB") {
  const buckets = [];
  if (daysBetween(from, to) + 1 <= 84) {
    for (let start = from; start <= to; start = addDays(start, 7)) {
      const end = addDays(start, 6) > to ? to : addDays(start, 6);
      buckets.push({ label: shortYmd(start, locale), start, end });
    }
  } else {
    let cursor = startOfMonth(from);
    while (cursor <= to) {
      const monthEnd = endOfMonth(cursor);
      buckets.push({
        label: new Intl.DateTimeFormat(locale, { month: "short", year: "2-digit", timeZone: "UTC" })
          .format(new Date(`${cursor}T00:00:00Z`))
          .toUpperCase()
          .replace(/\s+DE\s+/g, " "),
        start: cursor < from ? from : cursor,
        end: monthEnd > to ? to : monthEnd,
      });
      cursor = addDays(monthEnd, 1);
    }
  }
  return buckets;
}

// ---------------------------------------------------------------------------
// Utilidades de números
// ---------------------------------------------------------------------------

// Cambio porcentual entre dos montos. { pct, label } ("+25%", "-10%", "New", "No change").
export function percentChange(current, previous) {
  const c = toCents(current);
  const p = toCents(previous);
  if (p === 0) return c === 0 ? { pct: 0, label: "No change" } : { pct: null, label: "New" };
  const pct = Math.round(((c - p) / p) * 100);
  return { pct, label: pct === 0 ? "0%" : `${pct > 0 ? "+" : ""}${pct}%` };
}

// Reparte 100% entre varios montos sin que la suma se pase ni se quede corta (método del mayor resto).
export function percentages(values) {
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return values.map(() => 0);
  const raw = values.map((v) => (v / total) * 100);
  const floors = raw.map(Math.floor);
  let left = 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, frac: r - floors[i] })).sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < left; k++) floors[order[k].i] += 1;
  return floors;
}

// Qué parte de cada fiado sigue sin pagar. Los pagos cubren primero lo más viejo (igual que en toda la web).
function fiadoRemaining(list) {
  const byTime = (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || String(a.id).localeCompare(String(b.id));
  let coverage = list.filter((e) => e.kind === "pago").reduce((s, e) => s + toCents(e.amount), 0);
  const out = new Map();
  for (const f of list.filter((e) => e.kind === "fiado").sort(byTime)) {
    const amount = toCents(f.amount);
    const covered = Math.min(coverage, amount);
    coverage -= covered;
    out.set(f.id, amount - covered);
  }
  return out;
}

// Deuda total (en centavos) hasta el final de un día.
function balanceAt(entries, ymd) {
  let cents = 0;
  for (const e of entries) {
    if (dateInPanama(e.created_at) > ymd) continue;
    cents += e.kind === "fiado" ? toCents(e.amount) : -toCents(e.amount);
  }
  return Math.max(0, cents);
}

// ---------------------------------------------------------------------------
// Filtro de clientes: "all" | "status:Overdue" | "client:<id>"
// ---------------------------------------------------------------------------
export function allowedClientIds(clients, filter) {
  if (!filter || filter === "all") return null;
  if (filter.startsWith("status:")) {
    const status = filter.slice(7);
    return new Set(clients.filter((c) => c.status === status).map((c) => c.id));
  }
  if (filter.startsWith("client:")) {
    const id = filter.slice(7);
    return new Set(clients.filter((c) => c.id === id).map((c) => c.id));
  }
  return null;
}

export function filterLabel(clients, filter) {
  if (!filter || filter === "all") return "All customers";
  if (filter.startsWith("status:")) return `Status: ${filter.slice(7)}`;
  const c = clients.find((x) => `client:${x.id}` === filter);
  return c ? c.name : "Customer";
}

// ---------------------------------------------------------------------------
// El reporte completo
// ---------------------------------------------------------------------------
export function buildReport({ clients, entries, names = {}, from, to, filter = "all", today = todayPanama(), locale = "en-GB" }) {
  const allowed = allowedClientIds(clients, filter);
  const scopedEntries = allowed ? entries.filter((e) => allowed.has(e.client_id)) : entries;
  const scopedClients = allowed ? clients.filter((c) => allowed.has(c.id)) : clients;

  // Estado de cada movimiento y lo que falta por pagar de cada fiado (por cliente)
  const byClient = new Map();
  for (const e of scopedEntries) {
    if (!byClient.has(e.client_id)) byClient.set(e.client_id, []);
    byClient.get(e.client_id).push(e);
  }
  const remaining = new Map();
  const status = new Map();
  for (const list of byClient.values()) {
    for (const [id, rem] of fiadoRemaining(list)) remaining.set(id, rem);
    for (const row of annotateEntries(list, today)) status.set(row.id, row.status);
  }

  const day = new Map(scopedEntries.map((e) => [e.id, dateInPanama(e.created_at)]));
  const prev = previousRange(from, to);
  const payments = scopedEntries.filter((e) => e.kind === "pago");
  const fiados = scopedEntries.filter((e) => e.kind === "fiado");
  const sum = (list) => list.reduce((s, e) => s + toCents(e.amount), 0);
  const within = (list, a, b) => list.filter((e) => inRange(day.get(e.id), a, b));

  // --- Tarjetas
  const collected = sum(within(payments, from, to));
  const collectedPrev = sum(within(payments, prev.from, prev.to));
  const activeCredit = scopedClients.reduce((s, c) => s + toCents(c.balance), 0);
  const startBalance = balanceAt(scopedEntries, addDays(from, -1));
  const overdueAmount = scopedClients.reduce((s, c) => s + toCents(c.overdue), 0);
  const pending = scopedClients.reduce((s, c) => s + toCents(c.balance) - toCents(c.overdue), 0);
  const newCustomers = scopedClients.filter((c) => c.created_at && inRange(dateInPanama(c.created_at), from, to)).length;

  const cards = {
    activeCredit: activeCredit / 100,
    activeCreditChange: percentChange(activeCredit / 100, startBalance / 100),
    collected: collected / 100,
    collectedChange: percentChange(collected / 100, collectedPrev / 100),
    pending: pending / 100,
    overdueAmount: overdueAmount / 100,
    overdueCustomers: scopedClients.filter((c) => c.status === "Overdue").length,
    customers: scopedClients.length,
    newCustomers,
  };

  // --- Gráfico
  const chart = buildBuckets(from, to, locale).map((b) => {
    const issued = sum(within(fiados, b.start, b.end));
    const received = sum(within(payments, b.start, b.end));
    const overdue = fiados
      .filter((f) => f.due_date && f.due_date < today && inRange(f.due_date, b.start, b.end))
      .reduce((s, f) => s + (remaining.get(f.id) || 0), 0);
    return { label: b.label, issued: issued / 100, received: received / 100, overdue: overdue / 100 };
  });

  // --- Estado de los créditos entregados en el período
  const issuedList = within(fiados, from, to);
  let paid = 0;
  let pendingIssued = 0;
  let overdueIssued = 0;
  for (const f of issuedList) {
    const rem = remaining.get(f.id) || 0;
    paid += toCents(f.amount) - rem;
    if (f.due_date && f.due_date < today) overdueIssued += rem;
    else pendingIssued += rem;
  }
  const pcts = percentages([paid, pendingIssued, overdueIssued]);
  const breakdown = [
    { key: "Paid", amount: paid / 100, pct: pcts[0] },
    { key: "Pending", amount: pendingIssued / 100, pct: pcts[1] },
    { key: "Overdue", amount: overdueIssued / 100, pct: pcts[2] },
  ];

  // --- Movimientos del período (del más nuevo al más viejo)
  const rows = scopedEntries
    .filter((e) => inRange(day.get(e.id), from, to))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) || String(b.id).localeCompare(String(a.id)))
    .map((e) => ({
      id: e.id,
      date: day.get(e.id),
      name: names[e.client_id] || "Client",
      description: e.description || (e.kind === "pago" ? "Payment" : "Credit sale"),
      kind: e.kind,
      amount: Number(e.amount),
      status: status.get(e.id) || "Paid",
    }));

  return { range: { from, to }, cards, chart, breakdown, issued: sum(issuedList) / 100, rows };
}

// Páginas de la tabla de movimientos.
export function paginate(rows, page, size = 10) {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(Math.max(1, page), pages);
  const startIndex = (current - 1) * size;
  return { items: rows.slice(startIndex, startIndex + size), page: current, pages, total: rows.length, from: rows.length ? startIndex + 1 : 0, to: Math.min(rows.length, startIndex + size) };
}

// Los números de página que se muestran (máximo 5 alrededor de la actual).
export function pageWindow(page, pages, max = 5) {
  const start = Math.max(1, Math.min(page - Math.floor(max / 2), pages - max + 1));
  return Array.from({ length: Math.min(max, pages) }, (_, i) => start + i);
}

// Los datos del reporte listos para Excel o PDF.
export function reportTables(report, { filterLabel: customers = "All customers", language = "en" } = {}) {
  const es = language === "es";
  const c = report.cards;
  const labels = es
    ? { summary: "Resumen", transactions: "Transacciones", metric: "Indicador", value: "Valor", empty: "No hay movimientos en este período.", page: "Página" }
    : { summary: "Summary", transactions: "Transactions", metric: "Metric", value: "Value", empty: "No transactions in this period.", page: "Page" };
  const summary = [
    { label: es ? "Crédito activo total" : "Total active credit", value: c.activeCredit },
    { label: es ? "Cobrado en el período" : "Collected in period", value: c.collected },
    { label: es ? "Saldos pendientes" : "Pending balances", value: c.pending },
    { label: es ? "Monto vencido" : "Overdue amount", value: c.overdueAmount },
    { label: es ? "Fiados registrados en el período" : "Credit issued in period", value: report.issued },
  ].map((item) => ({ ...item, text: money(item.value) }));
  summary.push({ label: es ? "Clientes" : "Customers", value: c.customers, text: String(c.customers) });
  return {
    title: es ? "FIA'O - Informe del negocio" : "FIA'O - Business Report",
    subtitle: es
      ? [`Período: ${report.range.from} a ${report.range.to}`, `Clientes: ${customers}`]
      : [`Period: ${report.range.from} to ${report.range.to}`, `Customers: ${customers}`],
    summary,
    headers: es
      ? ["Fecha", "Cliente", "Descripción", "Tipo", "Monto (B/.)", "Estado"]
      : ["Date", "Customer", "Description", "Type", "Amount (B/.)", "Status"],
    labels,
    rows: report.rows.map((r) => {
      const payment = r.kind === "pago";
      const type = es ? (payment ? "Abono" : "Fiado") : (payment ? "Payment" : "Credit");
      const status = es ? ({ Paid: "Pagado", Pending: "Pendiente", Overdue: "Vencido" }[r.status] || r.status) : r.status;
      return {
        cells: [r.date, r.name, r.description, type, payment ? -r.amount : r.amount, status],
        text: [r.date, r.name, r.description, type, (payment ? "- " : "") + money(r.amount), status],
      };
    }),
  };
}

export function truncate(text, max) {
  const s = String(text ?? "");
  return s.length <= max ? s : `${s.slice(0, Math.max(0, max - 3))}...`;
}