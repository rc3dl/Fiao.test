import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ChevronDown, ShoppingCart, Banknote, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { fetchLedger, addFiado, addPayment, saveAutoBlock, LEDGER_KEYS } from "@/api/creditApi";
import {
  money,
  parseAmount,
  effectiveLimit,
  checkFiado,
  checkPayment,
  addDays,
  todayPanama,
  relativeDay,
  shortDate,
  shortYmd,
  annotateEntries,
  summarize,
  percentUsed,
} from "@/lib/credit";
import { useLanguage } from "@/contexts/LanguageContext";
import { confirmAction } from "@/native/confirm";
import SyncBadge from "@/native/SyncBadge";

function StatusBadge({ status }) {
    const { t } = useLanguage();
  const map = {
    Paid: { bg: "var(--ok-bg)", color: "var(--ok-text)" },
    Pending: { bg: "var(--warn-bg)", color: "var(--warn-text)" },
    Overdue: { bg: "var(--bad-bg)", color: "var(--bad-text)" },
  };
  const s = map[status] || map.Pending;
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: s.bg, color: s.color }}>
      {t(status)}
    </span>
  );
}

// Mensaje de éxito o de error debajo de un formulario.
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
      {note.textKey ? t(note.textKey, note.vars) : t(note.text)}
    </p>
  );
}

const fieldStyle = { backgroundColor: "var(--white)", borderColor: "var(--border-cream)", color: "var(--text)" };

