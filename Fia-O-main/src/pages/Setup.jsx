import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchSettings, LEDGER_KEYS } from "@/api/creditApi";
import { completeSetup } from "@/api/setupApi";
import { userToForm, settingsToForm, validateSetup, isProfileComplete, setupReturnPath, DEFAULT_RULES_FORM } from "@/lib/settings";
import { money, parseAmount } from "@/lib/credit";
import { User, Store, Phone, Mail, MapPin, Wallet, Clock, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { withBase } from "@/lib/withBase";
// Pantalla que aparece después de iniciar sesión cuando todavía falta información del negocio.
export default function Setup() {
    const { t } = useLanguage();
  const { user, logout } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });

  const [infoDraft, setInfoDraft] = useState(null);
  const [rulesDraft, setRulesDraft] = useState(null);
  const [error, setError] = useState("");
  const from = setupReturnPath(location.state?.from);

  const info = infoDraft ?? userToForm(user);
  const rules = rulesDraft ?? (settingsQuery.data ? settingsToForm(settingsQuery.data) : DEFAULT_RULES_FORM);

  const save = useMutation({
    mutationFn: completeSetup,
    onSuccess: async () => {
      LEDGER_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      // Recarga completa: así toda la web arranca ya con el perfil guardado.
    window.location.assign(withBase(from));
    },
    onError: (e) => setError(e.message),
  });

  // Quien ya tiene todo completo no tiene nada que hacer aquí.
  if (isProfileComplete(user)) return <Navigate to={from} replace />;

  const onInfo = (e) => {
    setInfoDraft({ ...info, [e.target.name]: e.target.value });
    setError("");
  };
  const onRules = (e) => {
    setRulesDraft({ ...rules, [e.target.name]: e.target.value });
    setError("");
  };

  const submit = (e) => {
    e.preventDefault();
    setError("");
    const result = validateSetup(info, rules);
    if (result.error) return setError(result.error);
    save.mutate(result.values);
  };

  const limit = parseAmount(rules.default_credit_limit);
  const section = "font-bold text-base mb-4 flex items-center gap-2";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ backgroundColor: "var(--page-bg)" }}>
      <div className="w-full max-w-2xl">
      <img
  src={withBase("/Logo-fiao-200x67.svg")}
  alt="FIA'O"
  className="h-14 w-auto mx-auto mb-6"
/>

        <form onSubmit={submit} className="rounded-3xl p-6 sm:p-8" style={{ backgroundColor: "var(--surface)", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
          <h1 className="font-bold text-2xl sm:text-3xl mb-2" style={{ color: "var(--text)", fontFamily: "Poppins" }}>
            {t("Welcome to FIA'O 👋")}
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            {t("Let's set up your store. It takes about a minute, and you can change everything later in Profile.")}
          </p>

          <h2 className={section} style={{ color: "var(--text)" }}>
            <User className="w-4 h-4" style={{ color: "var(--accent-text)" }} /> {t("About you")}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <Field icon={User} label={t("Your name *")} name="full_name" value={info.full_name} onChange={onInfo} placeholder="Graciela Moreno" autoFocus />
            <Field icon={Phone} label={t("Phone")} name="phone" value={info.phone} onChange={onInfo} placeholder="6123-4567" inputMode="tel" />
          </div>

          <h2 className={section} style={{ color: "var(--text)" }}>
            <Store className="w-4 h-4" style={{ color: "var(--accent-text)" }} /> {t("Your store")}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <Field icon={Store} label={t("Store name *")} name="store_name" value={info.store_name} onChange={onInfo} placeholder="Minisúper Doña Chela" hint={t("Your customers will see it in the reminders you send them.")} />
            <Field icon={Mail} label={t("RUC / ID")} name="ruc" value={info.ruc} onChange={onInfo} placeholder={t("Optional")} />
            <div className="sm:col-span-2">
              <Field icon={MapPin} label={t("Address")} name="address" value={info.address} onChange={onInfo} placeholder={t("Optional")} />
            </div>
          </div>

          <h2 className={section} style={{ color: "var(--text)" }}>
            <Wallet className="w-4 h-4" style={{ color: "var(--accent-text)" }} /> {t("Credit rules")}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field icon={Wallet} label={t("Default credit limit (B/.)")} name="default_credit_limit" value={rules.default_credit_limit} onChange={onRules} inputMode="decimal"
              hint={Number.isNaN(limit) ? t("Enter a number.") : t(`Customers can owe up to ${money(limit)} unless you set a different limit for them.`)} />
            <Field icon={Clock} label={t("Days to pay")} name="default_due_days" value={rules.default_due_days} onChange={onRules} inputMode="numeric"
              hint={t("How long customers have to pay each credit.")} />
          </div>

          <div className="flex items-start justify-between gap-3 mt-4 p-4 rounded-xl" style={{ backgroundColor: "var(--white)", border: "1px solid var(--border-cream)" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{t("Automatic blocking")}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{t("Stop new credit when it would take a customer over their limit.")}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={rules.auto_block}
              aria-label={t("Automatic blocking")}
              onClick={() => {
                setRulesDraft({ ...rules, auto_block: !rules.auto_block });
                setError("");
              }}
              className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors"
              style={{ backgroundColor: rules.auto_block ? "#B91C1C" : "var(--border-cream)" }}
            >
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: rules.auto_block ? "translateX(22px)" : "translateX(2px)" }} />
            </button>
          </div>

          {error && (
            <p role="alert" className="text-sm rounded-xl px-4 py-3 mt-6" style={{ backgroundColor: "var(--bad-bg)", color: "var(--bad-text)" }}>
              {t(error)}
            </p>
          )}

          <button type="submit" disabled={save.isPending || settingsQuery.isLoading}
            className="w-full mt-6 inline-flex items-center justify-center gap-2 py-3.5 rounded-full font-bold text-sm text-white disabled:opacity-60"
            style={{ backgroundColor: "#B91C1C" }}>
            {save.isPending ? t("Saving...") : t("Save and continue")} {!save.isPending && <ArrowRight className="w-4 h-4" />}
          </button>

          <p className="text-xs text-center mt-4" style={{ color: "var(--text-faint)" }}>
            {t("* Required.")} {user?.email ? t(`Signed in as ${user.email}. `) : ""}
            <button type="button" onClick={() => logout(true)} className="font-semibold underline" style={{ color: "var(--accent-text)" }}>
              {t("Not you? Log out")}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, name, value, onChange, placeholder, hint, inputMode, autoFocus }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-muted)" }}>{label}</span>
      <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: "var(--white)", border: "1px solid var(--border-cream)" }}>
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent-text)" }} />
        <input name={name} value={value} onChange={onChange} placeholder={placeholder} inputMode={inputMode} autoFocus={autoFocus}
          className="flex-1 bg-transparent outline-none text-sm" style={{ color: "var(--text)" }} />
      </div>
      {hint && <span className="text-[11px] mt-1 block" style={{ color: "var(--text-faint)" }}>{hint}</span>}
    </label>
  );
}