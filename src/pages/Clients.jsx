import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, Send, Plus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchClients, addClient, editClient, archiveClient, logReminder } from "@/api/clientsApi";
import { money, initials, validatePhone, waLink, reminderText } from "@/lib/credit";
import { useLanguage } from "@/contexts/LanguageContext";
import { IS_NATIVE } from "@/native/useIsNative";
import { confirmAction } from "@/native/confirm";

const FILTERS = ["All", "On Time", "Pending", "Overdue"];

function StatusBadge({ status }) {
    const { t } = useLanguage();
  const map = {
    "On Time": { bg: "var(--ok-bg)", color: "var(--ok-text)" },
    Pending: { bg: "var(--warn-bg)", color: "var(--warn-text)" },
    Overdue: { bg: "var(--bad-bg)", color: "var(--bad-text)" },
  };
  const s = map[status];
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: s.bg, color: s.color }}>
      {t(status)}
    </span>
  );
}

// Android: cada cliente como una tarjeta táctil (en lugar de una fila de tabla).
function ClientCard({ c, onOpen }) {
  const { t } = useLanguage();
  return (
    <button type="button" onClick={onOpen} className="fiao-client w-full text-left">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: "#B91C1C" }}>
          {initials(c.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold truncate" style={{ color: "var(--text)" }}>{c.name}</p>
          <p className="text-xs truncate" style={{ color: "var(--text-faint)" }}>{c.phone || t("No phone")}</p>
        </div>
        <StatusBadge status={c.status} />
      </div>
      <div className="flex items-end justify-between mt-3 pt-3" style={{ borderTop: "1px dashed var(--border-cream)" }}>
        <div>
          <p className="text-[10px] font-bold tracking-wider" style={{ color: "var(--text-faint)" }}>{t("PENDING DEBT")}</p>
          <p className="text-xl font-extrabold leading-tight" style={{ color: c.balance > 0 ? "var(--accent-text)" : "var(--text-faint)", fontFamily: "Poppins" }}>
            {c.balance > 0 ? money(c.balance) : "—"}
          </p>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {c.purchases} {t(c.purchases === 1 ? "purchase" : "purchases")} <span style={{ color: "var(--accent-text)" }}>→</span>
        </p>
      </div>
    </button>
  );
}

