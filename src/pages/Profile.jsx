import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useTour } from "@/tour/TourProvider";
import { base44 } from "@/api/authClient";
import { fetchSettings, saveSettings, LEDGER_KEYS } from "@/api/creditApi";
import { userToForm, validateProfile, settingsToForm, validateSettings, isDirty } from "@/lib/settings";
import { money, parseAmount } from "@/lib/credit";
import { User, Store, Mail, Phone, MapPin, LogOut, Save, Shield, Globe, Wallet, Clock, Bell, Compass } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const card = { backgroundColor: "var(--surface)" };

function Note({ note }) {
    const { t } = useLanguage();
  if (!note) return null;
  const ok = note.type === "ok";
  return (
    <p
      role={ok ? "status" : "alert"}
      className="text-sm rounded-xl px-3 py-2 mt-4"
      style={{ backgroundColor: ok ? "var(--ok-bg)" : "var(--bad-bg)", color: ok ? "var(--ok-text)" : "var(--bad-text)" }}
    >
      {t(note.text)}
    </p>
  );
}

export default function Profile() {
    const { t, language } = useLanguage();
  const tour = useTour();
  const { user, logout, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });

  // "draft" = lo que el usuario está escribiendo (null = todavía no ha tocado nada).
  const [infoDraft, setInfoDraft] = useState(null);
  const [infoNote, setInfoNote] = useState(null);
  const [rulesDraft, setRulesDraft] = useState(null);
  const [rulesNote, setRulesNote] = useState(null);

  const infoSaved = userToForm(user);
  const infoForm = infoDraft ?? infoSaved;
  const rulesSaved = settingsQuery.data ? settingsToForm(settingsQuery.data) : null;
  const rulesForm = rulesDraft ?? rulesSaved;
  const infoDirty = isDirty(infoDraft, infoSaved);
  const rulesDirty = isDirty(rulesDraft, rulesSaved);

  const saveInfo = useMutation({
    mutationFn: (values) => base44.auth.updateMe(values),
    onSuccess: async () => {
      await refreshUser(); // para que el nombre de la tienda se actualice en toda la web
      setInfoDraft(null);
      setInfoNote({ type: "ok", text: "Business information saved." });
    },
    onError: (e) => setInfoNote({ type: "error", text: e.message }),
  });

  const saveRules = useMutation({
    mutationFn: saveSettings,
    onSuccess: async () => {
      LEDGER_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      setRulesDraft(null);
      setRulesNote({ type: "ok", text: "Credit rules saved." });
    },
    onError: (e) => setRulesNote({ type: "error", text: e.message }),
  });
    // Interruptor de la campana: se guarda al instante.
  const notificationsOn = settingsQuery.data?.notifications_enabled ?? true;
  const toggleNotifications = useMutation({
    mutationFn: (value) => saveSettings({ notifications_enabled: value }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["settings"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]),
  });

  const handleInfoChange = (e) => {
    setInfoDraft({ ...infoForm, [e.target.name]: e.target.value });
    setInfoNote(null);
  };
  const handleRulesChange = (e) => {
    setRulesDraft({ ...rulesForm, [e.target.name]: e.target.value });
    setRulesNote(null);
  };

  const submitInfo = (e) => {
    e.preventDefault();
    setInfoNote(null);
    const result = validateProfile(infoForm);
    if (result.error) return setInfoNote({ type: "error", text: result.error });
    saveInfo.mutate(result.values);
  };
  const submitRules = (e) => {
    e.preventDefault();
    setRulesNote(null);
    const result = validateSettings(rulesForm);
    if (result.error) return setRulesNote({ type: "error", text: result.error });
    saveRules.mutate(result.values);
  };

  const limitPreview = rulesForm ? parseAmount(rulesForm.default_credit_limit) : NaN;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--page-bg)" }}>
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F9D103" }}>
              <span className="font-bold text-2xl" style={{ color: "var(--on-yellow)" }}>
                {(infoForm.full_name || user?.email || "M").charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-white font-bold text-2xl sm:text-3xl" style={{ fontFamily: "Poppins" }}>
                {infoForm.full_name || t("Merchant profile")}
              </h1>
              <p className="text-white/80 text-sm">{user?.email}</p>
            </div>
          </div>

          {/* Business information */}
          <form data-tour="profile-info" onSubmit={submitInfo} className="rounded-2xl p-6 mb-6" style={card}>
            <h2 className="font-bold text-lg mb-5 flex items-center gap-2" style={{ color: "var(--text)" }}>
              <Store className="w-5 h-5" style={{ color: "var(--accent-text)" }} /> {t("Business information")}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field icon={User} label={t("Full name")} name="full_name" value={infoForm.full_name} onChange={handleInfoChange} />
              <Field icon={Store} label={t("Store name")} name="store_name" value={infoForm.store_name} onChange={handleInfoChange} hint={t("Appears in the reminders you send to your customers.")} />
              <Field icon={Phone} label={t("Phone")} name="phone" value={infoForm.phone} onChange={handleInfoChange} inputMode="tel" />
              <Field icon={Mail} label={t("RUC / ID")} name="ruc" value={infoForm.ruc} onChange={handleInfoChange} />
              <div className="sm:col-span-2">
                <Field icon={MapPin} label={t("Address")} name="address" value={infoForm.address} onChange={handleInfoChange} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-5">
              <button type="submit" disabled={saveInfo.isPending || !infoDirty}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: "#B91C1C", color: "#FFFFFF" }}>
                <Save className="w-4 h-4" /> {saveInfo.isPending ? t("Saving...") : t("Save changes")}
              </button>
              {infoDirty && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t("You have unsaved changes.")}</span>}
            </div>
            <Note note={infoNote} />
          </form>

          {/* Credit rules */}
          <form data-tour="profile-rules" onSubmit={submitRules} className="rounded-2xl p-6 mb-6" style={card}>
            <h2 className="font-bold text-lg mb-1 flex items-center gap-2" style={{ color: "var(--text)" }}>
              <Wallet className="w-5 h-5" style={{ color: "var(--accent-text)" }} /> {t("Credit rules")}
            </h2>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              {t("These rules apply to all your customers when you register credit.")}
            </p>

            {settingsQuery.isLoading ? (
              <p className="text-sm py-4" style={{ color: "var(--text-muted)" }}>{t("Loading your rules...")}</p>
            ) : settingsQuery.isError ? (
              <div className="py-2">
                <p className="text-sm mb-3" style={{ color: "var(--bad-text)" }}>{t("Could not load your rules:")} {t(settingsQuery.error.message)}</p>
                <button type="button" onClick={() => settingsQuery.refetch()} className="px-5 py-2 rounded-full text-sm font-bold text-white" style={{ backgroundColor: "#B91C1C" }}>
                  {t("Try again")}
                </button>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field icon={Wallet} label={t("Default credit limit (B/.)")} name="default_credit_limit" value={rulesForm.default_credit_limit} onChange={handleRulesChange} inputMode="decimal"
                    hint={Number.isNaN(limitPreview) ? t("Enter a number.") : t(`Customers without their own limit can owe up to ${money(limitPreview)}.`)} />
                  <Field icon={Clock} label={t("Days to pay")} name="default_due_days" value={rulesForm.default_due_days} onChange={handleRulesChange} inputMode="numeric"
                    hint={t("Used when you register a credit without choosing a due date.")} />
                </div>

                <div className="flex items-start justify-between gap-3 mt-5 p-4 rounded-xl" style={{ backgroundColor: "var(--white)", border: "1px solid var(--border-cream)" }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{t("Automatic blocking")}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {t("Stop new credit when it would take a customer over their limit.")}
                    </p>
                  </div>
                 <button
  type="button"
  role="switch"
  aria-checked={rulesForm.auto_block}
  aria-label={t("Automatic blocking")}
  onClick={() => {
    setRulesDraft({
      ...rulesForm,
      auto_block: !rulesForm.auto_block,
    });
    setRulesNote(null);
  }}
  className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors"
  style={{
    backgroundColor: rulesForm.auto_block
      ? "#B91C1C"
      : "var(--border-cream)",
  }}
>
  <span
    className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
    style={{
      transform: rulesForm.auto_block
        ? "translateX(20px)"
        : "translateX(0px)",
    }}
  />
</button>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-5">
                  <button type="submit" disabled={saveRules.isPending || !rulesDirty}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50"
                    style={{ backgroundColor: "#B91C1C", color: "#FFFFFF" }}>
                    <Save className="w-4 h-4" /> {saveRules.isPending ? t("Saving...") : t("Save rules")}
                  </button>
                  {rulesDirty && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t("You have unsaved changes.")}</span>}
                </div>
                <Note note={rulesNote} />
              </>
            )}
          </form>

          {/* Account */}
          <div data-tour="profile-account" className="rounded-2xl p-6 mb-6" style={card}>
            <h2 className="font-bold text-lg mb-5 flex items-center gap-2" style={{ color: "var(--text)" }}>
              <Shield className="w-5 h-5" style={{ color: "var(--accent-text)" }} /> {t("Account")}
            </h2>
            <div>
              <SettingRow icon={Mail} title={t("Email")} value={user?.email} />
              <SettingRow icon={Globe} title={t("Language")} value={language === "es" ? "Español" : "English"} />
                            <div className="flex items-center justify-between gap-3 py-3" style={{ borderTop: "1px solid var(--border-cream)" }}>
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4" style={{ color: "var(--accent-text)" }} />
                  <div>
                    <span className="text-sm font-medium block" style={{ color: "var(--text)" }}>{t("Notifications")}</span>
                    <span className="text-[11px] block" style={{ color: "var(--text-faint)" }}>{t("Bell alerts for overdue accounts and low stock.")}</span>
                  </div>
                </div>
              <button
  type="button"
  role="switch"
  aria-checked={notificationsOn}
  aria-label={t("Notifications")}
  disabled={toggleNotifications.isPending || !settingsQuery.data}
  onClick={() => toggleNotifications.mutate(!notificationsOn)}
  className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors disabled:opacity-60"
  style={{
    backgroundColor: notificationsOn
      ? "#B91C1C"
      : "var(--border-cream)",
  }}
