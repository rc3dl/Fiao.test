import React from "react";
import { Loader2 } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { useLanguage } from "@/contexts/LanguageContext";

const PROVIDERS = [
  { id: "google", name: "Google", mark: "G" },
  { id: "apple", name: "Apple", mark: "A" },
  { id: "facebook", name: "Facebook", mark: "f" },
  { id: "azure", name: "Microsoft", mark: "M" },
];

function ProviderMark({ provider }) {
  if (provider.id === "google") return <GoogleIcon className="h-5 w-5 shrink-0" />;

  if (provider.id === "apple") {
    return (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.08-.35C2.67 14.3 3.5 6.4 9.1 6.1c1.35.07 2.3.75 3.1.8.99-.2 1.94-.9 3.02-.83 1.3.1 2.28.62 2.9 1.55-2.65 1.59-2.22 5.07.28 6.05-.48 1.27-1.1 2.51-2.35 3.62zM12.03 6c-.15-2.25 1.67-4.11 3.77-4.3.29 2.6-2.36 4.56-3.77 4.3z"
        />
      </svg>
    );
  }

  if (provider.id === "azure") {
    return (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#F25022" d="M1 1h10v10H1z" />
        <path fill="#7FBA00" d="M13 1h10v10H13z" />
        <path fill="#00A4EF" d="M1 13h10v10H1z" />
        <path fill="#FFB900" d="M13 13h10v10H13z" />
      </svg>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-5 w-5 shrink-0 items-center justify-center text-[21px] font-bold leading-none text-[#1877F2]"
    >
      f
    </span>
  );
}

export default function OAuthOptions({ onSelect, loadingProvider = null }) {
  const { language } = useLanguage();
  const es = language === "es";
  const actionLabel = es ? "Continuar con" : "Continue with";

  return (
    <section className="mb-5" aria-label={es ? "Métodos de acceso" : "Sign-in methods"}>
      <p className="mb-3 text-center text-xs font-semibold text-muted-foreground">
        {es ? "También puedes continuar con" : "You can also continue with"}
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {PROVIDERS.map((provider) => {
          const busy = loadingProvider === provider.id;
          const disabled = Boolean(loadingProvider);
          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => onSelect(provider.id)}
              disabled={disabled}
              aria-label={actionLabel + " " + provider.name}
              aria-busy={busy}
              className="oauth-provider-button inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold opacity-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ProviderMark provider={provider} />}
              <span>{provider.name}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-muted-foreground">
        {es
          ? "Cada método debe estar habilitado en la configuración de autenticación de Supabase."
          : "Each method must be enabled in your Supabase Authentication settings."}
      </p>
    </section>
  );
}
