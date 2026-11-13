import React from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Banknote, AlertTriangle, ArrowRight, ShoppingCart, Users } from "lucide-react";
import { money, initials, relativeDay } from "@/lib/credit";
import { useLanguage } from "@/contexts/LanguageContext";

const card = { backgroundColor: "var(--surface)" };
const inner = { backgroundColor: "var(--white)", border: "1px solid var(--border-cream)" };

// Dashboard pensado para el teléfono (solo Android). Usa exactamente los mismos datos que la versión web.
export default function MobileDashboard({ name, isLoading, isError, error, refetch, overview, debtors, entries, names, lowStock, clients, today }) {
  const { t, language } = useLanguage();
  const locale = language === "es" ? "es-PA" : "en-GB";
  const waiting = isLoading || isError;

  return (
    <div className="px-4 pt-3 pb-4">
      <h1 className="text-white font-extrabold fiao-rise" style={{ fontFamily: "Poppins" }}>
        {name ? t(`Welcome back, ${name} 👋`) : t("Welcome back 👋")}
      </h1>

      {isError && (
        <div role="alert" className="mt-4 rounded-3xl px-4 py-3 flex items-center justify-between gap-3" style={{ backgroundColor: "var(--bad-bg)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--bad-text)" }}>{t("Could not load your numbers:")} {t(error.message)}</p>
          <button onClick={() => refetch()} className="px-4 rounded-full text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: "#B91C1C" }}>
            {t("Try again")}
          </button>
        </div>
      )}

      {/* Resumen: la deuda pendiente manda */}
      <div data-tour="dash-stats" className="mt-4">
        <section className="fiao-hero fiao-stitch" style={card}>
          <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] uppercase" style={{ color: "var(--text-muted)" }}>
            <TrendingUp className="w-3.5 h-3.5" style={{ color: "var(--accent-text)" }} />
            {t("Outstanding Debt")}
          </p>
          <p className={`mt-2 font-extrabold leading-none ${isLoading ? "fiao-skeleton" : ""}`} style={{ fontSize: "clamp(1.7rem, 8.6vw, 2.4rem)", color: "var(--text)", fontFamily: "Poppins" }}>
            <span className="fiao-marker">{waiting ? "—" : money(overview.outstanding)}</span>
          </p>
          {!waiting && overview.overdueCustomers > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: "var(--bad-bg)", color: "var(--bad-text)" }}>
              <AlertTriangle className="w-3.5 h-3.5" /> {t(`${overview.overdueCustomers} overdue`)}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="rounded-2xl p-3" style={inner}>
              <Banknote className="w-4 h-4 mb-1.5" style={{ color: "#059669" }} />
              <p className="font-bold text-lg leading-tight" style={{ color: "var(--text)" }}>{waiting ? "—" : money(overview.paymentsToday)}</p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t("Payments Today")}</p>
            </div>
            <div className="rounded-2xl p-3" style={inner}>
              <Users className="w-4 h-4 mb-1.5" style={{ color: "var(--accent-text)" }} />
              <p className="font-bold text-lg leading-tight" style={{ color: "var(--text)" }}>{waiting ? "—" : overview.customersWithDebt}</p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t("Customers with Debt")}</p>
            </div>
          </div>
        </section>
      </div>

      {lowStock.length > 0 && (
        <Link to="/products" className="mt-4 rounded-3xl px-4 py-3 flex items-center justify-between gap-3" style={{ backgroundColor: "var(--warn-bg)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--warn-text)" }}>
            {lowStock.length} {lowStock.length === 1 ? t("product is") : t("products are")} {t("running low:")}{" "}
            {lowStock.slice(0, 2).map((p) => p.name).join(", ")}
            {lowStock.length > 2 ? ` ${t(`and ${lowStock.length - 2} more`)}` : ""}
          </p>
          <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--warn-text)" }} />
        </Link>
      )}

      {!waiting && (
        <>
          {/* A quién cobrar: carrusel con tarjetas */}
          <div data-tour="dash-collect" className="mt-7">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-white font-bold text-lg" style={{ fontFamily: "Poppins" }}>{t("Who to collect")}</h2>
              <Link to="/clients" className="text-sm font-semibold flex items-center gap-1 text-white/90">
                {t("All clients")} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {debtors.length === 0 ? (
              <p className="rounded-3xl p-4 text-sm" style={{ ...card, color: "var(--text-faint)" }}>
                {clients.length === 0 ? t("Add your first customer to get started.") : t("Nobody owes you right now. 🎉")}
              </p>
            ) : (
              <div className="fiao-snap -mx-4 px-4">
                {debtors.slice(0, 6).map((d) => (
                  <Link key={d.id} to="/clients" className="fiao-debtor" style={card}>
                    <div className="flex items-center gap-3">
                      <span className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: "#B91C1C" }}>
                        {initials(d.name)}
                      </span>
                      <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{d.name}</p>
                    </div>
                    <p className="mt-3 text-2xl font-extrabold" style={{ color: "var(--accent-text)", fontFamily: "Poppins" }}>{money(d.balance)}</p>
                    <p className="text-xs mt-0.5" style={{ color: d.overdue > 0 ? "var(--bad-text)" : "var(--text-faint)" }}>
                      {d.overdue > 0 ? t(`Overdue ${money(d.overdue)}`) : d.daysPending > 0 ? t(`Pending for ${d.daysPending} ${d.daysPending === 1 ? "day" : "days"}`) : t("Pending since today")}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Actividad reciente */}
          <div data-tour="dash-activity" className="mt-7 rounded-3xl p-4" style={card}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg" style={{ color: "var(--text)", fontFamily: "Poppins" }}>{t("Recent activity")}</h2>
              <Link to="/credit" className="text-sm font-semibold flex items-center gap-1" style={{ color: "var(--accent-text)" }}>
                {t("Debts & payments")} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {entries.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>{t("No activity yet.")}</p>
            ) : (
              <ul className="space-y-2">
                {entries.slice(0, 5).map((a) => {
                  const paid = a.kind === "pago";
                  const Icon = paid ? Banknote : ShoppingCart;
                  return (
                    <li key={a.id} className="flex items-center gap-3 p-3 rounded-2xl" style={inner}>
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: paid ? "var(--ok-bg)" : "var(--warn-bg)" }}>
                        <Icon className="w-4 h-4" style={{ color: paid ? "var(--ok-text)" : "var(--warn-text)" }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{names[a.client_id] || t("Client")}</p>
                        <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                          {paid ? t("Paid") : t("New debt")} · {t(relativeDay(a.created_at, today, locale))}
                        </p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: paid ? "var(--ok-text)" : "var(--text)" }}>
                        {paid ? "− " : ""}{money(a.amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