>
  <span
    className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
    style={{
      transform: notificationsOn
        ? "translateX(20px)"
        : "translateX(0px)",
    }}
  />
</button>
              </div>
              {toggleNotifications.isError && (
                <p role="alert" className="text-sm mt-2" style={{ color: "var(--bad-text)" }}>{t("Could not save:")} {toggleNotifications.error.message}</p>
              )}
              <div className="flex items-center justify-between gap-3 py-3" style={{ borderTop: "1px solid var(--border-cream)" }}>
                <div className="flex items-center gap-3">
                  <Compass className="w-4 h-4" style={{ color: "var(--accent-text)" }} />
                  <div>
                    <span className="text-sm font-medium block" style={{ color: "var(--text)" }}>
                      {language === "es" ? "Recorrido guiado" : "Guided tour"}
                    </span>
                    <span className="text-[11px] block" style={{ color: "var(--text-faint)" }}>
                      {language === "es" ? "Una guía paso a paso por cada sección de FIA'O." : "A step-by-step walkthrough of every screen."}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => tour.start("all")}
                  className="px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: "#F9D103", color: "var(--on-yellow)" }}
                >
                  {language === "es" ? "Iniciar recorrido" : "Start tour"}
                </button>
              </div>
            </div>
          </div>

          {/* Log out */}
          <div className="rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4" style={card}>
            <div>
              <h2 className="font-bold text-lg" style={{ color: "var(--text)" }}>{t("Close session")}</h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("Sign out of your account on this device.")}</p>
            </div>
            <button onClick={() => logout(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold" style={{ backgroundColor: "#B91C1C", color: "#FFFFFF" }}>
              <LogOut className="w-4 h-4" /> {t("Log out")}
            </button>
          </div>

          <div className="mt-6">
            <Link to="/dashboard" className="text-white/80 text-sm font-medium hover:text-white">
              {t("← Back to dashboard")}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Field({ icon: Icon, label, name, value, onChange, hint, inputMode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-muted)" }}>{label}</span>
      <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: "var(--white)", border: "1px solid var(--border-cream)" }}>
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent-text)" }} />
        <input name={name} value={value} onChange={onChange} inputMode={inputMode} className="flex-1 bg-transparent outline-none text-sm" style={{ color: "var(--text)" }} />
      </div>
      {hint && <span className="text-[11px] mt-1 block" style={{ color: "var(--text-faint)" }}>{hint}</span>}
    </label>
  );
}

function SettingRow({ icon: Icon, title, value }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderTop: "1px solid var(--border-cream)" }}>
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4" style={{ color: "var(--accent-text)" }} />
        <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{title}</span>
      </div>
      <span className="text-sm" style={{ color: "var(--text-muted)" }}>{value}</span>
    </div>
  );
}