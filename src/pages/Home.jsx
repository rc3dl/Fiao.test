import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PhoneMockup from "@/components/PhoneMockup";
import { Link } from "react-router-dom";
import { ShieldCheck, BookOpen, Bell, BarChart3, Smartphone, Wallet } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
    const { t, language } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--page-bg)" }}>
      <Navbar />

      {/* Hero */}
      <section className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-10 lg:py-16 grid lg:grid-cols-2 gap-10 items-center">
          {/* Left */}
          <div className="text-center lg:text-left">
           <h1 className="text-white font-bold leading-[1.1] text-4xl sm:text-5xl lg:text-6xl" style={{ fontFamily: "Poppins" }}>
  {language === "en" ? (
    <>Your <span style={{ color: "#F9D103" }}>Credit</span> notebook, now digital.</>
  ) : (
    <>Tu libreta de <span style={{ color: "#F9D103" }}>fiados</span>, ahora digital.</>
  )}
</h1>
            <p className="text-white/90 mt-5 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              {t("FIA'O digitizes customer, debt, and payment management for convenience stores and small businesses in Panama, replacing the traditional paper ledger with a modern digital management system.")}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to="/login" className="px-7 py-3 rounded-full font-bold text-sm text-center transition-transform hover:scale-105" style={{ backgroundColor: "#F9D103", color: "var(--on-yellow)" }}>
                {t("Login")}
              </Link>
              <Link to="/register" className="px-7 py-3 rounded-full font-bold text-sm text-center transition-transform hover:scale-105" style={{ backgroundColor: "#F9D103", color: "var(--on-yellow)" }}>
                {t("Sign up")}
              </Link>
            </div>
            <p className="text-white/80 mt-6 text-sm font-medium">
              {t("Manage your fiado, manage your business.")}
            </p>
          </div>

          {/* Right - phone mockup */}
          <div className="flex justify-center lg:justify-end">
            <PhoneMockup />
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