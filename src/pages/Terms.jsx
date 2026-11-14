import React from "react";
import LegalPageLayout from "@/components/LegalPageLayout";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Terms() {
  const { language } = useLanguage();
  const es = language === "es";

  const sections = es
    ? [
        {
          heading: "Sobre FIA'O",
          paragraphs: [
            "FIA'O es una herramienta digital en desarrollo para que pequeños negocios organicen clientes, fiados, pagos, productos, inventario e informes. Puede utilizarse mediante la web y una aplicación Android distribuida como APK cuando exista una versión publicada.",
            "Al acceder o utilizar el servicio, aceptas utilizarlo de acuerdo con estas condiciones y con la legislación aplicable. Si no estás de acuerdo, deja de utilizarlo."
          ]
        },
        {
          heading: "Cuenta y uso responsable",
          bullets: [
            "Proporciona información correcta y mantén actualizado el correo y los datos de tu negocio.",
            "Protege tu contraseña, tu dispositivo y los medios de acceso a tu cuenta. Eres responsable de la actividad realizada desde una sesión abierta.",
            "No intentes acceder a cuentas o información de otras personas, interferir con el servicio ni utilizar FIA'O para actividades ilegales.",
            "Introduce únicamente datos de clientes que estés autorizado a gestionar y evita guardar información sensible que no sea necesaria."
          ]
        },
        {
          heading: "Funciones y límites del servicio",
          paragraphs: [
            "FIA'O permite registrar clientes, fiados, abonos, productos y movimientos; calcular saldos; consultar alertas e informes; y exportar reportes a Excel o PDF. Algunas reglas, como límites de crédito y bloqueo automático, dependen de la configuración que establezcas.",
            "FIA'O es una herramienta de registro y organización. No es una entidad financiera, no concede préstamos, no procesa pagos ni sustituye asesoría contable, financiera o legal. La exactitud de los saldos y reportes depende de la calidad y actualización de los datos que introduces."
          ]
        },
        {
          heading: "Recordatorios y servicios externos",
          paragraphs: [
            "Los recordatorios por WhatsApp se preparan para que tú revises el texto y decidas enviarlo desde WhatsApp. FIA'O no envía automáticamente mensajes ni confirma que el destinatario los haya recibido o leído. El uso de WhatsApp queda sujeto a los términos y políticas de ese proveedor.",
            "Google, Supabase y otros proveedores externos pueden aplicar sus propias condiciones cuando utilices las funciones que dependen de sus servicios."
          ]
        },
        {
          heading: "Aplicación Android y archivo APK",
          paragraphs: [
            "La aplicación Android comparte funciones con la versión web y añade capacidades específicas, como almacenamiento local y sincronización de cambios pendientes cuando vuelve la conexión. Los cambios sin sincronizar pueden quedar pendientes o requerir revisión.",
            "Descarga e instala únicamente archivos APK disponibles mediante enlaces oficiales de FIA'O. No instales archivos modificados o recibidos de fuentes desconocidas. Android puede mostrar advertencias o solicitar autorización para instalar una aplicación desde esa fuente.",
            "Las actualizaciones pueden requerir instalar una versión más reciente. La posibilidad de conservar los datos al actualizar depende, entre otros factores, de instalar una versión oficial firmada correctamente."
          ]
        },
        {
          heading: "Tus datos y los datos de tus clientes",
          paragraphs: [
            "Conservas la responsabilidad sobre los datos que introduces en FIA'O, incluidos los registros de terceros. Debes asegurarte de contar con el permiso o fundamento necesario para recopilarlos y utilizarlos en tu negocio, y de no introducir información engañosa, ilícita o que no estés autorizado a gestionar.",
            "La Política de privacidad explica cómo se trata la información. Al utilizar FIA'O, te comprometes a respetar esa política y a no utilizar la aplicación para enviar comunicaciones no deseadas o realizar prácticas abusivas."
          ]
        },
        {
          heading: "Disponibilidad, cambios y suspensión",
          paragraphs: [
            "FIA'O está en desarrollo y puede contener errores, interrupciones o funciones que cambien. Podemos modificar, retirar o suspender funciones para mantener, mejorar o proteger el servicio. Procuraremos informar los cambios relevantes cuando sea razonablemente posible.",
            "Podemos limitar o suspender el acceso cuando exista un uso abusivo, un riesgo de seguridad, una obligación legal o una conducta que ponga en peligro el servicio o a otras personas."
          ]
        },
        {
          heading: "Propiedad intelectual",
          paragraphs: [
            "La marca FIA'O, sus logotipos, diseño, textos y componentes de software pertenecen a sus respectivos titulares. Estas condiciones te permiten utilizar el servicio para tu actividad, pero no transfieren la propiedad del software ni autorizan a copiar, revender o distribuir versiones modificadas sin permiso."
          ]
        },
        {
          heading: "Responsabilidad y recomendaciones",
          paragraphs: [
            "Utiliza los informes de FIA'O como apoyo para llevar tus registros, no como sustituto de tus libros contables, comprobantes o asesoría profesional. Verifica los datos importantes y conserva los comprobantes que necesites para tu negocio.",
            "En la medida permitida por la ley, FIA'O no garantiza que el servicio esté disponible sin interrupciones ni que sea adecuado para todos los procesos de cada negocio. Nada de estas condiciones elimina derechos que la legislación aplicable no permita excluir."
          ]
        },
        {
          heading: "Cambios a estas condiciones y ley aplicable",
          paragraphs: [
            "Estas condiciones pueden actualizarse cuando cambie el servicio o sus requisitos. La fecha de revisión se mostrará en esta página. El uso continuado después de una actualización indica que conoces la nueva versión, sin perjuicio de los requisitos legales que correspondan.",
            "Estas condiciones se interpretan conforme a las leyes de la República de Panamá, sin perjuicio de las normas imperativas que puedan resultar aplicables."
          ]
        }
      ]
    : [
        {
          heading: "About FIA'O",
          paragraphs: [
            "FIA'O is a digital tool in development that helps small businesses organize customers, credit, payments, products, inventory, and reports. It can be used through the website and an Android app distributed as an APK when a release is published.",
            "By accessing or using the service, you agree to use it in accordance with these terms and applicable law. If you do not agree, stop using it."
          ]
        },
        {
          heading: "Your account and responsible use",
          bullets: [
            "Provide accurate information and keep your email and business details up to date.",
            "Protect your password, device, and account access methods. You are responsible for activity performed through an active session.",
            "Do not attempt to access other people's accounts or information, interfere with the service, or use FIA'O for illegal activities.",
            "Only enter customer data you are authorized to manage, and avoid storing sensitive information that is not needed."
          ]
        },
        {
          heading: "Features and service limitations",
          paragraphs: [
            "FIA'O lets you record customers, credit, payments, products, and transactions; calculate balances; review alerts and reports; and export reports to Excel or PDF. Some rules, such as credit limits and automatic blocking, depend on your settings.",
            "FIA'O is a record-keeping and organization tool. It is not a financial institution, does not provide loans, does not process payments, and does not replace accounting, financial, or legal advice. The accuracy of balances and reports depends on the quality and freshness of the information you enter."
          ]
        },
        {
          heading: "Reminders and third-party services",
          paragraphs: [
            "WhatsApp reminders are prepared so you can review the text and decide whether to send it through WhatsApp. FIA'O does not automatically send messages or confirm that a recipient received or read them. WhatsApp use is subject to that provider's terms and policies.",
            "Google, Supabase, and other third-party providers may apply their own terms when you use features that rely on their services."
          ]
        },
        {
          heading: "Android app and APK file",
          paragraphs: [
            "The Android app shares features with the web version and adds app-specific capabilities, such as local storage and syncing pending changes when connectivity returns. Unsynced changes may remain pending or need review.",
            "Only download and install APK files made available through official FIA'O links. Do not install modified files or files received from unknown sources. Android may display warnings or ask you to authorize installation from that source.",
            "Updates may require installing a newer version. Keeping data when updating depends, among other things, on installing an official version signed correctly."
          ]
        },
        {
          heading: "Your data and your customers' data",
          paragraphs: [
            "You remain responsible for the information you enter into FIA'O, including records about other people. Make sure you have the necessary permission or legal basis to collect and use it for your business, and do not enter misleading, unlawful, or unauthorized information.",
            "The Privacy Policy explains how information is handled. By using FIA'O, you agree to respect that policy and not use the app to send unwanted communications or engage in abusive practices."
          ]
        },
        {
          heading: "Availability, changes, and suspension",
          paragraphs: [
            "FIA'O is in development and may contain errors, interruptions, or features that change. We may modify, remove, or suspend features to maintain, improve, or protect the service. We will try to communicate significant changes when reasonably possible.",
            "We may restrict or suspend access when there is abusive use, a security risk, a legal requirement, or conduct that endangers the service or other people."
          ]
        },
        {
          heading: "Intellectual property",
          paragraphs: [
            "The FIA'O brand, logos, design, text, and software components belong to their respective owners. These terms allow you to use the service for your business, but do not transfer ownership of the software or authorize you to copy, resell, or distribute modified versions without permission."
          ]
        },
        {
          heading: "Liability and recommendations",
          paragraphs: [
            "Use FIA'O reports as support for your records, not as a replacement for accounting books, receipts, or professional advice. Verify important information and keep the documents your business needs.",
            "To the extent allowed by law, FIA'O does not guarantee uninterrupted availability or suitability for every business process. Nothing in these terms removes rights that applicable law does not allow to be excluded."
          ]
        },
        {
          heading: "Changes to these terms and applicable law",
          paragraphs: [
            "These terms may be updated when the service or its requirements change. The revision date will appear on this page. Continued use after an update means you are aware of the new version, subject to any legal requirements that apply.",
            "These terms are interpreted under the laws of the Republic of Panama, without prejudice to mandatory rules that may apply."
          ]
        }
      ];

  return (
    <LegalPageLayout
      title={es ? "Términos y condiciones" : "Terms and conditions"}
      updated={es ? "Última actualización: 14 de noviembre de 2026" : "Last updated: November 14, 2026"}
      intro={es
        ? "Estas condiciones describen las reglas básicas para utilizar FIA'O desde la web y la aplicación Android."
        : "These terms describe the basic rules for using FIA'O through the website and Android app."}
      notice={es
        ? "FIA'O sigue en desarrollo. Este texto es un borrador informativo para el prototipo y debe revisarse con asesoría jurídica antes de ofrecer el servicio comercialmente."
        : "FIA'O is still in development. This is an informational draft for the prototype and should be reviewed by legal counsel before the service is offered commercially."}
      sections={sections}
    />
  );
}