export default function Credit() {
    const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["credit"], queryFn: fetchLedger });

  const clients = data?.clients ?? [];
  const entries = data?.entries ?? [];
  const names = data?.names ?? {};
  const settings = data?.settings ?? { default_credit_limit: 100, default_due_days: 15, auto_block: true };

  const [selectedId, setSelectedId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentType, setPaymentType] = useState("partial");
  const [payNote, setPayNote] = useState(null);
  const [fiadoAmount, setFiadoAmount] = useState("");
  const [fiadoDesc, setFiadoDesc] = useState("");
  const [fiadoDue, setFiadoDue] = useState("");
  const [fiadoNote, setFiadoNote] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const client = clients.find((c) => c.id === selectedId) || clients[0];
  const today = todayPanama();

  const limit = client ? effectiveLimit(client, settings) : 0;
  const used = client ? percentUsed(client.balance, limit) : 0;
  const defaultDue = addDays(today, settings.default_due_days);

  const history = useMemo(
    () => (client ? annotateEntries(entries.filter((e) => e.client_id === client.id)) : []),
    [entries, client]
  );
  const visibleHistory = showAll ? history : history.slice(0, 8);
  const overview = useMemo(() => summarize(clients, entries), [clients, entries]);

  const refresh = () => LEDGER_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));

  const fiadoMut = useMutation({
    mutationFn: addFiado,
    onSuccess: () => {
      refresh();
      setFiadoAmount("");
      setFiadoDesc("");
      setFiadoDue("");
      setFiadoNote({ type: "ok", text: "Credit registered." });
    },
    onError: (e) => setFiadoNote({ type: "error", text: e.message }),
  });
  const payMut = useMutation({
    mutationFn: addPayment,
    onSuccess: () => {
      refresh();
      setPaymentAmount("");
      setPayNote({ type: "ok", text: "Payment registered." });
    },
    onError: (e) => setPayNote({ type: "error", text: e.message }),
  });
  const blockMut = useMutation({ mutationFn: saveAutoBlock, onSuccess: refresh });

  const changeClient = (id) => {
    setSelectedId(id);
    setPayNote(null);
    setFiadoNote(null);
    setShowAll(false);
  };

  const submitFiado = (e) => {
    e.preventDefault();
    setFiadoNote(null);
    const amount = parseAmount(fiadoAmount);
    const problem = checkFiado({ amount, balance: client.balance, limit, autoBlock: settings.auto_block });
    if (problem) return setFiadoNote({ type: "error", text: problem });
    if (fiadoDue && fiadoDue < today) return setFiadoNote({ type: "error", text: "The due date can't be in the past." });
    fiadoMut.mutate({ client_id: client.id, amount, description: fiadoDesc, due_date: fiadoDue });
  };

  const payAmount = paymentType === "full" ? client?.balance ?? 0 : parseAmount(paymentAmount);

  const submitPayment = () => {
    setPayNote(null);
    const problem = checkPayment({ amount: payAmount, balance: client.balance });
    if (problem) return setPayNote({ type: "error", text: problem });
    payMut.mutate({
      client_id: client.id,
      amount: payAmount,
      description: paymentType === "full" ? "Payment in full" : "Partial payment",
    });
  };

  const markAsPaid = () => {
    setPayNote(null);
    if (!(client.balance > 0)) return setPayNote({ type: "error", text: "This customer has no debt." });
    const paidClient = client;
    confirmAction(t(`Mark ${paidClient.name} as paid? This registers a payment of ${money(paidClient.balance)}.`), { destructive: false }).then((ok) => {
      if (ok) payMut.mutate({ client_id: paidClient.id, amount: paidClient.balance, description: "Marked as paid" });
    });
  };

  const card = { backgroundColor: "var(--surface)" };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--page-bg)" }}>
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-white font-bold text-3xl sm:text-4xl" style={{ fontFamily: "Poppins" }}>
              {t("Debts & Payments")}
            </h1>
            <p className="text-white/80 mt-2">{t("Track all purchases and payments for every customer.")}</p>
          </div>

          {isLoading ? (
            <p className="text-center text-white/80 py-16">{t("Loading your notebook...")}</p>
          ) : isError ? (
            <div className="text-center py-16">
              <p className="text-white mb-4">{t("Could not load the data:")} {t(error.message)}</p>
              <button onClick={() => refetch()} className="px-5 py-2 rounded-full text-sm font-bold" style={{ backgroundColor: "#F9D103", color: "var(--on-yellow)" }}>
                {t("Try again")}
              </button>
            </div>
          ) : !client ? (
            <div data-tour="credit-empty" className="max-w-md mx-auto rounded-2xl p-8 text-center" style={card}>
              <h2 className="font-bold text-lg mb-2" style={{ color: "var(--text)" }}>{t("No customers yet")}</h2>
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                {t("Add your first customer to start registering credits and payments.")}
              </p>
              <Link to="/clients" className="inline-block px-5 py-2.5 rounded-full text-sm font-bold" style={{ backgroundColor: "#F9D103", color: "var(--on-yellow)" }}>
                {t("Go to Clients")}
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,1fr)] gap-5">
              {/* Column 1 - Customer */}
              <div className="space-y-5">
                <div data-tour="credit-customer" className="rounded-2xl p-5" style={card}>
                  <label htmlFor="customer" className="text-xs font-semibold tracking-wide block mb-2" style={{ color: "var(--text-muted)" }}>{t("SELECT A CUSTOMER")}</label>
                  <div className="relative">
                    <select
                      id="customer"
                      value={client.id}
                      onChange={(e) => changeClient(e.target.value)}
                      className="w-full appearance-none rounded-xl px-4 py-3 pr-10 text-sm font-semibold border outline-none"
                      style={fieldStyle}
                    >
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                  </div>
                </div>

                <div data-tour="credit-card" className="rounded-2xl p-5" style={card}>
                  <h2 className="font-bold text-xl mb-4" style={{ color: "var(--text)" }}>{client.name}</h2>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-xl p-3" style={{ backgroundColor: "var(--white)", border: "1px solid var(--border-cream)" }}>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("Current Debt")}</p>
                      <p className="font-bold text-lg" style={{ color: client.balance > 0 ? "var(--accent-text)" : "var(--text)" }}>{money(client.balance)}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ backgroundColor: "var(--white)", border: "1px solid var(--border-cream)" }}>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("Credit Limit")}</p>
                      <p className="font-bold text-lg" style={{ color: "var(--text)" }}>{money(limit)}</p>
                    </div>
                  </div>
                  <div className="mb-1.5 flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>{used}{t("% used")}</span>
                    <span>{t("Limit:")} {money(limit)}</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-cream)" }}>
                    <div className="h-full rounded-full" style={{ width: `${used}%`, backgroundColor: "#B91C1C" }} />
                  </div>
                  {client.overdue > 0 && (
                    <p className="text-xs font-semibold mt-3" style={{ color: "var(--bad-text)" }}>
                      {money(client.overdue)} {t("is overdue.")}
                    </p>
                  )}
                </div>

                <div data-tour="credit-block" className="rounded-2xl p-5" style={card}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>{t("Automatic Blocking")}</h3>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {t("If a customer exceeds the debt limit, system prevents new credits.")}
                      </p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={settings.auto_block}
                      aria-label={t("Automatic blocking")}
                      disabled={blockMut.isPending}
                      onClick={() => blockMut.mutate(!settings.auto_block)}
                      className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors disabled:opacity-60"
                      style={{ backgroundColor: settings.auto_block ? "#B91C1C" : "var(--border-cream)" }}
                    >
                      <span className="absolute top-0.5 w-5 h-5 left-0.5 rounded-full bg-white transition-transform" style={{ transform: settings.auto_block ? "translateX(20px)" : "translateX(0px)" }} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Column 2 - Debt & Payment */}
              <div className="space-y-5">
                <div data-tour="credit-history" className="rounded-2xl p-5" style={card}>
                  <h2 className="font-bold text-lg mb-1" style={{ color: "var(--text)" }}>{t("Debt History")}</h2>
                  <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>{t("Track all purchases and payments.")}</p>
                  {history.length === 0 ? (
                    <p className="text-sm py-4 text-center" style={{ color: "var(--text-faint)" }}>{t("No movements yet for")} {client.name}.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {visibleHistory.map((row) => {
                        const isPayment = row.kind === "pago";
                        const Icon = isPayment ? Banknote : ShoppingCart;
                        return (
                          <div key={row.id} className="flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-2 p-3 rounded-xl" style={{ backgroundColor: "var(--white)", border: "1px solid var(--border-cream)" }}>
                            <span className="text-xs font-semibold w-14" style={{ color: "var(--text-muted)" }}>{shortDate(row.created_at, language === "es" ? "es-PA" : "en-GB")}</span>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: isPayment ? "var(--ok-bg)" : "var(--warn-bg)" }}>
                              <Icon className="w-4 h-4" style={{ color: isPayment ? "var(--ok-text)" : "var(--warn-text)" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                                {row.description || (isPayment ? t("Payment") : t("Credit sale"))}
                              </p>
                              {!isPayment && row.due_date && row.status !== "Paid" && (
                                <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>{t("Due")} {shortYmd(row.due_date, language === "es" ? "es-PA" : "en-GB")}</p>
                              )}
                            </div>
                            <span className="text-sm font-bold" style={{ color: isPayment ? "var(--ok-text)" : "var(--text)" }}>
                              {isPayment ? "− " : ""}{money(row.amount)}
                            </span>
                            <SyncBadge status={row._sync} />
                            <StatusBadge status={row.status} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {history.length > 8 && (
                    <button onClick={() => setShowAll(!showAll)} className="mt-3 text-sm font-semibold" style={{ color: "var(--accent-text)" }}>
                      {showAll ? t("Show less") : t(`View Full History (${history.length})`)}
                    </button>
                  )}
                </div>

                {/* New credit */}
                <form data-tour="credit-new" onSubmit={submitFiado} className="rounded-2xl p-5" style={card}>
                  <h2 className="font-bold text-lg mb-4" style={{ color: "var(--text)" }}>{t("New Credit (Fiado)")}</h2>
                  <label htmlFor="fiado-amount" className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>{t("Amount (B/.)")}</label>
                  <input id="fiado-amount" value={fiadoAmount} onChange={(e) => setFiadoAmount(e.target.value)} inputMode="decimal" placeholder="0.00"
                    className="w-full rounded-xl px-4 py-3 text-sm font-semibold border outline-none mb-3" style={fieldStyle} />
                  <label htmlFor="fiado-desc" className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>{t("What did they take? (optional)")}</label>
                  <input id="fiado-desc" value={fiadoDesc} onChange={(e) => setFiadoDesc(e.target.value)} placeholder={t("Rice 5 lb, milk 2")}
                    className="w-full rounded-xl px-4 py-3 text-sm border outline-none mb-3" style={fieldStyle} />
                  <label htmlFor="fiado-due" className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>
                    {t("Due date (empty =")} {settings.default_due_days} {t("days,")} {shortYmd(defaultDue, language === "es" ? "es-PA" : "en-GB")})
                  </label>
                  <input id="fiado-due" type="date" min={today} value={fiadoDue} onChange={(e) => setFiadoDue(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm border outline-none mb-4" style={fieldStyle} />
                  <button type="submit" disabled={fiadoMut.isPending} className="w-full py-3 rounded-full font-bold text-sm text-white disabled:opacity-60" style={{ backgroundColor: "#B91C1C" }}>
                    {fiadoMut.isPending ? t("Saving...") : t("Register Credit")}
                  </button>
                  <Note note={fiadoNote} />
                </form>

                {/* Register payment */}
                <div data-tour="credit-payment" className="rounded-2xl p-5" style={card}>
                  <h2 className="font-bold text-lg mb-4" style={{ color: "var(--text)" }}>{t("Register Payment")}</h2>
                  <label htmlFor="pay-amount" className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>{t("Payment Amount (B/.)")}</label>
                  <input
                    id="pay-amount"
                    value={paymentType === "full" ? client.balance.toFixed(2) : paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    readOnly={paymentType === "full"}
                    inputMode="decimal"
                    placeholder="0.00"
                    className="w-full rounded-xl px-4 py-3 text-sm font-semibold border outline-none mb-4"
                    style={fieldStyle}
                  />
                  <p className="text-xs font-semibold block mb-2" style={{ color: "var(--text-muted)" }}>{t("Payment Type")}</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { key: "partial", label: "Partial Payment" },
                      { key: "full", label: "Full Payment" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setPaymentType(opt.key)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition"
                        style={{
                          backgroundColor: paymentType === opt.key ? "var(--warn-bg)" : "var(--white)",
                          borderColor: paymentType === opt.key ? "#F9D103" : "var(--border-cream)",
                          color: "var(--text)",
                        }}
                      >
                        <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: paymentType === opt.key ? "#B91C1C" : "var(--border-cream)" }}>
                          {paymentType === opt.key && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#B91C1C" }} />}
                        </span>
                        {t(opt.label)}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={submitPayment} disabled={payMut.isPending || !(client.balance > 0)}
                      className="flex-1 py-3 rounded-full font-bold text-sm disabled:opacity-50" style={{ backgroundColor: "#F9D103", color: "var(--on-yellow)" }}>
                      {payMut.isPending ? t("Saving...") : t("Register Payment")}
                    </button>
                    <button onClick={markAsPaid} disabled={payMut.isPending || !(client.balance > 0)}
                      className="flex-1 py-3 rounded-full font-bold text-sm border disabled:opacity-50"
                      style={{ backgroundColor: "var(--white)", color: "var(--text)", borderColor: "var(--border-cream)" }}>
                      {t("Mark as Paid")}
                    </button>
                  </div>
                  {!(client.balance > 0) && (
                    <p className="text-xs mt-3" style={{ color: "var(--text-faint)" }}>{client.name} {t("has no debt right now.")}</p>
                  )}
                  <Note note={payNote} />
                </div>
              </div>

              {/* Column 3 - Activity & Overview */}
              <div data-tour="credit-side" className="space-y-5">
                <div className="rounded-2xl p-5" style={card}>
                  <h2 className="font-bold text-lg mb-4" style={{ color: "var(--text)" }}>{t("Recent Activity")}</h2>
                  {entries.length === 0 ? (
                    <p className="text-sm" style={{ color: "var(--text-faint)" }}>{t("No activity yet.")}</p>
                  ) : (
                    <div className="space-y-2">
                      {entries.slice(0, 6).map((a) => (
                        <div key={a.id} className="p-3 rounded-xl" style={{ backgroundColor: "var(--white)", border: "1px solid var(--border-cream)" }}>
                          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                            {names[a.client_id] || t("Client")}, {a.kind === "pago" ? t("Paid") : t("New debt")} {money(a.amount)}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{t(relativeDay(a.created_at, today, language === "es" ? "es-PA" : "en-GB"))}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl p-5" style={card}>
                  <h2 className="font-bold text-lg mb-4" style={{ color: "var(--text)" }}>{t("Debt Overview")}</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Outstanding Debt", value: money(overview.outstanding), icon: TrendingUp, color: "var(--accent-text)" },
                      { label: "Payments Today", value: money(overview.paymentsToday), icon: Banknote, color: "#059669" },
                      { label: "Customers with Debt", value: overview.customersWithDebt, icon: Users, color: "var(--text)" },
                      { label: "Overdue", value: overview.overdueCustomers, icon: AlertTriangle, color: "var(--accent-text)" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl p-3" style={{ backgroundColor: "var(--white)", border: "1px solid var(--border-cream)" }}>
                        <s.icon className="w-4 h-4 mb-1.5" style={{ color: s.color }} />
                        <p className="font-bold text-base" style={{ color: "var(--text)" }}>{s.value}</p>
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t(s.label)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="text-center text-white/70 text-sm mt-10">{t("© 2026. Manage today for a better tomorrow.")}</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}