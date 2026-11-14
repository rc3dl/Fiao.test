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
  if (provider.id === "google") return <GoogleIcon className="h-5 w-5" />;

  const color =
    provider.id === "facebook" ? "#1877F2" :
    provider.id === "apple" ? "#242424" :
    "#5B6472";

  return (
    <span
      aria-hidden="true"
      className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-base font-extrabold"
      style={{ color }}
    >
      {provider.mark}
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
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60"
              style={{ borderColor: "var(--border)" }}
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
