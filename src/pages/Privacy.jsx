import React from "react";
import LegalPageLayout from "@/components/LegalPageLayout";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Privacy() {
  const { language } = useLanguage();
  const es = language === "es";

  const sections = es
    ? [
        {
          heading: "Quién utiliza y gestiona la información",
          paragraphs: [
            "FIA'O es un proyecto de software en desarrollo para ayudar a pequeños negocios a organizar clientes, fiados, pagos, productos e informes. La persona que crea una cuenta y administra un comercio decide qué información de sus clientes introduce y con qué finalidad la utiliza en su negocio. FIA'O procesa esa información para ofrecer las funciones de la aplicación.",
            "El equipo responsable del proyecto debe completar y validar su identificación legal y los datos formales de contacto antes de un lanzamiento comercial. Mientras tanto, las consultas sobre privacidad pueden enviarse desde el formulario de Contacto."
          ]
        },
        {
          heading: "Qué información puede tratar FIA'O",
          paragraphs: ["La información depende de las funciones que utilices y de los datos que decidas introducir. Puede incluir:"],
          bullets: [
            "Cuenta: nombre, correo electrónico y datos técnicos necesarios para iniciar sesión, verificar la cuenta o recuperar la contraseña.",
            "Información del comercio: nombre del negocio y, si los proporcionas, teléfono, dirección, RUC y reglas de crédito.",
            "Clientes: nombre, teléfono y límite de crédito asignado.",
            "Movimientos: importes, fechas, vencimientos, conceptos de fiados, pagos y saldos calculados a partir de esos movimientos.",
            "Productos e inventario: nombres, categorías, precios, unidades, existencias, niveles mínimos e imágenes o enlaces que agregues.",
            "Contacto: nombre, correo electrónico y contenido del mensaje que envías mediante el formulario de la web."
          ]
        },
        {
          heading: "Para qué se utiliza",
          bullets: [
            "Crear y proteger cuentas, permitir el acceso y recuperar contraseñas.",
            "Registrar clientes, fiados, pagos, productos e inventario; calcular saldos y mostrar el historial.",
            "Presentar alertas, paneles e informes, y permitir exportaciones a Excel o PDF.",
            "Preparar, cuando tú lo solicites, un mensaje de recordatorio para abrirlo en WhatsApp.",
            "Mantener la experiencia de la aplicación Android, guardar cambios pendientes sin conexión y sincronizarlos cuando vuelve internet.",
            "Responder consultas que envíes mediante el formulario de Contacto y mantener la aplicación operativa."
          ]
        },
        {
          heading: "WhatsApp y otros servicios externos",
          paragraphs: [
            "Los recordatorios de cobro no se envían automáticamente. Cuando eliges abrir un recordatorio, FIA'O prepara un enlace a WhatsApp con el número y el texto correspondiente. Tú revisas el mensaje y decides si lo envías. Al abrir ese enlace, WhatsApp procesa la información conforme a sus propias condiciones y políticas.",
            "La autenticación, la base de datos y el almacenamiento de archivos utilizan servicios de Supabase. El inicio de sesión con Google puede estar disponible si se habilita en la configuración. La web también solicita la tipografía Poppins a Google Fonts. Estos proveedores procesan los datos técnicos necesarios para prestar sus servicios y se rigen por sus propias políticas."
          ]
        },
        {
          heading: "Almacenamiento y funcionamiento sin conexión",
          paragraphs: [
            "La información principal de la cuenta se guarda en la infraestructura de Supabase configurada para el proyecto. La aplicación Android puede conservar en el dispositivo una copia local de determinados datos y una cola de cambios pendientes para permitir el trabajo sin conexión. Al recuperar la conexión, esos cambios se envían para sincronización; algunos conflictos pueden requerir revisión.",
            "La preferencia de idioma se guarda localmente en el navegador o dispositivo. La versión web requiere conexión a internet y no ofrece el modo de escritura sin conexión de Android."
          ]
        },
        {
          heading: "Con quién se comparte",
          paragraphs: [
            "FIA'O no vende la información personal de los usuarios ni la utiliza para crear perfiles publicitarios. Los datos se comparten con los proveedores tecnológicos descritos en esta política solo en la medida necesaria para operar las funciones que utilizas, cuando tú ordenas abrir WhatsApp, o cuando una obligación legal válida lo requiera.",
            "No publiques en FIA'O números de tarjetas, contraseñas de otros servicios ni información especialmente sensible que no sea necesaria para administrar tu negocio."
          ]
        },
        {
          heading: "Protección y responsabilidad sobre los datos de clientes",
          paragraphs: [
            "El esquema de datos del proyecto utiliza controles de acceso por propietario mediante Row Level Security (RLS) de Supabase. La protección efectiva también depende de que la configuración del proyecto, las credenciales y los permisos se mantengan correctamente. Ningún servicio conectado a internet puede prometer seguridad absoluta.",
            "Si registras información de tus clientes, eres responsable de contar con la autorización o fundamento que corresponda, informarles sobre el uso que haces de sus datos y limitarte a introducir información necesaria para tu actividad."
          ]
        },
        {
          heading: "Conservación, acceso y solicitudes",
          paragraphs: [
            "La información se conserva mientras sea necesaria para prestar las funciones, mantener el historial de la cuenta y atender responsabilidades aplicables. Puedes solicitar información sobre los datos asociados a tu cuenta, pedir su corrección o plantear una solicitud de eliminación u oposición mediante el formulario de Contacto. FIA'O podrá pedir datos razonables para verificar que la solicitud procede de la persona adecuada y explicará si existe algún motivo legítimo para conservar determinados registros.",
            "Las solicitudes se analizarán conforme a los derechos y procedimientos que resulten aplicables en Panamá, incluidos los previstos en la Ley 81 de 26 de marzo de 2019 y su reglamentación."
          ],
          links: [
            { label: "Ley 81 de 2019 — Procuraduría de la Administración", href: "https://infojuridica.procuraduria-admon.gob.pa/norma_screen?numsec=52898" },
            { label: "Decreto Ejecutivo 285 de 2021 — Gaceta Oficial Digital", href: "https://www.gacetaoficial.gob.pa/storage/gacetas/2021/05/29296_A/85281.pdf" }
          ]
        },
        {
          heading: "Cambios a esta política",
          paragraphs: [
            "Esta política puede actualizarse cuando cambien las funciones, los proveedores o las prácticas de tratamiento de información. La fecha de actualización se mostrará al inicio de la página. Cuando un cambio sea relevante, FIA'O procurará comunicarlo por los medios disponibles."
          ]
        }
      ]
    : [
        {
          heading: "Who uses and manages the information",
          paragraphs: [
            "FIA'O is a software project in development that helps small businesses organize customers, credit, payments, products, and reports. The person who creates an account and manages a store decides what customer information to enter and how to use it for their business. FIA'O processes that information to provide the application's features.",
            "The project team must complete and verify its legal identity and formal contact details before a commercial launch. Until then, privacy questions can be sent through the Contact form."
          ]
        },
        {
          heading: "What information FIA'O may process",
          paragraphs: ["The information depends on the features you use and the data you choose to enter. It may include:"],
          bullets: [
            "Account: name, email address, and technical information needed to sign in, verify an account, or reset a password.",
            "Business profile: store name and, if provided, phone number, address, tax ID (RUC), and credit rules.",
            "Customers: names, phone numbers, and assigned credit limits.",
            "Transactions: amounts, dates, due dates, credit and payment descriptions, and balances calculated from those entries.",
            "Products and inventory: names, categories, prices, units, stock quantities, minimum stock levels, and images or links you add.",
            "Contact: your name, email address, and the content of messages sent through the website form."
          ]
        },
        {
          heading: "How the information is used",
          bullets: [
            "Create and protect accounts, provide sign-in, and help reset passwords.",
            "Record customers, credit, payments, products, and inventory; calculate balances and show transaction history.",
            "Display alerts, dashboards, and reports, and enable Excel or PDF exports.",
            "Prepare a reminder message for WhatsApp when you request one.",
            "Support the Android app, store pending changes offline, and sync them when internet access returns.",
            "Reply to messages sent through the Contact form and keep the application running."
          ]
        },
        {
          heading: "WhatsApp and other third-party services",
          paragraphs: [
            "Payment reminders are not sent automatically. When you choose to open a reminder, FIA'O prepares a WhatsApp link with the relevant number and message text. You review the message and decide whether to send it. Once you open that link, WhatsApp processes the information under its own terms and policies.",
            "Authentication, the database, and file storage use Supabase services. Google sign-in may be available when enabled in the configuration. The website also requests the Poppins typeface from Google Fonts. These providers process the technical information needed to deliver their services and are subject to their own policies."
          ]
        },
        {
          heading: "Storage and offline use",
          paragraphs: [
            "Core account information is stored in the Supabase infrastructure configured for the project. The Android app may keep a local copy of certain data and a queue of pending changes on the device so you can work offline. When the connection returns, those changes are submitted for synchronization; some conflicts may need review.",
            "Your language preference is stored locally in your browser or device. The web version requires internet access and does not provide Android's offline writing mode."
          ]
        },
        {
          heading: "Who information is shared with",
          paragraphs: [
            "FIA'O does not sell users' personal information or use it to build advertising profiles. Information is shared with the technology providers described in this policy only as needed to operate the features you use, when you choose to open WhatsApp, or when a valid legal obligation requires it.",
            "Do not enter payment card numbers, passwords for other services, or particularly sensitive information that is not needed to manage your business."
          ]
        },
        {
          heading: "Security and responsibility for customer data",
          paragraphs: [
            "The project's data schema uses owner-based access controls through Supabase Row Level Security (RLS). Effective protection also depends on the project configuration, credentials, and permissions being maintained correctly. No internet-connected service can promise absolute security.",
            "When you record customer information, you are responsible for having the appropriate authorization or legal basis, informing customers about how you use their data, and entering only information needed for your business."
          ]
        },
        {
          heading: "Retention, access, and requests",
          paragraphs: [
            "Information is kept for as long as needed to provide the features, maintain account history, and meet applicable responsibilities. You can ask about information associated with your account, request a correction, or submit an erasure or objection request through the Contact form. FIA'O may ask for reasonable information to verify that a request comes from the appropriate person and will explain if there is a legitimate reason to retain certain records.",
            "Requests will be considered under the rights and procedures that apply in Panama, including those established by Law 81 of March 26, 2019 and its regulations."
          ],
          links: [
            { label: "Law 81 of 2019 — Procuraduría de la Administración", href: "https://infojuridica.procuraduria-admon.gob.pa/norma_screen?numsec=52898" },
            { label: "Executive Decree 285 of 2021 — Official Gazette", href: "https://www.gacetaoficial.gob.pa/storage/gacetas/2021/05/29296_A/85281.pdf" }
          ]
        },
        {
          heading: "Changes to this policy",
          paragraphs: [
            "This policy may be updated when features, providers, or information-handling practices change. The update date will appear at the top of the page. FIA'O will try to communicate significant changes through the channels available."
          ]
        }
      ];

  return (
    <LegalPageLayout
      title={es ? "Política de privacidad" : "Privacy policy"}
      updated={es ? "Última actualización: 14 de noviembre de 2026" : "Last updated: November 14, 2026"}
      intro={es
        ? "Aquí explicamos qué información puede utilizar FIA'O, para qué se emplea y qué opciones tienes al usar la web y la aplicación Android."
        : "This page explains what information FIA'O may use, why it is used, and what options you have when using the website and Android app."}
      notice={es
        ? "FIA'O sigue en desarrollo. Este texto es una base informativa basada en las funciones actuales; debe revisarse con asesoría jurídica y completarse con la identificación legal del responsable antes de un lanzamiento comercial."
        : "FIA'O is still in development. This text is an informational draft based on current features; it should be reviewed by legal counsel and completed with the controller's legal identity before a commercial launch."}
      sections={sections}
    />
  );
}
