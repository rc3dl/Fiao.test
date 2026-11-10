
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { withBase } from "@/lib/withBase";
import { IS_NATIVE } from "@/native/useIsNative";

export default function AuthLayout({
  icon: Icon,
  title,
  subtitle,
  footer,
  children,
}) {
  const { t } = useLanguage();
  const { pathname } = useLocation();

  // Android: cabecera de marca arriba y panel inferior con el formulario.
  if (IS_NATIVE) {
    return (
      <div className="fiao-auth">
        <div className="fiao-auth-hero">
          {pathname !== "/login" && (
            <Link to="/login" className="fiao-auth-back" aria-label={t("common.back")}>
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </Link>
          )}
          <img src={withBase("/Logo-fiao-300x100.svg")} alt="FIA'O" className="fiao-auth-logo select-none" draggable={false} />
        </div>
        <div className="fiao-auth-panel bg-card">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-primary-foreground" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground leading-tight">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {children}
          {footer && <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">

        {/* Volver al inicio */}
        <div className="mb-5 w-full flex justify-start mt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t("common.back")}
          </Link>
        </div>

        {/* Logo de FIA'O */}
        <Link
          to="/"
          aria-label="FIA'O, inicio"
          className="flex justify-center"
        >
          <img
            src={withBase("/Logo-fiao-200x67.svg")}
            alt="FIA'O"
            className="h-12 sm:h-14 w-auto mx-auto mb-6 translate-y-3"
          />
        </Link>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <Icon
              className="w-7 h-7 text-primary-foreground"
              aria-hidden="true"
            />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>

          {subtitle && (
            <p className="text-muted-foreground mt-2">{subtitle}</p>
          )}
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {children}
        </div>

        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}