// Ventana para crear un cliente nuevo o ver/editar uno existente.
function ClientModal({ client, onClose }) {
    const { t } = useLanguage();
  const queryClient = useQueryClient();
  const isNew = !client;
  const [name, setName] = useState(client?.name || "");
  const [phone, setPhone] = useState(client?.phone || "");
  const [limit, setLimit] = useState(client?.credit_limit ?? "");
  const [error, setError] = useState("");

  // Cerrar con la tecla Esc
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const done = () => {
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    onClose();
  };
  const save = useMutation({
    mutationFn: (values) => (isNew ? addClient(values) : editClient(client.id, values)),
    onSuccess: done,
    onError: (e) => setError(e.message),
  });
  const archive = useMutation({
    mutationFn: () => archiveClient(client.id),
    onSuccess: done,
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Name is required.");
    const phoneError = validatePhone(phone);
    if (phoneError) return setError(phoneError);
    if (limit !== "" && (Number.isNaN(Number(limit)) || Number(limit) < 0)) {
      return setError("Credit limit must be a number of 0 or more.");
    }
    save.mutate({ name, phone, credit_limit: limit });
  };

 
  const handleArchive = () => {
    setError("");

    if (client.balance > 0) {
      return setError(`${client.name} still owes ${money(client.balance)}. Register the payment first, then archive.`);
    }

    confirmAction(t(`Archive ${client.name}? They will disappear from the list, but their history is kept.`)).then((ok) => {
      if (ok) archive.mutate();
    });
  };

  const busy = save.isPending || archive.isPending;
  const inputStyle = { backgroundColor: "var(--surface)", borderColor: "var(--border-cream)", color: "var(--text)" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? t("New client") : t("Client detail")}
        className="w-full max-w-md rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "var(--white)", boxShadow: "0 20px 50px rgba(0,0,0,0.35)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-bold text-xl" style={{ color: "var(--text)", fontFamily: "Poppins" }}>
            {isNew ? t("New client") : client.name}
          </h2>
          <button onClick={onClose} aria-label={t("Close")} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isNew && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { label: "Debt", value: client.balance > 0 ? money(client.balance) : "—" },
              { label: "Overdue", value: client.overdue > 0 ? money(client.overdue) : "—" },
              { label: "Purchases", value: client.purchases },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-cream)" }}>
                <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{s.value}</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t(s.label)}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>{t("NAME *")}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ramón Batista" autoCapitalize="words" autoComplete="off"
              className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none" style={inputStyle} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>{t("PHONE (for WhatsApp reminders)")}</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="6123-4567" inputMode="tel"
              className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none" style={inputStyle} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>{t("CREDIT LIMIT (B/.) — empty = use your default")}</span>
            <input value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="100" inputMode="decimal"
              className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none" style={inputStyle} />
          </label>

          {error && (
            <p role="alert" className="text-sm rounded-xl px-3 py-2" style={{ backgroundColor: "var(--bad-bg)", color: "var(--bad-text)" }}>
              {t(error)}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={busy} className="flex-1 py-3 rounded-full font-bold text-sm text-white disabled:opacity-60"
              style={{ backgroundColor: "#B91C1C" }}>
              {save.isPending ? t("Saving...") : isNew ? t("Add client") : t("Save changes")}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-3 rounded-full font-bold text-sm border"
              style={{ backgroundColor: "var(--white)", color: "var(--text)", borderColor: "var(--border-cream)" }}>
              {t("Cancel")}
            </button>
          </div>

          {!isNew && (
            <button type="button" onClick={handleArchive} disabled={busy} className="w-full text-sm font-semibold pt-1 disabled:opacity-60"
              style={{ color: "var(--bad-text)" }}>
              {archive.isPending ? t("Archiving...") : t("Archive this client")}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default function Clients() {
    const { t } = useLanguage();
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null); // null | { client } (client = null para "nuevo")
  const [reminderId, setReminderId] = useState(null);

  const { data: clients = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    return clients.filter((c) => {
      const matchFilter = filter === "All" || c.status === filter;
      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (qDigits && (c.phone || "").replace(/\D/g, "").includes(qDigits));
      return matchFilter && matchQuery;
    });
  }, [clients, filter, query]);

  // Quiénes deben, primero los vencidos y luego los de mayor deuda.
  const debtors = useMemo(
    () =>
      clients
        .filter((c) => c.balance > 0)
        .sort((a, b) => (b.overdue > 0) - (a.overdue > 0) || b.balance - a.balance),
    [clients]
  );
  const target = debtors.find((c) => c.id === reminderId) || debtors[0];
  const message = target ? reminderText({ name: target.name, balance: target.balance, store: user?.store_name, language }) : "";
  const link = target ? waLink(target.phone, message) : "";

  const reminder = useMutation({
    mutationFn: logReminder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const sendReminder = () => {
    if (!target || !link) return;
    window.open(link, "_blank", "noopener"); // se abre primero para que el navegador no lo bloquee
    reminder.mutate({ client_id: target.id, message });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--page-bg)" }}>
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="font-bold text-3xl sm:text-4xl mb-2" style={{ color: "white", fontFamily: "Poppins" }}>
                {t("Client Management")}
              </h1>
              <h2 className="font-semibold text-lg mb-2 text-white/90">
  {t("Each client, with a clear account")}
</h2>
              <p className="text-sm max-w-lg text-white/80">
  {t("Register your customers in seconds and see at a glance who is up to date, who owes, and who to remind.")}
</p>
            </div>
            <button data-tour="clients-new"
              onClick={() => setModal({ client: null })}
              className="self-start flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold"
              style={{ backgroundColor: "#F9D103", color: "var(--on-yellow)" }}
            >
              <Plus className="w-4 h-4" /> {t("New client")}
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div data-tour="clients-main" className="lg:col-span-2 rounded-3xl p-6" style={{ backgroundColor: "var(--white)", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
              {/* Search */}
              <div data-tour="clients-search" className="relative mb-4">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("Search client by name or phone...")}
                  className="w-full rounded-full pl-11 pr-4 py-2.5 text-sm border outline-none"
                  style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-cream)", color: "var(--text)" }}
                />
              </div>

              {/* Filters */}
              <div data-tour="clients-filters" className="flex flex-wrap gap-2 mb-5">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="px-4 py-1.5 rounded-full text-sm font-semibold transition"
                    style={{
                      backgroundColor: filter === f ? "#B91C1C" : "var(--surface)",
                      color: filter === f ? "#FFFFFF" : "var(--text)",
                    }}
                  >
                    {t(f)}
                  </button>
                ))}
              </div>

              {/* Estados: cargando / error / vacío / sin resultados / lista */}
              {isLoading ? (
                <p className="py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>{t("Loading clients...")}</p>
              ) : isError ? (
                <div className="py-10 text-center">
                  <p className="text-sm mb-3" style={{ color: "var(--bad-text)" }}>{t("Could not load clients:")} {error.message}</p>
                  <button onClick={() => refetch()} className="px-5 py-2 rounded-full text-sm font-bold text-white" style={{ backgroundColor: "#B91C1C" }}>
                    {t("Try again")}
                  </button>
                </div>
              ) : clients.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="font-bold mb-1" style={{ color: "var(--text)" }}>{t("No clients yet")}</p>
                  <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>{t("Add your first customer to start your digital notebook.")}</p>
                  <button onClick={() => setModal({ client: null })} className="px-5 py-2 rounded-full text-sm font-bold"
                    style={{ backgroundColor: "#F9D103", color: "var(--on-yellow)" }}>
                    {t("Add first client")}
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <p className="py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>{t("No clients match your search or filter.")}</p>
              ) : (
                IS_NATIVE ? (
                <div data-tour="clients-table" className="space-y-3">
                  {filtered.map((c) => (
                    <ClientCard key={c.id} c={c} onOpen={() => setModal({ client: c })} />
                  ))}
                </div>
                ) : (
                <div data-tour="clients-table" className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-faint)", borderBottom: "1px solid var(--border-cream)" }}>
                        <th className="pb-3 pr-2">{t("CLIENT")}</th>
                        <th className="pb-3 pr-2">{t("PURCHASES")}</th>
                        <th className="pb-3 pr-2">{t("PENDING DEBT")}</th>
                        <th className="pb-3 pr-2">{t("STATUS")}</th>
                        <th className="pb-3">{t("ACTIONS")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c) => (
                        <tr key={c.id} style={{ borderBottom: "1px solid var(--border-cream)" }}>
                          <td className="py-3 pr-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: "#B91C1C" }}>
                                {initials(c.name)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{c.name}</p>
                                <p className="text-xs" style={{ color: "var(--text-faint)" }}>{c.phone || t("No phone")}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-2 text-sm" style={{ color: "var(--text-muted)" }}>{c.purchases} {t(c.purchases === 1 ? "purchase" : "purchases")}</td>
                          <td className="py-3 pr-2 text-sm font-semibold" style={{ color: c.balance > 0 ? "var(--accent-text)" : "var(--text-faint)" }}>
                            {c.balance > 0 ? money(c.balance) : "—"}
                          </td>
                          <td className="py-3 pr-2"><StatusBadge status={c.status} /></td>
                          <td className="py-3">
                            <button onClick={() => setModal({ client: c })} className="text-sm font-semibold flex items-center gap-1" style={{ color: "var(--accent-text)" }}>
                              {t("View detail")} <span>→</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )
              )}

              {/* Recordatorio: solo aparece si alguien debe */}
              {target && (
                <div data-tour="clients-reminder" className="mt-6 p-5 rounded-2xl" style={{ backgroundColor: "var(--warn-bg)" }}>
                  <h3 className="font-bold text-sm mb-1" style={{ color: "var(--text)" }}>{t("Payment reminder ready")}</h3>
                  <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                    {t("WhatsApp to")} {target.name}: "{message}"
                  </p>
                  {link ? (
                    <button onClick={sendReminder} className="px-5 py-2 rounded-full text-sm font-bold text-white" style={{ backgroundColor: "var(--btn-solid)" }}>
                      <span className="flex items-center gap-2"><Send className="w-3.5 h-3.5" /> {t("Open in WhatsApp")}</span>
                    </button>
                  ) : (
                    <p className="text-xs font-semibold" style={{ color: "var(--warn-text)" }}>
                      {t("Add a phone number to")} {target.name} {t("to send reminders.")}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Side card - Friendly Collections */}
            <div data-tour="clients-collections" className="rounded-3xl p-6 h-fit" style={{ backgroundColor: "var(--white)", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
              <h3 className="font-bold text-lg mb-2" style={{ color: "var(--text)" }}>{t("Friendly Collections")}</h3>
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                {t("Keep track of pending payments and send friendly reminders — no awkward conversations.")}
              </p>
              {debtors.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-faint)" }}>{t("Nobody owes you right now. 🎉")}</p>
              ) : (
                <div className="space-y-2">
                  {debtors.slice(0, 5).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setReminderId(r.id)}
                      className="w-full text-left p-3 rounded-xl"
                      style={{
                        backgroundColor: "var(--surface)",
                        border: `1px solid ${target?.id === r.id ? "#F9D103" : "var(--border-cream)"}`,
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{r.name}</p>
                        <span className="text-sm font-bold" style={{ color: "var(--accent-text)" }}>{money(r.balance)}</span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                        {r.overdue > 0 ? t("Overdue · ") : ""}
                        {r.daysPending > 0 ? t(`Pending for ${r.daysPending} ${r.daysPending === 1 ? "day" : "days"}`) : t("Pending since today")}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {modal && <ClientModal client={modal.client} onClose={() => setModal(null)} />}
    </div>
  );
}