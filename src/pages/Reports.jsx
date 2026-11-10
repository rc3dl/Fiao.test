import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { TrendingUp, Banknote, Users, AlertTriangle, FileText, FileSpreadsheet, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchLedger } from "@/api/creditApi";
import { money, todayPanama, shortYmd } from "@/lib/credit";
import { PRESETS, presetRange, buildReport, filterLabel, paginate, pageWindow, reportTables } from "@/lib/reports";
import { exportExcel, exportPdf } from "@/lib/reportExport";
import { useLanguage } from "@/contexts/LanguageContext";
import { IS_NATIVE } from "@/native/useIsNative";

const card = { backgroundColor: "var(--surface)" };
const fieldStyle = { backgroundColor: "var(--white)", borderColor: "var(--border-cream)", color: "var(--text)" };
const BREAKDOWN_COLORS = { Paid: "#059669", Pending: "#F9D103", Overdue: "#B91C1C" };

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

// Texto del cambio porcentual con color: "good" cuando subir es bueno (cobros) y "bad" cuando subir es malo (deuda).
function Change({ change, suffix, upIsGood }) {
    const { t } = useLanguage();
  const { pct, label } = change;
  let color = "var(--text-muted)";
  if (pct === null) color = upIsGood ? "var(--ok-text)" : "var(--bad-text)";
  else if (pct > 0) color = upIsGood ? "var(--ok-text)" : "var(--bad-text)";
  else if (pct < 0) color = upIsGood ? "var(--bad-text)" : "var(--ok-text)";
  return (
    <p className="text-xs font-semibold mt-1" style={{ color }}>
      {t(label)}
      {label === "No change" ? "" : ` ${suffix}`}
    </p>
  );
}

