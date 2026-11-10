// Reglas de productos y de la venta fiada. Todo el cálculo vive aquí (y se prueba aparte).
import { parseAmount, checkFiado } from "@/lib/credit";

export const UNITS = ["unit", "lb", "kg", "bottle", "pack", "box", "bag", "liter"];
export const DEFAULT_CATEGORIES = ["Pantry", "Bakery", "Beverages", "Dairy", "Snacks", "Cleaning", "Other"];

const toCents = (n) => Math.round(Number(n || 0) * 100);

// 25 -> "25"   |   2.5 -> "2.5"   |   2.504 -> "2.5"
export function formatQty(n) {
  const v = Number(n);
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
}

// "25 lb", "12 unit"
export function stockLabel(product) {
  return `${formatQty(product.stock)} ${product.unit}`;
}

// Cantidad escrita por el usuario ("2", "2.5", "2,5"). Devuelve NaN si no es un número válido (0 se acepta).
export function parseQty(value) {
  const cleaned = String(value ?? "").replace(/\s/g, "").replace(",", ".");
  if (cleaned === "" || !/^\d*\.?\d+$|^\d+\.$/.test(cleaned)) return NaN;
  return Math.round(Number(cleaned) * 100) / 100;
}

// Valida el formulario de producto. Devuelve { error } o { values } listos para guardar.
export function validateProduct(form) {
  const name = (form.name || "").trim();
  if (!name) return { error: "Name is required." };
  const price = parseAmount(form.price);
  if (Number.isNaN(price)) return { error: "Price must be a number (for example 0.85)." };
  const stock = parseQty(form.stock);
  if (Number.isNaN(stock)) return { error: "Stock must be a number (0 or more)." };
  const minRaw = String(form.min_stock ?? "").trim();
  const min_stock = minRaw === "" ? 0 : parseQty(minRaw);
  if (Number.isNaN(min_stock)) return { error: "Minimum stock must be a number (0 or more)." };
  if (!UNITS.includes(form.unit)) return { error: "Choose a unit." };
  const image = (form.image_url || "").trim();
  if (image && !/^https?:\/\/\S+$/i.test(image)) return { error: "The image link must start with http:// or https://." };
  return {
    values: {
      name,
      category: (form.category || "").trim() || null,
      price,
      stock,
      unit: form.unit,
      min_stock,
      image_url: image || null,
    },
  };
}

// Carrito: { idDelProducto: "2.5" }  ->  líneas con su total, ignorando cantidades vacías o en cero.
export function cartLines(cart, products) {
  const lines = [];
  for (const product of products) {
    const qty = parseQty(cart[product.id]);
    if (!(qty > 0)) continue;
    lines.push({ product, qty, lineTotal: Math.round(toCents(product.price) * qty) / 100 });
  }
  return lines;
}

export function cartTotal(lines) {
  return lines.reduce((sum, l) => sum + toCents(l.lineTotal), 0) / 100;
}

// ¿Se puede registrar esta venta fiada? Devuelve un mensaje de error, o "" si está bien.
export function checkSale({ lines, client, limit, autoBlock }) {
  if (!client) return "Choose a customer.";
  if (lines.length === 0) return "Add at least one product.";
  for (const l of lines) {
    if (l.qty > Number(l.product.stock)) {
      return `Not enough stock of ${l.product.name}: only ${stockLabel(l.product)} available.`;
    }
  }
  const total = cartTotal(lines);
  if (!(total > 0)) return "The total must be greater than 0.";
  return checkFiado({ amount: total, balance: client.balance, limit, autoBlock });
}