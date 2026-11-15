import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Download,
  FolderOpen,
  MessageCircle,
  Package,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PhoneMockup from "@/components/PhoneMockup";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/api/supabaseClient";
import { SUPABASE_CONFIGURED, SUPABASE_URL } from "@/lib/env";
import { isTrustedReleaseUrl } from "@/lib/trustedReleaseUrl";

export default function Home() {
  const { language } = useLanguage();
  const es = language === "es";

  // The APK button only appears when an actual published release exists in Supabase.
  const { data: androidRelease, isLoading: releaseLoading, isError: releaseError } = useQuery({
    queryKey: ["public-android-release"],
    enabled: SUPABASE_CONFIGURED,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_releases")
        .select("version_name, version_code, apk_url, notes_es, notes_en, created_at")
        .eq("platform", "android")
        .eq("published", true)
        .order("version_code", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const hasTrustedApk = Boolean(
    androidRelease?.apk_url && isTrustedReleaseUrl(androidRelease.apk_url, SUPABASE_URL)
  );

  const features = es
    ? [
        { icon: Users, title: "Clientes organizados", text: "Guarda los datos de tus clientes, consulta sus saldos y revisa su historial de movimientos." },
        { icon: CreditCard, title: "Fiados y abonos", text: "Registra nuevos fiados, pagos parciales o completos y fechas de vencimiento." },
        { icon: Package, title: "Inventario al día", text: "Controla productos, precios y existencias. Recibe avisos cuando un producto tenga poco stock." },
        { icon: Wallet, title: "Ventas fiadas desde inventario", text: "Selecciona al cliente y los productos: FIA'O registra la deuda y descuenta las existencias." },
        { icon: MessageCircle, title: "Recordatorios por WhatsApp", text: "Prepara un mensaje de cobro para revisarlo y enviarlo tú mismo desde WhatsApp." },
        { icon: BarChart3, title: "Informes del negocio", text: "Consulta movimientos y resultados por período, y exporta tus informes a Excel o PDF." },
      ]
    : [
        { icon: Users, title: "Organized customers", text: "Save customer details, check balances, and review each customer's transaction history." },
        { icon: CreditCard, title: "Credits and payments", text: "Register new credit, partial or full payments, and due dates." },
        { icon: Package, title: "Up-to-date inventory", text: "Track products, prices, and stock. Get alerts when an item is running low." },
        { icon: Wallet, title: "Credit sales from inventory", text: "Choose the customer and products: FIA'O records the debt and deducts the stock." },
        { icon: MessageCircle, title: "WhatsApp reminders", text: "Prepare a payment reminder, review it, and send it yourself through WhatsApp." },
        { icon: BarChart3, title: "Business reports", text: "Review activity by period and export your reports to Excel or PDF." },
      ];

  const steps = es
    ? [
        { number: "01", title: "Configura tu negocio", text: "Crea tu cuenta y define los datos y reglas básicas de crédito de tu comercio." },
        { number: "02", title: "Agrega clientes y productos", text: "Registra a las personas a quienes les vendes fiado y organiza tu inventario." },
        { number: "03", title: "Registra cada movimiento", text: "Anota fiados, abonos y ventas desde inventario para mantener los saldos actualizados." },
        { number: "04", title: "Revisa cómo va tu negocio", text: "Consulta el panel, identifica cuentas vencidas y descarga informes cuando los necesites." },
      ]
    : [
        { number: "01", title: "Set up your business", text: "Create your account and define your store details and basic credit rules." },
        { number: "02", title: "Add customers and products", text: "Register the people you sell to on credit and organize your inventory." },
        { number: "03", title: "Record every transaction", text: "Log credit, payments, and inventory sales to keep balances up to date." },
        { number: "04", title: "Review your business", text: "Check your dashboard, identify overdue accounts, and download reports when needed." },
      ];

  const faqs = es
    ? [
        { q: "¿Qué puedo administrar con FIA'O?", a: "Puedes registrar clientes, controlar fiados y pagos, organizar productos e inventario, revisar alertas y consultar informes de la actividad de tu negocio." },
        { q: "¿Los recordatorios de WhatsApp se envían automáticamente?", a: "No. FIA'O prepara el mensaje con la información del cliente para que puedas revisarlo. Al abrir WhatsApp, tú decides si lo envías." },
        { q: "¿FIA'O funciona sin conexión a internet?", a: "La versión web necesita internet. La aplicación Android puede consultar datos guardados y registrar cambios sin conexión; cuando vuelve internet, intenta sincronizarlos. Si detecta un conflicto, puede pedirte que revises el cambio." },
        { q: "¿Puedo exportar mis informes?", a: "Sí. En la sección Informes puedes seleccionar un período y descargar los resultados en Excel o PDF." },
        { q: "¿Puedo establecer límites de crédito?", a: "Sí. Puedes configurar un límite general y límites por cliente. Cuando el bloqueo automático está activado, FIA'O impide registrar un nuevo fiado que supere el límite aplicable." },
      ]
    : [
        { q: "What can I manage with FIA'O?", a: "Register customers, track credit and payments, organize products and inventory, review alerts, and check reports about your business activity." },
        { q: "Are WhatsApp reminders sent automatically?", a: "No. FIA'O prepares a message with the customer's information for you to review. When WhatsApp opens, you decide whether to send it." },
        { q: "Does FIA'O work without an internet connection?", a: "The web version needs internet. The Android app can read saved data and record changes offline; when internet returns, it tries to sync them. If it detects a conflict, it may ask you to review the change." },
        { q: "Can I export my reports?", a: "Yes. In Reports, choose a period and download the results as an Excel or PDF file." },
        { q: "Can I set credit limits?", a: "Yes. You can configure a general limit and individual customer limits. When automatic blocking is on, FIA'O prevents a new credit entry that would exceed the applicable limit." },
      ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--page-bg)" }}>
      <Navbar />

      <main className="flex-1">
        <section id="inicio" className="relative isolate overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute -left-28 -top-36 h-96 w-96 rounded-full bg-yellow-300/10 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-14 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:py-20">
            <div className="motion-safe:animate-[fiao-rise_650ms_ease-out_both] text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-white shadow-sm backdrop-blur">
                <ShieldCheck className="h-4 w-4 text-[#F9D103]" />
                {es ? "HECHO PARA PEQUEÑOS NEGOCIOS" : "MADE FOR SMALL BUSINESSES"}
              </div>

              <h1 className="mx-auto max-w-2xl text-balance text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:mx-0 lg:text-6xl" style={{ fontFamily: "Poppins" }}>
                {es ? (
                  <>Tus <span className="text-[#F9D103]">fiados, clientes e inventario</span>, bajo control.</>
                ) : (
                  <>Your <span className="text-[#F9D103]">credit, customers, and inventory</span>, under control.</>
                )}
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg lg:mx-0">
                {es
                  ? "Registra fiados y abonos, organiza tus clientes y productos, controla las existencias y consulta los resultados de tu negocio desde un solo lugar."
                  : "Record credit and payments, organize customers and products, track stock, and review your business activity in one place."}
              </p>

              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold shadow-lg shadow-black/10 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#B91C1C]"
                  style={{ backgroundColor: "#F9D103", color: "var(--on-yellow)" }}
                >
                  {es ? "Crea tu cuenta" : "Create your account"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="#funciones"
                  className="inline-flex items-center justify-center rounded-full border border-white/35 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {es ? "Conoce FIA'O" : "Explore FIA'O"}
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs font-medium text-white/80 lg:justify-start">
                <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-[#F9D103]" />{es ? "Clientes" : "Customers"}</span>
                <span className="inline-flex items-center gap-2"><Wallet className="h-4 w-4 text-[#F9D103]" />{es ? "Fiados y pagos" : "Credit and payments"}</span>
                <span className="inline-flex items-center gap-2"><Package className="h-4 w-4 text-[#F9D103]" />{es ? "Inventario" : "Inventory"}</span>
                <span className="inline-flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#F9D103]" />{es ? "Informes" : "Reports"}</span>
              </div>
            </div>

            <div className="relative flex justify-center py-4 motion-safe:animate-[fiao-rise_800ms_ease-out_120ms_both] lg:justify-end">
              <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-transparent shadow-[0_0_90px_rgba(249,209,3,0.14)] sm:h-[26rem] sm:w-[26rem]" />
              <div className="relative z-10"><PhoneMockup /></div>
              <div className="absolute left-0 top-14 z-20 hidden items-center gap-2 rounded-2xl border border-white/60 bg-white px-4 py-3 text-sm font-semibold text-[#2D2926] shadow-xl sm:flex lg:-left-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF4B8] text-[#9A6B00]"><Users className="h-4 w-4" /></span>
                {es ? "Clientes organizados" : "Organized customers"}
              </div>
              <div className="absolute bottom-16 right-0 z-20 hidden items-center gap-2 rounded-2xl border border-white/60 bg-white px-4 py-3 text-sm font-semibold text-[#2D2926] shadow-xl sm:flex lg:-right-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FCE4E4] text-[#B91C1C]"><Bell className="h-4 w-4" /></span>
                {es ? "Alertas y vencimientos" : "Alerts and due dates"}
              </div>
            </div>
          </div>
        </section>

        <section className="w-full" style={{ backgroundColor: "var(--white)" }}>
          <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--accent-text)" }}>{es ? "Todo conectado" : "All connected"}</span>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: "var(--text)", fontFamily: "Poppins" }}>
                {es ? "Lleva las cuentas de tu negocio con más claridad" : "Keep your business records clear and organized"}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {es
                  ? "Deja de buscar entre apuntes. Encuentra la información de tus clientes, los saldos pendientes y el inventario en las secciones que necesitas."
                  : "Spend less time searching through notes. Find customer information, outstanding balances, and inventory in the sections you need."}
              </p>
            </div>

            <div id="funciones" className="mt-10 grid scroll-mt-8 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title} className="rounded-2xl border p-6 transition duration-200 hover:-translate-y-1 hover:shadow-lg" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-cream)" }}>
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: "#B91C1C" }}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold" style={{ color: "var(--text)" }}>{feature.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{feature.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="w-full scroll-mt-8" style={{ backgroundColor: "var(--surface-alt)" }}>
          <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
            <div className="mb-10 max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--accent-text)" }}>{es ? "Empieza paso a paso" : "A simple start"}</span>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: "var(--text)", fontFamily: "Poppins" }}>
                {es ? "Así funciona FIA'O" : "How FIA'O works"}
              </h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {es
                  ? "Organiza tu información una vez y mantén cada movimiento registrado a medida que trabajas."
                  : "Set up your information once and keep each transaction recorded as you work."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <article key={step.number} className="rounded-2xl border p-6" style={{ backgroundColor: "var(--white)", borderColor: "var(--border-cream)" }}>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold" style={{ backgroundColor: "#F9D103", color: "#2D2926" }}>{step.number}</span>
                  <h3 className="mt-5 text-lg font-bold" style={{ color: "var(--text)" }}>{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="android" className="w-full scroll-mt-8" style={{ backgroundColor: "var(--white)" }}>
          <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
            <div className="overflow-hidden rounded-[2rem] p-6 text-white shadow-xl sm:p-10 lg:p-12" style={{ backgroundColor: "#2D2926" }}>
              <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-[#F9D103]">
                    <Smartphone className="h-4 w-4" />
                    {es ? "APLICACIÓN PARA ANDROID" : "ANDROID APPLICATION"}
                  </span>
                  <h2 className="mt-5 text-3xl font-bold sm:text-4xl" style={{ fontFamily: "Poppins" }}>
                    {es ? "Lleva FIA'O contigo" : "Take FIA'O with you"}
                  </h2>
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
                    {es
                      ? "La aplicación Android incorpora herramientas para seguir trabajando desde el teléfono, incluso cuando la conexión se interrumpe."
                      : "The Android app includes tools to keep working from your phone, even when your connection drops."}
                  </p>

                  <div className="mt-7 space-y-4">
                    {[
                      es ? "Consulta información guardada y registra cambios sin conexión." : "Read saved information and record changes offline.",
                      es ? "Sincroniza los cambios cuando vuelve internet y permite revisar posibles conflictos." : "Sync changes when internet returns and lets you review possible conflicts.",
                      es ? "Incluye avisos locales para cuentas vencidas y productos con poco stock, según tu configuración." : "Includes local alerts for overdue accounts and low-stock products, based on your settings.",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3 text-sm leading-relaxed text-white/85">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#F9D103]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 text-xs leading-relaxed text-white/55">
                    {es
                      ? "La versión web funciona con conexión a internet. Las funciones sin conexión corresponden a la aplicación Android."
                      : "The web version requires an internet connection. Offline features are available in the Android application."}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/15 bg-white p-6 text-center shadow-lg sm:p-8" style={{ color: "#2D2926" }}>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: "#FFF4B8", color: "#8B6500" }}>
                    <Smartphone className="h-7 w-7" />
                  </div>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "#8B6500" }}>
                    {es ? "FIA'O PARA ANDROID" : "FIA'O FOR ANDROID"}
                  </p>
                  <h3 className="mt-2 text-xl font-bold">
                    {es ? "Instalador APK" : "APK installer"}
                  </h3>

                  {releaseLoading ? (
                    <p className="mt-3 text-sm" style={{ color: "#6B6357" }}>{es ? "Comprobando la versión disponible…" : "Checking the available version…"}</p>
                  ) : hasTrustedApk ? (
                    <>
                      <p className="mt-3 text-sm" style={{ color: "#6B6357" }}>
                        {es ? "Última versión publicada:" : "Latest published version:"} <strong>{androidRelease.version_name}</strong>
                      </p>
                      <a
                        href={androidRelease.apk_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold transition hover:-translate-y-0.5"
                        style={{ backgroundColor: "#B91C1C", color: "#FFFFFF" }}
                      >
                        <Download className="h-4 w-4" />
                        {es ? "Descargar APK" : "Download APK"}
                      </a>
                    </>
                  ) : (
                    <>
                      <p className="mt-3 text-sm leading-relaxed" style={{ color: "#6B6357" }}>
                        {releaseError
                          ? (es ? "No pudimos consultar el enlace en este momento." : "We couldn't check the download link right now.")
                          : (es ? "El enlace de descarga aparecerá aquí cuando exista una versión publicada." : "The download link will appear here when a version is published.")}
                      </p>
                      <Link
                        to="/contact"
                        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold transition hover:-translate-y-0.5"
                        style={{ backgroundColor: "#B91C1C", color: "#FFFFFF" }}
                      >
                        {es ? "Consultar disponibilidad" : "Ask about availability"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </>
                  )}

                  <p className="mt-4 text-[11px] leading-relaxed" style={{ color: "#8A8178" }}>
                    {es
                      ? "Instala únicamente APK distribuidos mediante enlaces oficiales de FIA'O. Android puede solicitar confirmación antes de instalar."
                      : "Only install APK files distributed through official FIA'O links. Android may ask you to confirm the installation."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="instalar-android" className="w-full scroll-mt-8" style={{ backgroundColor: "var(--surface-alt)" }}>
          <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--accent-text)" }}>
                {es ? "GUÍA DE INSTALACIÓN" : "INSTALLATION GUIDE"}
              </span>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: "var(--text)", fontFamily: "Poppins" }}>
                {es ? "¿Primera vez instalando FIA'O?" : "Installing FIA'O for the first time?"}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {es
                  ? "No necesitas conocimientos técnicos. Sigue estos pasos desde tu teléfono Android y tendrás FIA'O lista en unos minutos."
                  : "No technical knowledge needed. Follow these steps on your Android phone and FIA'O will be ready in a few minutes."}
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <article className="rounded-2xl border p-6" style={{ backgroundColor: "var(--white)", borderColor: "var(--border-cream)" }}>
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold" style={{ backgroundColor: "#FFF4B8", color: "#8B6500" }}>01</span>
                  <Download className="h-6 w-6" style={{ color: "#B91C1C" }} />
                </div>
                <h3 className="mt-5 text-lg font-bold" style={{ color: "var(--text)" }}>
                  {es ? "Descarga FIA'O" : "Download FIA'O"}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {es
                    ? "Pulsa «Descargar APK» en la tarjeta de arriba. Espera a que termine la descarga; el archivo se guardará normalmente en Descargas."
                    : "Tap “Download APK” in the card above. Wait for the download to finish; the file is usually saved in Downloads."}
                </p>
              </article>

              <article className="rounded-2xl border p-6" style={{ backgroundColor: "var(--white)", borderColor: "var(--border-cream)" }}>
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold" style={{ backgroundColor: "#FFF4B8", color: "#8B6500" }}>02</span>
                  <FolderOpen className="h-6 w-6" style={{ color: "#B91C1C" }} />
                </div>
                <h3 className="mt-5 text-lg font-bold" style={{ color: "var(--text)" }}>
                  {es ? "Abre el archivo" : "Open the file"}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {es
                    ? "Cuando termine, toca la notificación de descarga. Si ya desapareció, abre Archivos o Mis archivos, entra en Descargas y selecciona el archivo de FIA'O."
                    : "When it finishes, tap the download notification. If it has disappeared, open Files, go to Downloads, and select the FIA'O file."}
                </p>
              </article>

              <article className="rounded-2xl border p-6" style={{ backgroundColor: "var(--white)", borderColor: "var(--border-cream)" }}>
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold" style={{ backgroundColor: "#FFF4B8", color: "#8B6500" }}>03</span>
                  <ShieldCheck className="h-6 w-6" style={{ color: "#B91C1C" }} />
                </div>
                <h3 className="mt-5 text-lg font-bold" style={{ color: "var(--text)" }}>
                  {es ? "Autoriza e instala" : "Allow and install"}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {es
                    ? "Si Android lo solicita, activa «Permitir desde esta fuente» para el navegador o la aplicación Archivos que abriste. Regresa, pulsa Instalar y espera."
                    : "If Android asks, enable “Allow from this source” for the browser or Files app you used. Go back, tap Install, and wait."}
                </p>
              </article>
            </div>

            <div className="mt-6 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-start" style={{ backgroundColor: "var(--white)", borderColor: "var(--border-cream)" }}>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "#E8F5E9", color: "#247A3D" }}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold" style={{ color: "var(--text)" }}>
                  {es ? "¡Listo! Ya puedes abrir FIA'O" : "That's it! You can now open FIA'O"}
                </h3>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {es
                    ? "Busca el icono de FIA'O en tu pantalla de aplicaciones e inicia sesión. Si activaste «Permitir desde esta fuente», puedes desactivarlo después desde los ajustes de Android."
                    : "Find the FIA'O icon in your apps and sign in. If you enabled “Allow from this source”, you can turn it off again in Android settings."}
                </p>
              </div>
            </div>

            <div className="mx-auto mt-6 max-w-3xl text-center">
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {es
                  ? "Importante: descarga FIA'O únicamente desde esta página oficial. No necesitas desactivar Play Protect ni permitir instalaciones para todas las aplicaciones. Los nombres de los menús pueden variar según la marca y versión de Android."
                  : "Important: only download FIA'O from this official page. You do not need to disable Play Protect or allow installs for every app. Menu names may vary by Android version and device brand."}
              </p>
            </div>
          </div>
        </section>

        <section id="preguntas" className="w-full scroll-mt-8" style={{ backgroundColor: "var(--surface-alt)" }}>
          <div className="mx-auto max-w-4xl px-6 py-14 sm:py-16">
            <div className="mb-9 text-center">
              <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--accent-text)" }}>{es ? "Resolvemos tus dudas" : "Good to know"}</span>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: "var(--text)", fontFamily: "Poppins" }}>
                {es ? "Preguntas frecuentes" : "Frequently asked questions"}
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq) => (
                <details key={faq.q} className="group rounded-2xl border p-5 open:shadow-sm" style={{ backgroundColor: "var(--white)", borderColor: "var(--border-cream)" }}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold" style={{ color: "var(--text)" }}>
                    <span>{faq.q}</span>
                    <ChevronDown className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-open:rotate-180" style={{ color: "var(--accent-text)" }} />
                  </summary>
                  <p className="mt-4 max-w-3xl pr-8 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full" style={{ backgroundColor: "#B91C1C" }}>
          <div className="mx-auto max-w-4xl px-6 py-14 text-center sm:py-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl" style={{ fontFamily: "Poppins" }}>
              {es ? "Haz que cada cuenta esté en su lugar" : "Keep every account in its place"}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
              {es
                ? "Organiza tus clientes, controla los fiados y lleva un registro más claro de tu negocio con FIA'O."
                : "Organize customers, track credit, and keep clearer business records with FIA'O."}
            </p>
            <Link
              to="/register"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold transition duration-200 hover:-translate-y-0.5"
              style={{ backgroundColor: "#F9D103", color: "#2D2926" }}
            >
              {es ? "Comenzar con FIA'O" : "Get started with FIA'O"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
