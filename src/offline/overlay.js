// Muestra los cambios pendientes (todavía sin sincronizar) encima de los datos guardados en el dispositivo.
// Es puro: recibe datos y operaciones, y devuelve datos nuevos. No toca la red ni el navegador.

const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
const round2 = (n) => Math.round(n * 100) / 100;

function addDays(iso, days) {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const mark = (row, op) => ({ ...row, _sync: op.status === "conflict" ? "conflict" : "pending" });

// data = { clients, products, entries, profile }
export function applyPending(data, ops) {
  let clients = [...(data.clients || [])];
  let products = [...(data.products || [])];
  let entries = [...(data.entries || [])];
  let profile = data.profile ? { ...data.profile } : null;

  const patch = (list, id, fn) => list.map((r) => (r.id === id ? fn(r) : r));

  for (const op of ops) {
    const p = op.payload || {};
    switch (op.type) {
      case "client.create":
        clients.push(
          mark({ id: op.record_id, name: p.name, phone: p.phone ?? null, credit_limit: num(p.credit_limit), archived: false, created_at: op.occurred_at }, op)
        );
        break;
      case "client.update":
        clients = patch(clients, op.record_id, (r) => mark({ ...r, ...p, credit_limit: "credit_limit" in p ? num(p.credit_limit) : r.credit_limit }, op));
        break;
      case "client.archive":
        clients = patch(clients, op.record_id, (r) => mark({ ...r, archived: true }, op));
        break;
      case "product.create":
        products.push(
          mark(
            { id: op.record_id, unit: "unit", stock: 0, min_stock: 0, price: 0, category: null, image_url: null, archived: false, created_at: op.occurred_at, ...p },
            op
          )
        );
        break;
      case "product.update":
        products = patch(products, op.record_id, (r) => mark({ ...r, ...p }, op));
        break;
      case "product.archive":
        products = patch(products, op.record_id, (r) => mark({ ...r, archived: true }, op));
        break;
      case "credit.fiado":
      case "credit.pago": {
        const fiado = op.type === "credit.fiado";
        const days = Number(profile?.default_due_days ?? 15);
        entries.unshift({
          id: op.record_id,
          client_id: p.client_id,
          kind: fiado ? "fiado" : "pago",
          amount: Number(p.amount),
          description: p.description ?? null,
          due_date: fiado ? p.due_date || addDays(op.occurred_at, days) : null,
          created_at: op.occurred_at,
          _sync: op.status === "conflict" ? "conflict" : "pending",
        });
        break;
      }
      case "sale.fiado": {
        let total = 0;
        const parts = [];
        for (const item of p.items || []) {
          const prod = products.find((x) => x.id === item.product_id);
          if (!prod) continue;
          const qty = Number(item.quantity);
          total += round2(Number(prod.price) * qty);
          parts.push(`${prod.name} x${qty}`);
          products = patch(products, prod.id, (r) => ({ ...r, stock: Math.max(0, Number(r.stock) - qty), _sync: "pending" }));
        }
        const days = Number(profile?.default_due_days ?? 15);
        entries.unshift({
          id: op.record_id || op.id,
          client_id: p.client_id,
          kind: "fiado",
          amount: round2(total),
          description: p.note || parts.join(", "),
          due_date: p.due_date || addDays(op.occurred_at, days),
          created_at: op.occurred_at,
          _sync: "pending",
        });
        break;
      }
      case "profile.update":
        profile = { ...(profile || {}), ...p, _sync: "pending" };
        break;
      default:
        break; // reminder.log y otros: no cambian lo que se muestra
    }
  }

  entries.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return { clients, products, entries, profile };
}
