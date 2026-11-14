import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LegalPageLayout({ title, updated, intro, notice, sections }) {
  const { language } = useLanguage();
  const es = language === "es";

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--page-bg)" }}>
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/85 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            {es ? "Volver al inicio" : "Back to home"}
          </Link>

          <article className="mt-7 overflow-hidden rounded-3xl shadow-xl" style={{ backgroundColor: "var(--white)" }}>
            <header className="px-6 py-8 sm:px-10 sm:py-10" style={{ backgroundColor: "#2D2926" }}>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#F9D103]">
                {es ? "Información legal" : "Legal information"}
              </span>
              <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl" style={{ fontFamily: "Poppins" }}>{title}</h1>
              <p className="mt-3 text-sm text-white/65">{updated}</p>
              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/85 sm:text-base">{intro}</p>
            </header>

            <div className="space-y-7 px-6 py-8 sm:px-10 sm:py-10">
              <div className="rounded-2xl border px-5 py-4 text-sm leading-relaxed" style={{ backgroundColor: "#FFF8D8", borderColor: "#F0E2A8", color: "#6D5410" }}>
                <strong className="block mb-1">{es ? "Nota sobre el estado del proyecto" : "About the project's status"}</strong>
                {notice}
              </div>

              {sections.map((section, index) => (
                <section key={section.heading}>
                  <h2 className="text-lg font-bold sm:text-xl" style={{ color: "var(--text)" }}>{index + 1}. {section.heading}</h2>
                  {section.paragraphs?.map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex} className="mt-3 text-sm leading-7" style={{ color: "var(--text-muted)" }}>{paragraph}</p>
                  ))}
                  {section.bullets?.length > 0 && (
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7" style={{ color: "var(--text-muted)" }}>
                      {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                    </ul>
                  )}
                  {section.links?.length > 0 && (
                    <ul className="mt-3 space-y-2 text-sm">
                      {section.links.map((link) => (
                        <li key={link.label}>
                          <a href={link.href} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4" style={{ color: "var(--accent-text)" }}>{link.label}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}

              <div className="border-t pt-6" style={{ borderColor: "var(--border-cream)" }}>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {es ? "¿Tienes una consulta sobre este documento?" : "Have a question about this document?"}{" "}
                  <Link to="/contact" className="font-semibold underline underline-offset-4" style={{ color: "var(--accent-text)" }}>
                    {es ? "Contacta con FIA'O." : "Contact FIA'O."}
                  </Link>
                </p>
              </div>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