export default function Reports() {
    const { t, language } = useLanguage();
  const today = todayPanama();
  const initial = presetRange("month", today);
  const [draft, setDraft] = useState({ ...initial, filter: "all" });
  const [applied, setApplied] = useState({ ...initial, filter: "all" });
  const [page, setPage] = useState(1);
  const [formError, setFormError] = useState("");
  const [exporting, setExporting] = useState("");
  const [exportError, setExportError] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["reports"], queryFn: fetchLedger });
  const clients = data?.clients ?? [];

  const report = useMemo(
    () => (data ? buildReport({ clients: data.clients, entries: data.entries, names: data.names, ...applied, today, locale: language === "es" ? "es-PA" : "en-GB" }) : null),
    [data, applied, today, language]
  );
  const table = useMemo(() => paginate(report?.rows ?? [], page), [report, page]);

  const apply = () => {
    setFormError("");
    if (!draft.from || !draft.to) return setFormError("Choose both dates.");
    if (draft.from > draft.to) return setFormError("The start date must be before the end date.");
    setApplied({ ...draft });
    setPage(1);
  };
  const choosePreset = (key) => {
    const range = presetRange(key, today);
    setFormError("");
    setDraft({ ...draft, ...range });
    setApplied({ ...applied, ...range, filter: draft.filter });
    setPage(1);
  };
  const activePreset = PRESETS.find((p) => {
    const r = presetRange(p.key, today);
    return r.from === applied.from && r.to === applied.to;
  })?.key;

  const run = async (kind) => {
    setExportError("");
    setExporting(kind);
    try {
      const tables = reportTables(report, { filterLabel: t(filterLabel(clients, applied.filter)), language });
      const name = `fiao-report-${applied.from}-to-${applied.to}`;
      if (kind === "excel") exportExcel(tables, `${name}.xlsx`);
      else await exportPdf(tables, `${name}.pdf`);
    } catch (e) {
      setExportError(`Could not create the file: ${e.message}`);
    } finally {
      setExporting("");
    }
  };

  const c = report?.cards;
  const hasChartData = report?.chart.some((b) => b.issued || b.received || b.overdue);
  const canExport = !!report && !exporting;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--page-bg)" }}>
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-white font-bold text-3xl sm:text-4xl" style={{ fontFamily: "Poppins" }}>{t("FIA'O Reports")}</h1>
              <p className="text-white/80 mt-2 text-sm">
                {t("Track credit activity, payments and overdue balances for any period.")}
              </p>
            </div>
            <div data-tour="reports-export" className="flex flex-wrap gap-2">
              <button onClick={() => run("pdf")} disabled={!canExport}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: "var(--white)", color: "var(--text)" }}>
                <FileText className="w-4 h-4" /> {exporting === "pdf" ? t("Creating...") : t("Export PDF")}
              </button>
              <button onClick={() => run("excel")} disabled={!canExport}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: "#F9D103", color: "var(--on-yellow)" }}>
                <FileSpreadsheet className="w-4 h-4" /> {exporting === "excel" ? t("Creating...") : t("Export Excel")}
              </button>
            </div>
          </div>

          {exportError && (
            <p role="alert" className="text-sm rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: "var(--bad-bg)", color: "var(--bad-text)" }}>{t(exportError)}</p>
          )}

          {/* Filters */}
          <div data-tour="reports-filters" className="rounded-2xl p-5 mb-6" style={card}>
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESETS.map((p) => (
                <button key={p.key} onClick={() => choosePreset(p.key)} className="px-4 py-1.5 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: activePreset === p.key ? "#B91C1C" : "var(--white)", color: activePreset === p.key ? "#FFFFFF" : "var(--text)", border: "1px solid var(--border-cream)" }}>
                  {t(p.label)}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <label className="block">
                <span className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>{t("FROM")}</span>
                <input type="date" max={today} value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none" style={fieldStyle} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>{t("TO")}</span>
                <input type="date" max={today} value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none" style={fieldStyle} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>{t("CUSTOMERS")}</span>
                <select value={draft.filter} onChange={(e) => setDraft({ ...draft, filter: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none" style={fieldStyle}>
                  <option value="all">{t("All customers")}</option>
                  <optgroup label={t("By status")}>
                    <option value="status:On Time">{t("On Time")}</option>
                    <option value="status:Pending">{t("Pending")}</option>
                    <option value="status:Overdue">{t("Overdue")}</option>
                  </optgroup>
                  <optgroup label={t("One customer")}>
                    {clients.map((cl) => (
                      <option key={cl.id} value={`client:${cl.id}`}>{cl.name}</option>
                    ))}
                  </optgroup>
                </select>
              </label>
              <button onClick={apply} className="py-2.5 rounded-full text-sm font-bold text-white" style={{ backgroundColor: "#B91C1C" }}>{t("Apply Filters")}</button>
            </div>
            {formError && <p role="alert" className="text-sm mt-3" style={{ color: "var(--bad-text)" }}>{t(formError)}</p>}
          </div>

          {isLoading ? (
            <p className="text-center text-white/80 py-16">{t("Loading your reports...")}</p>
          ) : isError ? (
            <div className="text-center py-16">
              <p className="text-white mb-4">{t("Could not load the data:")} {t(error.message)}</p>
              <button onClick={() => refetch()} className="px-5 py-2 rounded-full text-sm font-bold" style={{ backgroundColor: "#F9D103", color: "var(--on-yellow)" }}>{t("Try again")}</button>
            </div>
          ) : (
            <>
              <p className="text-white/80 text-sm mb-4">
                {shortYmd(report.range.from, language === "es" ? "es-PA" : "en-GB")} – {shortYmd(report.range.to, language === "es" ? "es-PA" : "en-GB")} · {t(filterLabel(clients, applied.filter))}
              </p>

              {/* Stat cards */}
              <div data-tour="reports-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="p-4 rounded-2xl" style={card}>
                  <TrendingUp className="w-5 h-5 mb-2" style={{ color: "var(--accent-text)" }} />
                  <p className="text-[11px] font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>{t("TOTAL ACTIVE CREDIT")}</p>
                  <p className="font-bold text-xl" style={{ color: "var(--text)" }}>{money(c.activeCredit)}</p>
                  <Change change={c.activeCreditChange} suffix={t("since the start of the period")} upIsGood={false} />
                </div>
                <div className="p-4 rounded-2xl" style={card}>
                  <Banknote className="w-5 h-5 mb-2" style={{ color: "#059669" }} />
                  <p className="text-[11px] font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>{t("COLLECTED IN PERIOD")}</p>
                  <p className="font-bold text-xl" style={{ color: "var(--text)" }}>{money(c.collected)}</p>
                  <Change change={c.collectedChange} suffix={t("vs previous period")} upIsGood />
                </div>
                <div className="p-4 rounded-2xl" style={card}>
                  <AlertTriangle className="w-5 h-5 mb-2" style={{ color: "var(--accent-text)" }} />
                  <p className="text-[11px] font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>{t("PENDING BALANCES")}</p>
                  <p className="font-bold text-xl" style={{ color: "var(--text)" }}>{money(c.pending)}</p>
                  <p className="text-xs font-semibold mt-1" style={{ color: c.overdueCustomers > 0 ? "var(--bad-text)" : "var(--ok-text)" }}>
                    {c.overdueCustomers > 0
                      ? t(`${c.overdueCustomers} ${c.overdueCustomers === 1 ? "account" : "accounts"} overdue (${money(c.overdueAmount)})`)
                      : t("Nothing overdue")}
                  </p>
                </div>
                <div className="p-4 rounded-2xl" style={card}>
                  <Users className="w-5 h-5 mb-2" style={{ color: "var(--text)" }} />
                  <p className="text-[11px] font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>{t("TOTAL CUSTOMERS")}</p>
                  <p className="font-bold text-xl" style={{ color: "var(--text)" }}>{c.customers}</p>
                  <p className="text-xs font-semibold mt-1" style={{ color: "var(--text-muted)" }}>
                    {c.newCustomers > 0 ? t(`+${c.newCustomers} new in this period`) : t("No new customers")}
                  </p>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-5 mb-6">
                {/* Chart */}
                <div data-tour="reports-chart" className="lg:col-span-2 rounded-2xl p-5" style={card}>
                  <h2 className="font-bold text-lg mb-1" style={{ color: "var(--text)" }}>{t("Credit activity & payments")}</h2>
                  <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>{t("Credit issued, payments received and overdue balances in the period.")}</p>
                  {hasChartData ? (
                    <div style={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer>
                        <BarChart data={report.chart} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-cream)" />
                          <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                          <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} width={48} />
                          <Tooltip formatter={(v) => money(v)} contentStyle={{ backgroundColor: "var(--white)", border: "1px solid var(--border-cream)", borderRadius: 12, color: "var(--text)" }} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="issued" name={t("Credit issued")} fill="#B91C1C" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="received" name={t("Payments received")} fill="#F9D103" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="overdue" name={t("Overdue")} fill="#FCA5A5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="py-16 text-center text-sm" style={{ color: "var(--text-faint)" }}>{t("No activity in this period.")}</p>
                  )}
                </div>

                {/* Breakdown */}
                <div data-tour="reports-status" className="rounded-2xl p-5" style={card}>
                  <h2 className="font-bold text-lg mb-1" style={{ color: "var(--text)" }}>{t("Credit status")}</h2>
                  <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>{t("What happened to the credit issued in the period (")}{money(report.issued)}).</p>
                  {report.issued > 0 ? (
                    <div className="space-y-4">
                      {report.breakdown.map((b) => (
                        <div key={b.key}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="font-semibold" style={{ color: "var(--text)" }}>{t(b.key)}</span>
                            <span style={{ color: "var(--text-muted)" }}>{b.pct}% · {money(b.amount)}</span>
                          </div>
                          <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-cream)" }}>
                            <div className="h-full rounded-full" style={{ width: `${b.pct}%`, backgroundColor: BREAKDOWN_COLORS[b.key] }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-10 text-center text-sm" style={{ color: "var(--text-faint)" }}>{t("No credit issued in this period.")}</p>
                  )}
                </div>
              </div>

              {/* Transactions */}
              <div data-tour="reports-table" className="rounded-2xl p-5" style={card}>
                <h2 className="font-bold text-lg mb-4" style={{ color: "var(--text)" }}>{t("Transactions")}</h2>
                {table.total === 0 ? (
                  <p className="py-8 text-center text-sm" style={{ color: "var(--text-faint)" }}>{t("No transactions in this period.")}</p>
                ) : (
                  <>
                    {IS_NATIVE ? (
                      <ul className="space-y-2">
                        {table.items.map((item) => (
                          <li key={item.id} className="p-3 rounded-2xl flex items-center gap-3" style={{ backgroundColor: "var(--white)", border: "1px solid var(--border-cream)" }}>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{item.name}</p>
                              <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{t(item.description)}</p>
                              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>{shortYmd(item.date, language === "es" ? "es-PA" : "en-GB")}</p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1.5">
                              <span className="text-sm font-extrabold whitespace-nowrap" style={{ color: item.kind === "pago" ? "var(--ok-text)" : "var(--text)" }}>
                                {item.kind === "pago" ? "− " : ""}{money(item.amount)}
                              </span>
                              <StatusBadge status={item.status} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-faint)", borderBottom: "1px solid var(--border-cream)" }}>
                            <th className="pb-3 pr-3">{t("CUSTOMER")}</th>
                            <th className="pb-3 pr-3">{t("DESCRIPTION")}</th>
                            <th className="pb-3 pr-3">{t("AMOUNT")}</th>
                            <th className="pb-3 pr-3">{t("DATE")}</th>
                            <th className="pb-3">{t("STATUS")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {table.items.map((item) => (
                            <tr key={item.id} style={{ borderBottom: "1px solid var(--border-cream)" }}>
                              <td className="py-3 pr-3 text-sm font-semibold" style={{ color: "var(--text)" }}>{item.name}</td>
                              <td className="py-3 pr-3 text-sm" style={{ color: "var(--text-muted)" }}>{t(item.description)}</td>
                              <td className="py-3 pr-3 text-sm font-bold whitespace-nowrap" style={{ color: item.kind === "pago" ? "var(--ok-text)" : "var(--text)" }}>
                                {item.kind === "pago" ? "− " : ""}{money(item.amount)}
                              </td>
                              <td className="py-3 pr-3 text-sm whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{shortYmd(item.date, language === "es" ? "es-PA" : "en-GB")}</td>
                              <td className="py-3"><StatusBadge status={item.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {t("Showing")} {table.from}–{table.to} {t("of")} {table.total}
                      </p>
                      {table.pages > 1 && (
                        <div className="flex items-center gap-1.5">
                          <button aria-label={t("Previous page")} onClick={() => setPage(table.page - 1)} disabled={table.page === 1}
                            className="w-8 h-8 rounded-full flex items-center justify-center border disabled:opacity-40" style={fieldStyle}>
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          {pageWindow(table.page, table.pages).map((n) => (
                            <button key={n} onClick={() => setPage(n)} aria-current={n === table.page ? "page" : undefined}
                              className="w-8 h-8 rounded-full text-sm font-semibold"
                              style={{ backgroundColor: n === table.page ? "#B91C1C" : "var(--white)", color: n === table.page ? "#FFFFFF" : "var(--text)", border: "1px solid var(--border-cream)" }}>
                              {n}
                            </button>
                          ))}
                          <button aria-label={t("Next page")} onClick={() => setPage(table.page + 1)} disabled={table.page === table.pages}
                            className="w-8 h-8 rounded-full flex items-center justify-center border disabled:opacity-40" style={fieldStyle}>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}