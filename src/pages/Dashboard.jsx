import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Wallet, Package, Users, BarChart3, Mail, TrendingUp, Banknote, AlertTriangle, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchDashboard } from "@/api/dashboardApi";
import { money, summarize, rankDebtors, relativeDay, todayPanama, firstName } from "@/lib/credit";
import { useLanguage } from "@/contexts/LanguageContext";
import { IS_NATIVE } from "@/native/useIsNative";
import MobileDashboard from "@/native/MobileDashboard";

const QUICK_LINKS = [
  { label: "Credit", path: "/credit", icon: Wallet, desc: "Manage customer debts and register payments." },
  { label: "Products", path: "/products", icon: Package, desc: "Keep your inventory exact and get restock alerts." },
  { label: "Clients", path: "/clients", icon: Users, desc: "Register customers and see who owes at a glance." },
  { label: "Reports", path: "/reports", icon: BarChart3, desc: "Track cash flow and business activity." },
  { label: "Contact", path: "/contact", icon: Mail, desc: "Get help and check the FAQs." },
];

const card = { backgroundColor: "var(--surface)" };
const inner = { backgroundColor: "var(--white)", border: "1px solid var(--border-cream)" };

export default function Dashboard() {
    const { t, language } = useLanguage();
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });

  const clients = data?.clients ?? [];
  const entries = data?.entries ?? [];
  const names = data?.names ?? {};
  const lowStock = data?.lowStock ?? [];
  const today = todayPanama();

  const overview = useMemo(() => summarize(clients, entries), [clients, entries]);
  const debtors = useMemo(() => rankDebtors(clients), [clients]);

  const name = user?.store_name || firstName(user?.full_name);
  const dash = (value) => (isLoading || isError ? "—" : value);

  const stats = [
    { label: "Outstanding Debt", value: dash(money(overview.outstanding)), icon: TrendingUp, color: "var(--accent-text)" },
    { label: "Payments Today", value: dash(money(overview.paymentsToday)), icon: Banknote, color: "#059669" },
    { label: "Customers with Debt", value: dash(overview.customersWithDebt), icon: Users, color: "var(--text)" },
    { label: "Overdue", value: dash(overview.overdueCustomers), icon: AlertTriangle, color: "var(--accent-text)" },
  ];

  // Pequeño dato en vivo bajo algunos accesos rápidos.
  const hints = isLoading || isError ? {} : {
    "/credit": overview.overdueCustomers > 0 ? t(`${overview.overdueCustomers} overdue`) : "",
    "/clients": t(`${clients.length} ${clients.length === 1 ? "customer" : "customers"}`),
    "/products": lowStock.length > 0 ? t(`${lowStock.length} running low`) : "",
  };

  // Android: presentación propia para el teléfono (mismos datos, otro diseño).
  if (IS_NATIVE) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--page-bg)" }}>
        <Navbar />
        <main className="flex-1">
          <MobileDashboard
            name={name} isLoading={isLoading} isError={isError} error={error} refetch={refetch}
            overview={overview} debtors={debtors} entries={entries} names={names}
            lowStock={lowStock} clients={clients} today={today}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--page-bg)" }}>
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-white font-bold text-3xl sm:text-4xl" style={{ fontFamily: "Poppins" }}>
              {name ? t(`Welcome back, ${name} 👋`) : t("Welcome back 👋")}
            </h1>
            <p className="text-white/80 mt-2">
              {t("Manage your fiado, manage your business. Here's your overview for today.")}
            </p>
          </div>

          {isError && (
            <div role="alert" className="mb-6 rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3" style={{ backgroundColor: "var(--bad-bg)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--bad-text)" }}>{t("Could not load your numbers:")} {t(error.message)}</p>
              <button onClick={() => refetch()} className="px-4 py-1.5 rounded-full text-sm font-bold text-white" style={{ backgroundColor: "#B91C1C" }}>
                {t("Try again")}
              </button>
            </div>
          )}

          {/* Low stock alert */}
          {lowStock.length > 0 && (
            <Link to="/products" className="mb-6 rounded-2xl px-5 py-4 flex items-center justify-between gap-3" style={{ backgroundColor: "var(--warn-bg)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--warn-text)" }}>
                {lowStock.length} {lowStock.length === 1 ? t("product is") : t("products are")} {t("running low:")}{" "}
                {lowStock.slice(0, 3).map((p) => p.name).join(", ")}
                {lowStock.length > 3 ? ` ${t(`and ${lowStock.length - 3} more`)}` : ""}
              </p>
              <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--warn-text)" }} />
            </Link>
          )}

          {/* Stats */}
          <div data-tour="dash-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {stats.map((s) => (
              <div key={s.label} className="p-4 rounded-2xl" style={card}>
                <s.icon className="w-5 h-5 mb-2" style={{ color: s.color }} />
                <p className="font-bold text-xl" style={{ color: "var(--text)" }}>{s.value}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t(s.label)}</p>
              </div>
            ))}
          </div>

          {/* To collect + Recent activity */}
          {!isLoading && !isError && (
            <div className="grid lg:grid-cols-2 gap-5 mb-8">
              <div data-tour="dash-collect" className="rounded-2xl p-5" style={card}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg" style={{ color: "var(--text)" }}>{t("Who to collect")}</h2>
                  <Link to="/clients" className="text-sm font-semibold flex items-center gap-1" style={{ color: "var(--accent-text)" }}>
                    {t("All clients")} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {debtors.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                    {clients.length === 0 ? t("Add your first customer to get started.") : t("Nobody owes you right now. 🎉")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {debtors.slice(0, 5).map((d) => (
                      <Link key={d.id} to="/clients" className="flex items-center justify-between gap-3 p-3 rounded-xl" style={inner}>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{d.name}</p>
                          <p className="text-xs" style={{ color: d.overdue > 0 ? "var(--bad-text)" : "var(--text-faint)" }}>
                            {d.overdue > 0 ? t(`Overdue ${money(d.overdue)}`) : d.daysPending > 0 ? t(`Pending for ${d.daysPending} ${d.daysPending === 1 ? "day" : "days"}`) : t("Pending since today")}
                          </p>
                        </div>
                        <span className="text-sm font-bold" style={{ color: "var(--accent-text)" }}>{money(d.balance)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div data-tour="dash-activity" className="rounded-2xl p-5" style={card}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg" style={{ color: "var(--text)" }}>{t("Recent activity")}</h2>
                  <Link to="/credit" className="text-sm font-semibold flex items-center gap-1" style={{ color: "var(--accent-text)" }}>
                    {t("Debts & payments")} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {entries.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--text-faint)" }}>{t("No activity yet.")}</p>
                ) : (
                  <div className="space-y-2">
                    {entries.slice(0, 5).map((a) => (
                      <div key={a.id} className="p-3 rounded-xl" style={inner}>
                        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                          {names[a.client_id] || t("Client")}, {a.kind === "pago" ? t("Paid") : t("New debt")} {money(a.amount)}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{t(relativeDay(a.created_at, today, language === "es" ? "es-PA" : "en-GB"))}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick access */}
          <h2 className="text-white font-bold text-xl mb-4" style={{ fontFamily: "Poppins" }}>
            {t("Quick access")}
          </h2>
          <div data-tour="dash-quick" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUICK_LINKS.map((q) => (
              <Link
                key={q.path}
                to={q.path}
                className="group p-5 rounded-2xl transition-transform hover:scale-[1.02]"
                style={card}
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#B91C1C" }}>
                    <q.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base" style={{ color: "var(--text)" }}>{t(q.label)}</h3>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: "var(--accent-text)" }} />
                    </div>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{t(q.desc)}</p>
                    {hints[q.path] && (
                      <p className="text-xs font-semibold mt-1.5" style={{ color: "var(--accent-text)" }}>{hints[q.path]}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}