import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, Pencil, Trash2, Plus, Bell, Package, Minus, X } from "lucide-react";
import { fetchProducts, addProduct, editProduct, archiveProduct, registerFiadoSale, PRODUCT_KEYS } from "@/api/productsApi";
import { fetchLedger, LEDGER_KEYS } from "@/api/creditApi";
import { money, isLowStock, effectiveLimit, addDays, todayPanama, shortYmd } from "@/lib/credit";
import {
  UNITS,
  DEFAULT_CATEGORIES,
  formatQty,
  validateProduct,
  parseQty,
  cartLines,
  cartTotal,
  checkSale,
} from "@/lib/products";
import { useLanguage } from "@/contexts/LanguageContext";
import SyncBadge from "@/native/SyncBadge";
import { confirmAction } from "@/native/confirm";

const fieldStyle = { backgroundColor: "var(--white)", borderColor: "var(--border-cream)", color: "var(--text)" };
const cardStyle = { backgroundColor: "var(--white)", border: "1px solid var(--border-cream)" };

// Foto del producto; si no hay o no carga, se muestra un icono.
function ProductImage({ product }) {
  const [failed, setFailed] = useState(false);
  if (!product.image_url || failed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1 px-2 text-center" style={{ color: "var(--text-faint)" }}>
        <Package className="w-10 h-10" />
        <span className="text-xs font-semibold">{product.name}</span>
      </div>
    );
  }
  return <img src={product.image_url} alt={product.name} onError={() => setFailed(true)} className="w-full h-full object-cover" />;
}

function Note({ note }) {
    const { t } = useLanguage();
  if (!note) return null;
  const ok = note.type === "ok";
  return (
    <p
      role={ok ? "status" : "alert"}
      className="text-sm rounded-xl px-3 py-2 mt-3"
      style={{ backgroundColor: ok ? "var(--ok-bg)" : "var(--bad-bg)", color: ok ? "var(--ok-text)" : "var(--bad-text)" }}
    >
      {t(note.text)}
    </p>
  );
}

