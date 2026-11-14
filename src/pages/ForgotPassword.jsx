import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/authClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ForgotPassword() {
    const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFailed(false);
    try {
      await base44.auth.resetPasswordRequest(email);
      setSent(true); // mensaje genérico: no revela si la cuenta existe
    } catch {
      // Fallo técnico (red, límite de envíos, configuración): aviso neutro que no dice nada sobre la cuenta y permite reintentar
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title={t("Reset password")}
      subtitle={t("We'll send you a link to reset it")}
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />{t("Back to log in")}
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-foreground text-center">
          {t("If an account exists with that email, you'll receive a password reset link shortly.")}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {failed && (
            <p role="alert" className="text-sm text-destructive">
              {t("We could not complete the request right now. Please try again in a moment.")}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t("Email address")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("Sending...")}
              </>
            ) : (
              t("Send reset link")
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
