import React from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Pequeña etiqueta para registros que todavía no están en la nube. No muestra nada si ya están sincronizados.
export default function SyncBadge({ status }) {
  const { t } = useLanguage();
  if (!status || status === "synced") return null;
  const review = status === "conflict" || status === "rejected";
  const Icon = review ? AlertTriangle : Clock;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
      style={{ backgroundColor: review ? "var(--bad-bg)" : "var(--warn-bg)", color: review ? "var(--bad-text)" : "var(--warn-text)" }}
    >
      <Icon className="w-3 h-3" aria-hidden="true" />
      {review ? t("Review") : t("Pending")}
    </span>
  );
}