// Ventana para crear o editar un producto.
export function ProductModal({ product, categories, onClose }) {
    const { t } = useLanguage();
  const queryClient = useQueryClient();
  const isNew = !product;
  const [form, setForm] = useState({
    name: product?.name || "",
    category: product?.category || "",
    price: product ? String(product.price) : "",
    stock: product ? String(product.stock) : "",
    unit: product?.unit || "unit",
    min_stock: product ? String(product.min_stock) : "",
    image_url: product?.image_url || "",
  });
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = useMutation({
    mutationFn: (values) => (isNew ? addProduct(values) : editProduct(product.id, values)),
    onSuccess: () => {
      PRODUCT_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      onClose();
    },
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const result = validateProduct(form);
    if (result.error) return setError(result.error);
    save.mutate(result.values);
  };

  const label = "text-xs font-semibold block mb-1.5";
  const input = "w-full rounded-xl px-4 py-2.5 text-sm border outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? t("New product") : t("Edit product")}
        className="w-full max-w-md rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "var(--white)", boxShadow: "0 20px 50px rgba(0,0,0,0.35)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-bold text-xl" style={{ color: "var(--text)", fontFamily: "Poppins" }}>
            {isNew ? t("New product") : t("Edit product")}
          </h2>
          <button onClick={onClose} aria-label={t("Close")} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className={label} style={{ color: "var(--text-muted)" }}>{t("NAME *")}</span>
            <input value={form.name} onChange={set("name")} autoFocus placeholder={t("Rice")} className={input} style={fieldStyle} />
          </label>
          <label className="block">
            <span className={label} style={{ color: "var(--text-muted)" }}>{t("CATEGORY")}</span>
            <input value={form.category} onChange={set("category")} list="product-categories" placeholder={t("Pantry")} className={input} style={fieldStyle} />
            <datalist id="product-categories">
              {categories.map((c) => (
                <option key={c} value={c} label={t(c)} />
              ))}
            </datalist>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={label} style={{ color: "var(--text-muted)" }}>{t("PRICE (B/.) *")}</span>
              <input value={form.price} onChange={set("price")} inputMode="decimal" placeholder="0.95" className={input} style={fieldStyle} />
            </label>
            <label className="block">
              <span className={label} style={{ color: "var(--text-muted)" }}>{t("SOLD BY")}</span>
              <select value={form.unit} onChange={set("unit")} className={input} style={fieldStyle}>
                {UNITS.map((u) => (
                  <option key={u} value={u}>{t(u)}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={label} style={{ color: "var(--text-muted)" }}>{t("STOCK *")}</span>
              <input value={form.stock} onChange={set("stock")} inputMode="decimal" placeholder="38" className={input} style={fieldStyle} />
            </label>
            <label className="block">
              <span className={label} style={{ color: "var(--text-muted)" }}>{t("ALERT BELOW")}</span>
              <input value={form.min_stock} onChange={set("min_stock")} inputMode="decimal" placeholder="5" className={input} style={fieldStyle} />
            </label>
          </div>
          <label className="block">
            <span className={label} style={{ color: "var(--text-muted)" }}>{t("IMAGE LINK (optional)")}</span>
            <input value={form.image_url} onChange={set("image_url")} placeholder="https://..." className={input} style={fieldStyle} />
          </label>

          {error && (
            <p role="alert" className="text-sm rounded-xl px-3 py-2" style={{ backgroundColor: "var(--bad-bg)", color: "var(--bad-text)" }}>
              {t(error)}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={save.isPending} className="flex-1 py-3 rounded-full font-bold text-sm text-white disabled:opacity-60" style={{ backgroundColor: "#B91C1C" }}>
              {save.isPending ? t("Saving...") : isNew ? t("Add product") : t("Save changes")}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-3 rounded-full font-bold text-sm border" style={{ backgroundColor: "var(--white)", color: "var(--text)", borderColor: "var(--border-cream)" }}>
              {t("Cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Pestaña "Register Fiado Sale": elegir cliente y productos, y registrar todo en un solo paso.
export function SaleTab({ products, query, initialCart = {} }) {
    const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const { data: ledger, isLoading, isError, error, refetch } = useQuery({ queryKey: ["credit"], queryFn: fetchLedger });
  const clients = ledger?.clients ?? [];
  const settings = ledger?.settings ?? { default_credit_limit: 100, default_due_days: 15, auto_block: true };

  const [clientId, setClientId] = useState("");
  const [cart, setCart] = useState(initialCart);
  const [due, setDue] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState(null);

  const client = clients.find((c) => c.id === clientId) || clients[0];
  const today = todayPanama();
  const limit = client ? effectiveLimit(client, settings) : 0;
  const room = client ? Math.max(0, limit - client.balance) : 0;
  const lines = useMemo(() => cartLines(cart, products), [cart, products]);
  const total = cartTotal(lines);

  const q = query.trim().toLowerCase();
  const visible = products.filter((p) => !q || p.name.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q));

  const setQty = (id, value) => {
    setMsg(null);
    setCart({ ...cart, [id]: value });
  };
  const bump = (product, delta) => {
    const current = parseQty(cart[product.id]);
    const next = Math.max(0, (Number.isNaN(current) ? 0 : current) + delta);
    setQty(product.id, next === 0 ? "" : formatQty(next));
  };

  const sale = useMutation({
    mutationFn: registerFiadoSale,
    onSuccess: (_, vars) => {
      [...LEDGER_KEYS, ...PRODUCT_KEYS].forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      setCart({});
      setDue("");
      setNote("");
      setMsg({ type: "ok", text: `Sale registered: ${money(vars.total)} added to ${vars.clientName}'s debt.` });
    },
    onError: (e) => setMsg({ type: "error", text: e.message }),
  });

  const submit = (e) => {
    e.preventDefault();
    setMsg(null);
    const problem = checkSale({ lines, client, limit, autoBlock: settings.auto_block });
    if (problem) return setMsg({ type: "error", text: problem });
    if (due && due < today) return setMsg({ type: "error", text: "The due date can't be in the past." });
    sale.mutate({
      client_id: client.id,
      items: lines.map((l) => ({ product_id: l.product.id, quantity: l.qty })),
      due_date: due,
      note,
      total,
      clientName: client.name,
    });
  };

  if (isLoading) return <p className="py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>{t("Loading...")}</p>;
  if (isError) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm mb-3" style={{ color: "var(--bad-text)" }}>{t("Could not load customers:")} {t(error.message)}</p>
        <button onClick={() => refetch()} className="px-5 py-2 rounded-full text-sm font-bold text-white" style={{ backgroundColor: "#B91C1C" }}>{t("Try again")}</button>
      </div>
    );
  }
  if (clients.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="font-bold mb-1" style={{ color: "var(--text)" }}>{t("You need a customer first")}</p>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>{t("Register who you sell on credit to.")}</p>
        <Link to="/clients" className="inline-block px-5 py-2.5 rounded-full text-sm font-bold" style={{ backgroundColor: "#F9D103", color: "var(--on-yellow)" }}>{t("Go to Clients")}</Link>
      </div>
    );
  }
  if (products.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="font-bold mb-1" style={{ color: "var(--text)" }}>{t("Your inventory is empty")}</p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("Add products in the Inventory tab, then come back to register a sale.")}</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      {/* Products */}
      <div className="lg:col-span-2 space-y-2">
        {visible.length === 0 && <p className="py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>{t("No products match your search.")}</p>}
        {visible.map((p) => {
          const out = Number(p.stock) <= 0;
          const inCart = lines.find((l) => l.product.id === p.id);
          return (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl" style={cardStyle}>
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: "var(--surface)" }}>
                {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5" style={{ color: "var(--text-faint)" }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{p.name}</p>
                  <SyncBadge status={p._sync} />
                </div>
                <p className="text-xs" style={{ color: out ? "var(--bad-text)" : "var(--text-muted)" }}>
                  {money(p.price)} · {out ? t("Out of stock") : `${formatQty(p.stock)} ${t(p.unit)} ${t("left")}`}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" aria-label={t(`Remove one ${p.name}`)} disabled={!inCart} onClick={() => bump(p, -1)}
                  className="w-8 h-8 rounded-full flex items-center justify-center border disabled:opacity-40" style={{ ...fieldStyle }}>
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input aria-label={t(`Quantity of ${p.name}`)} value={cart[p.id] ?? ""} onChange={(e) => setQty(p.id, e.target.value)} disabled={out}
                  inputMode="decimal" placeholder="0" className="w-14 text-center rounded-lg py-1.5 text-sm font-semibold border outline-none disabled:opacity-40" style={fieldStyle} />
                <button type="button" aria-label={t(`Add one ${p.name}`)} disabled={out} onClick={() => bump(p, 1)}
                  className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-40" style={{ backgroundColor: "#F9D103", color: "var(--on-yellow)" }}>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sale summary */}
      <form onSubmit={submit} className="rounded-2xl p-5 h-fit" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-cream)" }}>
        <label htmlFor="sale-customer" className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>{t("CUSTOMER")}</label>
        <select id="sale-customer" value={client.id} onChange={(e) => { setClientId(e.target.value); setMsg(null); }}
          className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold border outline-none mb-2" style={fieldStyle}>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          {t("Debt")} {money(client.balance)} {t("· Limit")} {money(limit)} {t("· Room left")} {money(room)}
        </p>

        <h3 className="font-bold text-sm mb-2" style={{ color: "var(--text)" }}>{t("Sale")}</h3>
        {lines.length === 0 ? (
          <p className="text-sm mb-4" style={{ color: "var(--text-faint)" }}>{t("Add products with the + button.")}</p>
        ) : (
          <div className="space-y-1.5 mb-3">
            {lines.map((l) => (
              <div key={l.product.id} className="flex justify-between text-sm gap-2" style={{ color: "var(--text)" }}>
                <span className="truncate">{formatQty(l.qty)} {t("×")} {l.product.name}</span>
                <span className="font-semibold">{money(l.lineTotal)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between font-bold text-base pt-3 mb-4" style={{ color: "var(--text)", borderTop: "1px solid var(--border-cream)" }}>
          <span>{t("Total")}</span>
          <span style={{ color: "var(--accent-text)" }}>{money(total)}</span>
        </div>

        <label htmlFor="sale-due" className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>
          {t("Due date (empty =")} {settings.default_due_days} {t("days,")} {shortYmd(addDays(today, settings.default_due_days), language === "es" ? "es-PA" : "en-GB")})
        </label>
        <input id="sale-due" type="date" min={today} value={due} onChange={(e) => setDue(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none mb-3" style={fieldStyle} />
        <label htmlFor="sale-note" className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>{t("Note (optional)")}</label>
        <input id="sale-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("Picked up by his son")} className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none mb-4" style={fieldStyle} />

        <button type="submit" disabled={sale.isPending} className="w-full py-3 rounded-full font-bold text-sm text-white disabled:opacity-60" style={{ backgroundColor: "#B91C1C" }}>
          {sale.isPending ? t("Saving...") : t("Register Fiado Sale")}
        </button>
        <Note note={msg} />
      </form>
    </div>
  );
}

export default function Products({ initialTab = "Inventory" }) {
    const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(initialTab);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null); // null | { product } (product = null para "nuevo")
  const [actionError, setActionError] = useState("");

  const { data: products = [], isLoading, isError, error, refetch } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => !q || p.name.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q));
  }, [products, query]);
  const lowStock = useMemo(() => products.filter(isLowStock), [products]);
  const categories = useMemo(
    () => [...new Set([...DEFAULT_CATEGORIES, ...products.map((p) => p.category).filter(Boolean)])],
    [products]
  );

  const archive = useMutation({
    mutationFn: archiveProduct,
    onSuccess: () => PRODUCT_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: key })),
    onError: (e) => setActionError(e.message),
  });
  const remove = (p) => {
    setActionError("");
    confirmAction(`Remove ${p.name}? It will leave your inventory. Past sales keep their history.`).then((ok) => {
      if (ok) archive.mutate(p.id);
    });
  };

  const tabButton = (key, label) => (
    <button data-tour={`products-tab-${key.toLowerCase()}`}
      onClick={() => setTab(key)}
      className="px-5 py-2.5 rounded-full text-sm font-semibold transition"
      style={{ backgroundColor: tab === key ? "#B91C1C" : "var(--surface)", color: tab === key ? "#FFFFFF" : "var(--text)" }}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--page-bg)" }}>
      <Navbar />

      <main className="flex-1">
        {/* Sub-nav */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div data-tour="products-tabs" className="flex gap-2 mt-2">
            {tabButton("Inventory", "Inventory")}
            {tabButton("Fiado", "Register Fiado Sale")}
          </div>
        </div>

        {/* Content card */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
          <div data-tour="products-content" className="rounded-3xl p-6 sm:p-8" style={{ backgroundColor: "var(--surface-alt)" }}>
            {/* Search */}
            <div data-tour="products-search" className="relative mb-6 max-w-md">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Search products...")}
                className="w-full rounded-full pl-11 pr-4 py-2.5 text-sm border outline-none"
                style={fieldStyle}
              />
            </div>

            <h1 className="font-bold text-3xl sm:text-4xl mb-2" style={{ color: "var(--text)", fontFamily: "Poppins" }}>
              {tab === "Inventory" ? t("Your inventory, always exact") : t("Register a fiado sale")}
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              {tab === "Inventory"
                ? t("Add, edit and track your products. Use the search bar to look up items.")
                : t("Pick the customer and the products. The debt is registered and your stock goes down automatically.")}
            </p>

            {actionError && (
              <p role="alert" className="text-sm rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: "var(--bad-bg)", color: "var(--bad-text)" }}>
                {actionError}
              </p>
            )}

            {isLoading ? (
              <p className="py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>{t("Loading products...")}</p>
            ) : isError ? (
              <div className="py-10 text-center">
                <p className="text-sm mb-3" style={{ color: "var(--bad-text)" }}>{t("Could not load products:")} {t(error.message)}</p>
                <button onClick={() => refetch()} className="px-5 py-2 rounded-full text-sm font-bold text-white" style={{ backgroundColor: "#B91C1C" }}>{t("Try again")}</button>
              </div>
            ) : tab === "Fiado" ? (
              <SaleTab products={products} query={query} />
            ) : (
              <>
                {/* Inventory alerts banner */}
                {lowStock.length > 0 && (
                  <div className="flex items-center gap-3 p-4 rounded-xl mb-6" style={{ backgroundColor: "var(--warn-bg)", border: "1px solid #F9D103" }}>
                    <Bell className="w-5 h-5 flex-shrink-0" style={{ color: "var(--warn-text)" }} />
                    <p className="text-sm" style={{ color: "var(--warn-text)" }}>
                      <span className="font-bold">{t("Inventory Alert:")}</span>{" "}
                      {lowStock.length} {lowStock.length === 1 ? t("product is") : t("products are")} {t("running low or out of stock:")}{" "}
                      {lowStock.slice(0, 4).map((p) => p.name).join(", ")}
                      {lowStock.length > 4 ? ` ${t(`and ${lowStock.length - 4} more`)}` : ""}.
                    </p>
                  </div>
                )}

                {products.length > 0 && filtered.length === 0 && (
                  <p className="pb-6 text-sm" style={{ color: "var(--text-muted)" }}>{t("No products match your search.")}</p>
                )}

                {/* Grid */}
                <div data-tour="products-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {filtered.map((p) => {
                    const low = isLowStock(p);
                    return (
                      <div key={p.id} className="rounded-2xl overflow-hidden" style={cardStyle}>
                        <div className="aspect-square flex items-center justify-center" style={{ backgroundColor: "var(--surface)" }}>
                          <ProductImage key={`${p.id}-${p.image_url}`} product={p} />
                        </div>
                        <div className="p-4">
                          {p.category && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2" style={{ backgroundColor: "#F9D103", color: "var(--on-yellow)" }}>
                              {t(p.category)}
                            </span>
                          )}
                          <h3 className="font-bold text-sm mb-0.5" style={{ color: "var(--text)" }}>{p.name}</h3>
                          <p className="font-bold text-base mb-1" style={{ color: "var(--accent-text)" }}>{money(p.price)}</p>
                          <p className="text-xs mb-3" style={{ color: low ? "var(--bad-text)" : "var(--text-muted)" }}>
                            {t("Stock:")} {formatQty(p.stock)} {t(p.unit)}
                            {low ? (Number(p.stock) <= 0 ? t(" · Out of stock") : t(" · Running low")) : ""}
                          </p>
                          <div className="flex gap-2">
                            <button onClick={() => setModal({ product: p })} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold"
                              style={{ backgroundColor: "var(--surface)", color: "var(--text)", border: "1px solid var(--border-cream)" }}>
                              <Pencil className="w-3 h-3" /> {t("Edit")}
                            </button>
                            <button onClick={() => remove(p)} disabled={archive.isPending} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold disabled:opacity-60"
                              style={{ backgroundColor: "var(--bad-bg)", color: "var(--bad-text)" }}>
                              <Trash2 className="w-3 h-3" /> {t("Remove")}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add card */}
                  <button data-tour="products-add" onClick={() => setModal({ product: null })} className="rounded-2xl flex flex-col items-center justify-center p-6 min-h-[280px]" style={{ border: "2px dashed var(--border-cream)", backgroundColor: "transparent" }}>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: "#F9D103" }}>
                      <Plus className="w-6 h-6" style={{ color: "var(--on-yellow)" }} />
                    </div>
                    <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{t("Add New Product")}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {products.length === 0 ? t("Your inventory is empty. Start here.") : t("Create a new item")}
                    </p>
                  </button>
                </div>

                {/* Digital catalog note */}
                <div className="mt-8 p-5 rounded-2xl" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-cream)" }}>
                  <h3 className="font-bold text-base mb-1" style={{ color: "var(--text)" }}>{t("Digital Catalog")}</h3>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {t("Coming soon: share your products in a digital catalog so customers can see what's available — no more printed lists or outdated price tags.")}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {modal && <ProductModal product={modal.product} categories={categories} onClose={() => setModal(null)} />}
    </div>
  );
}