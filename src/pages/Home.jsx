import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PhoneMockup from "@/components/PhoneMockup";
import { Link } from "react-router-dom";
import { ShieldCheck, BookOpen, Bell, BarChart3, Smartphone, Wallet, Users as UsersIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
    const { t, language } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--page-bg)" }}>
      <Navbar />

      {/* Hero */}
      <section className="relative isolate flex-1 overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -top-36 -left-28 h-96 w-96 rounded-full bg-yellow-300/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-14 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:py-20">
          {/* Message */}
          <div className="motion-safe:animate-[fiao-rise_650ms_ease-out_both] text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-white shadow-sm backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-[#F9D103]" />
              {language === "en" ? "MADE FOR SMALL BUSINESSES" : "HECHO PARA PEQUEÑOS COMERCIOS"}
            </div>

            <h1 className="mx-auto max-w-2xl text-balance text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:mx-0 lg:text-6xl" style={{ fontFamily: "Poppins" }}>
              {language === "en" ? (
                <>Your <span className="text-[#F9D103]">credit notebook</span>, finally in one place.</>
              ) : (
                <>Tu libreta de <span className="text-[#F9D103]">fiados</span>, por fin en un solo lugar.</>
              )}
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg lg:mx-0">
              {t("FIA'O digitizes customer, debt, and payment management for convenience stores and small businesses in Panama, replacing the traditional paper ledger with a modern digital management system.")}
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold shadow-lg shadow-black/10 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#B91C1C]"
                style={{ backgroundColor: "#F9D103", color: "var(--on-yellow)" }}
              >
                {language === "en" ? "Create your free account" : "Crea tu cuenta gratis"}
                <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/35 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {language === "en" ? "I already have an account" : "Ya tengo una cuenta"}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs font-medium text-white/80 lg:justify-start">
              <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4 text-[#F9D103]" />{language === "en" ? "Customer records" : "Registro de clientes"}</span>
              <span className="inline-flex items-center gap-2"><Wallet className="h-4 w-4 text-[#F9D103]" />{language === "en" ? "Credit and payments" : "Fiados y pagos"}</span>
              <span className="inline-flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#F9D103]" />{language === "en" ? "Clear reports" : "Informes claros"}</span>
            </div>
          </div>

          {/* Product preview */}
          <div className="relative flex justify-center py-4 lg:justify-end motion-safe:animate-[fiao-rise_800ms_ease-out_120ms_both]">
            <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-transparent shadow-[0_0_90px_rgba(249,209,3,0.14)] sm:h-[26rem] sm:w-[26rem]" />
            <div className="relative z-10">
              <PhoneMockup />
            </div>
            <div className="absolute left-0 top-14 z-20 hidden items-center gap-2 rounded-2xl border border-white/60 bg-white px-4 py-3 text-sm font-semibold text-[#2D2926] shadow-xl sm:flex lg:-left-5 motion-safe:animate-[fiao-rise_700ms_ease-out_350ms_both]">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF4B8] text-[#9A6B00]"><UsersIcon /></span>
              {language === "en" ? "Your customers, organized" : "Tus clientes, organizados"}
            </div>
            <div className="absolute bottom-16 right-0 z-20 hidden items-center gap-2 rounded-2xl border border-white/60 bg-white px-4 py-3 text-sm font-semibold text-[#2D2926] shadow-xl sm:flex lg:-right-4 motion-safe:animate-[fiao-rise_700ms_ease-out_500ms_both]">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FCE4E4] text-[#B91C1C]"><Bell className="h-4 w-4" /></span>
              {language === "en" ? "Payments under control" : "Pagos bajo control"}
            </div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="w-full" style={{ backgroundColor: "var(--white)" }}>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center font-bold text-3xl sm:text-4xl mb-3" style={{ color: "var(--text)", fontFamily: "Poppins" }}>
            {t("A safer, more organized alternative to the paper notebook")}
          </h2>
          <p className="text-center text-base max-w-2xl mx-auto mb-12" style={{ color: "var(--text-muted)" }}>
            {t("FIA'O doesn't change how you work — it digitalizes the familiar fiado process, making it more organized, secure, accessible, and easier to manage.")}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: BookOpen, title: "Customer & Debt Management", desc: "Register customers, new debts, amounts, dates, and outstanding balances in seconds." },
              { icon: Wallet, title: "Payment Management", desc: "Register full or partial payments that automatically update the remaining balance." },
              { icon: Bell, title: "Friendly Collections", desc: "Keep track of pending payments and send friendly reminders to your customers." },
              { icon: BarChart3, title: "Business Reports", desc: "Understand your cash flow and business activity with clear financial reports." },
              { icon: ShieldCheck, title: "Security", desc: "Customer and transaction information stored digitally with greater protection." },
              { icon: Smartphone, title: "Mobile App (Phase 3)", desc: "Payment notifications, mobility, and offline functionality on the way." },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-cream)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "#B91C1C" }}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: "var(--text)" }}>{t(f.title)}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{t(f.desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CRUD section */}
      <section className="w-full" style={{ backgroundColor: "var(--surface-alt)" }}>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center font-bold text-3xl sm:text-4xl mb-3" style={{ color: "var(--text)", fontFamily: "Poppins" }}>
            {t("Everything you need, built around four operations")}
          </h2>
          <p className="text-center text-base max-w-2xl mx-auto mb-12" style={{ color: "var(--text-muted)" }}>
            {t("Create, Read, Update, and Delete — the foundation of how FIA'O keeps your credit organized.")}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { op: "Create", desc: "Register customers, debts, products, and transactions." },
              { op: "Read", desc: "View customer info, debt history, payments, reports, and inventory." },
              { op: "Update", desc: "Register payments, modify debt info, and update inventory." },
              { op: "Delete", desc: "Remove records when necessary, with confirmation before deletion." },
            ].map((c, i) => (
              <div key={c.op} className="p-6 rounded-2xl text-center" style={{ backgroundColor: "var(--white)", border: "1px solid var(--border-cream)" }}>
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold text-lg mb-3" style={{ backgroundColor: "#F9D103", color: "var(--on-yellow)" }}>
                  {i + 1}
                </div>
                <h3 className="font-bold text-lg mb-1.5" style={{color: "var(--accent-text)" }}>{t(c.op)}</h3>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t(c.desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="w-full" style={{ backgroundColor: "var(--white)" }}>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center font-bold text-3xl sm:text-4xl mb-12" style={{ color: "var(--text)", fontFamily: "Poppins" }}>
            {t("Our development roadmap")}
          </h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {[
              { phase: "Phase 1", title: "Foundations", desc: "Validation of the problem and development of the CRUD logic.", done: true },
              { phase: "Phase 2", title: "Website", desc: "Launch of a responsive platform for management through computers and tablets.", done: true },
              { phase: "Phase 3", title: "Mobile Application", desc: "A mobile app with payment notifications, mobility, and offline functionality.", done: false },
            ].map((p) => (
              <div key={p.phase} className="p-6 rounded-2xl" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-cream)" }}>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3" style={{ backgroundColor: p.done ? "#B91C1C" : "var(--border-cream)", color: "#FFFFFF" }}>
                  {p.done ? t("Current") : t("Upcoming")}
                </span>
                <h3 className="font-bold text-xl mb-1" style={{ color: "var(--text)" }}>{t(p.phase)} — {t(p.title)}</h3>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t(p.desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full" style={{ backgroundColor: "#B91C1C" }}>
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-white font-bold text-3xl sm:text-4xl mb-4" style={{ fontFamily: "Poppins" }}>
            {t("Ready to leave the notebook behind?")}
          </h2>
          <p className="text-white/90 mb-8 max-w-xl mx-auto">
            {t("Join the mini-supermarket owners digitalizing their fiado with FIA'O.")}
          </p>
          <Link to="/register" className="inline-block px-8 py-3.5 rounded-full font-bold text-sm transition-transform hover:scale-105" style={{ backgroundColor: "#F9D103", color: "var(--on-yellow)" }}>
            {t("Get started — it's free")}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}