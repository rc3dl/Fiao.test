import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { sendContactMessage } from "@/api/contactApi";
import { validateContact, CONTACT_LIMITS } from "@/lib/contact";
import { useLanguage } from "@/contexts/LanguageContext";

// Respuestas que solo prometen lo que la web realmente hace.
export const FAQS = [
  {
    q: "Does it work without internet?",
    a: "Not at the moment. FIA'O needs an internet connection to save and load your notebook, so make sure you're online when you register credits and payments.",
  },
  {
    q: "How do I start using the app?",
    a: "Sign up, tell us about your store, add your customers and start registering credits and payments. No training needed — if you know how to use a notebook, you know how to use FIA'O.",
  },
  {
    q: "Do payment reminders arrive automatically?",
    a: "Not automatically. FIA'O prepares a friendly WhatsApp message for each customer with a pending balance. You review it and send it with one tap from the Clients page.",
  },
  {
    q: "Can I export my reports?",
    a: "Yes. From the Reports page you can download an Excel file or a PDF for any period you choose.",
  },
  {
    q: "What if a customer doesn't pay?",
    a: "FIA'O flags overdue accounts on your Dashboard, in the bell and in Reports, and helps you send reminders. With Automatic Blocking on, it also stops new credit for customers who would go over their limit.",
  },
];

function FaqItem({ item }) {
    const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--white)", border: "1px solid var(--border-cream)" }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-semibold text-sm sm:text-base" style={{ color: "var(--text)" }}>{t(item.q)}</span>
        <span className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ml-3" style={{ backgroundColor: "var(--surface)" }}>
          <Plus className={`w-4 h-4 transition-transform ${open ? "rotate-45" : ""}`} style={{ color: "var(--accent-text)" }} />
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{t(item.a)}</p>
        </div>
      )}
    </div>
  );
}

const fieldStyle = { backgroundColor: "var(--surface)", borderColor: "var(--border-cream)", color: "var(--text)" };

export default function Contact() {
    const { t } = useLanguage();
  const { user } = useAuth();
  // Nombre y correo ya vienen de tu cuenta; solo cambian si la persona los edita.
  const [draft, setDraft] = useState({});
  const [message, setMessage] = useState("");
  const [note, setNote] = useState(null);

  const name = draft.name ?? user?.full_name ?? "";
  const email = draft.email ?? user?.email ?? "";

  const send = useMutation({
    mutationFn: sendContactMessage,
    onSuccess: (_, vars) => {
      setMessage("");
      setNote({ type: "ok", text: `Thanks! We got your message and we'll reply to ${vars.email}.` });
    },
    onError: (e) => setNote({ type: "error", text: e.message }),
  });

  const submit = (e) => {
    e.preventDefault();
    setNote(null);
    const result = validateContact({ name, email, message });
    if (result.error) return setNote({ type: "error", text: result.error });
    send.mutate(result.values);
  };

  const left = CONTACT_LIMITS.messageMax - message.length;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--page-bg)" }}>
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="font-bold text-3xl sm:text-4xl mb-3" style={{ color: "#FFFFFF", fontFamily: "Poppins" }}>
              {t("Have questions? We are here to help")}
            </h1>
            <p className="text-white/80 max-w-xl mx-auto">
              {t("Check out the FAQs below or send us a message and we'll get back to you by email.")}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* FAQ */}
            <div data-tour="contact-faq" className="space-y-3">
              {FAQS.map((f) => (
                <FaqItem key={f.q} item={f} />
              ))}
            </div>

            {/* Contact form */}
            <div data-tour="contact-form" className="rounded-3xl p-6 sm:p-8 h-fit" style={{ backgroundColor: "var(--white)", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
              <h2 className="font-bold text-xl mb-5" style={{ color: "var(--text)" }}>{t("Send us a message")}</h2>
              <form onSubmit={submit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="contact-name" className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>{t("NAME")}</label>
                  <input
                    id="contact-name"
                    value={name}
                    onChange={(e) => { setDraft({ ...draft, name: e.target.value }); setNote(null); }}
                    placeholder={t("Your name")}
                    maxLength={CONTACT_LIMITS.name}
                    className="w-full rounded-xl px-4 py-3 text-sm border outline-none"
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>{t("EMAIL (where we'll reply)")}</label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setDraft({ ...draft, email: e.target.value }); setNote(null); }}
                    placeholder="you@example.com"
                    maxLength={CONTACT_LIMITS.email}
                    className="w-full rounded-xl px-4 py-3 text-sm border outline-none"
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>{t("MESSAGE")}</label>
                  <textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => { setMessage(e.target.value); setNote(null); }}
                    placeholder={t("Tell us how we can help you")}
                    rows={5}
                    maxLength={CONTACT_LIMITS.messageMax}
                    className="w-full rounded-xl px-4 py-3 text-sm border outline-none resize-none"
                    style={fieldStyle}
                  />
                  <p className="text-[11px] mt-1 text-right" style={{ color: left < 100 ? "var(--bad-text)" : "var(--text-faint)" }}>
                    {left} {t("characters left")}
                  </p>
                </div>

                {note && (
                  <p
                    role={note.type === "ok" ? "status" : "alert"}
                    className="text-sm rounded-xl px-4 py-3"
                    style={{ backgroundColor: note.type === "ok" ? "var(--ok-bg)" : "var(--bad-bg)", color: note.type === "ok" ? "var(--ok-text)" : "var(--bad-text)" }}
                  >
                    {t(note.text)}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={send.isPending}
                  className="w-full py-3.5 rounded-full font-bold text-sm text-white transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
                  style={{ backgroundColor: "#B91C1C" }}
                >
                  {send.isPending ? t("Sending...") : t("Send message")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}