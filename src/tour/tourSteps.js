// El contenido del tutorial. Para cambiar un texto, edita estas líneas: no hace falta tocar nada más.
//
// Cada paso puede tener:
//   id           nombre único del paso
//   chapter      capítulo al que pertenece (sale como etiqueta en la tarjeta)
//   path         página donde ocurre (el tutorial navega solo hasta ahí)
//   target       cuál elemento se resalta: coincide con data-tour="..." en el código de la página
//   mobileTarget elemento alternativo en pantallas pequeñas (menos de 1024 px)
//   only         "desktop" = el paso solo se muestra en pantallas grandes
//   title, body  el texto. En body: **negrita** y una línea en blanco separa párrafos
//   mobileBody   texto alternativo en pantallas pequeñas
//   tip          consejo opcional (cuadro amarillo)
//   placement    "bottom" | "top" | "left" | "right" | "auto": dónde prefieres la tarjeta
//   before       { click: "id" } hace clic en un elemento antes de mostrar el paso (por ejemplo, una pestaña)
//   fallback     { target, title, body, graceMs } si el elemento no existe, se explica otro elemento en su lugar
//                (graceMs = cuánto esperar al principal; 0 si ambos salen juntos al terminar de cargar)
//   skipIfMissing  true = si el elemento no existe, el paso se salta
//   missingBody  texto para cuando el elemento no existe (se muestra en una tarjeta centrada)
//   type         "intro" | "outro": tarjetas centradas de inicio y de final

export const CHAPTERS = ["Welcome", "Navigation", "Dashboard", "Clients", "Credit", "Products", "Reports", "Profile", "Contact", "Done"];

export const TOUR_STEPS = [
  // ------------------------------------------------------------------ Welcome
  {
    id: "welcome",
    chapter: "Welcome",
    type: "intro",
    path: "/dashboard",
    title: "Welcome to FIA'O 👋",
    body:
      "This guided tour walks you through every screen: **what it shows** and **how to use it**. It takes about five minutes and you can leave at any moment.",
    tip: "You can replay it later with the ? button in the top bar, either the full tour or just the page you're on.",
    nativeTip: "You can replay it later from More (bottom right) or from Profile, either the full tour or just the page you're on.",
  },

  // --------------------------------------------------------------- Navigation
  {
    id: "nav-links",
    chapter: "Navigation",
    path: "/dashboard",
    target: "nav-links",
    mobileTarget: "nav-menu",
    placement: "bottom",
    title: "Your navigation bar",
    body:
      "Move between the main areas: **Home** (your dashboard), **Credit**, **Products**, **Clients**, **Reports** and **Contact**. The yellow tab is the page you're on.",
    mobileBody:
      "Open this menu to move between **Home**, **Credit**, **Products**, **Clients**, **Reports**, **Contact** and your **Profile**. The yellow option is the page you're on.",
    nativeBody:
      "Use this bar to move between **Home**, **Credit**, **Clients** and **Products**. **More** opens Reports, Contact, your Profile and settings. The yellow option is the page you're on.",
  },
  {
    id: "bell",
    chapter: "Navigation",
    path: "/dashboard",
    target: "bell",
    placement: "bottom",
    title: "Notifications",
    body:
      "The bell warns you about **overdue accounts** and **products running low**. The number is how many things need your attention. Tap it to see the list and jump straight to the problem.",
    tip: "You can turn the alerts off in Profile.",
  },
  {
    id: "theme-toggle",
    chapter: "Navigation",
    only: "desktop",
    path: "/dashboard",
    target: "theme-toggle",
    placement: "bottom",
    title: "Light or dark mode",
    body: "Switch the look of the app to whatever is easier on your eyes. FIA'O remembers your choice on this device.",
  },
  {
    id: "profile-link",
    chapter: "Navigation",
    only: "desktop",
    path: "/dashboard",
    target: "profile-link",
    placement: "bottom",
    title: "Your profile",
    body: "Your store details, credit rules, notifications and **Log out** live here. We'll visit it at the end of the tour.",
  },
  {
    id: "tour-button",
    chapter: "Navigation",
    only: "desktop",
    path: "/dashboard",
    target: "tour-button",
    placement: "bottom",
    title: "Replay this tour",
    body:
      "Click the **?** button whenever you want a refresher. You can replay the **full tour** or just the **page you're on**.",
  },

  // ---------------------------------------------------------------- Dashboard
  {
    id: "dash-stats",
    chapter: "Dashboard",
    path: "/dashboard",
    target: "dash-stats",
    placement: "bottom",
    title: "Your numbers at a glance",
    body:
      "**Outstanding Debt** is everything customers owe you right now. **Payments Today** adds up what you collected today. **Customers with Debt** and **Overdue** count the people behind those numbers.",
    tip: "They update by themselves every time you register a credit or a payment.",
  },
  {
    id: "dash-collect",
    chapter: "Dashboard",
    path: "/dashboard",
    target: "dash-collect",
    placement: "auto",
    title: "Who to collect",
    body:
      "Customers who owe you, with the **overdue** ones first and then the biggest debts. Click a name to go to **Clients** and send a reminder.",
  },
  {
    id: "dash-activity",
    chapter: "Dashboard",
    path: "/dashboard",
    target: "dash-activity",
    placement: "auto",
    title: "Recent activity",
    body: "The last credits and payments you registered, newest first, so you always know what happened today.",
  },
  {
    id: "dash-quick",
    chapter: "Dashboard",
    path: "/dashboard",
    target: "dash-quick",
    skipIfMissing: true, // en la app Android los accesos están en la barra inferior
    placement: "top",
    title: "Quick access",
    body:
      "Shortcuts to every area, with live hints such as how many accounts are **overdue** or how many products are **running low**.",
  },

  // ------------------------------------------------------------------ Clients
  {
    id: "clients-new",
    chapter: "Clients",
    path: "/clients",
    target: "clients-new",
    placement: "bottom",
    title: "Add a customer",
    body:
      "Start here. You only need a **name**; add a **phone number** to send WhatsApp reminders. You can also give a customer their own **credit limit**: leave it empty to use your default.",
  },
  {
    id: "clients-search",
    chapter: "Clients",
    path: "/clients",
    target: "clients-search",
    placement: "bottom",
    title: "Find anyone fast",
    body: "Search by **name** or by **phone number**. The list updates as you type.",
  },
  {
    id: "clients-filters",
    chapter: "Clients",
    path: "/clients",
    target: "clients-filters",
    placement: "bottom",
    title: "Filter by status",
    body:
      "**All** shows everyone. **On Time** means no debt, **Pending** means they owe but nothing is late, and **Overdue** means they owe past the due date.",
  },
  {
    id: "clients-table",
    chapter: "Clients",
    path: "/clients",
    target: "clients-table",
    fallback: {
      target: "clients-main",
      title: "Your customers will appear here",
      body:
        "Once you add customers, you'll see a table with each one's **purchases**, **pending debt** and **status**. Click **View detail** on any row to edit or archive them.",
    },
    placement: "top",
    title: "Every customer at a glance",
    body:
      "See each customer's **purchases**, **pending debt** and **status**. Click **View detail** to edit their data or archive them.",
    tip: "A customer who still owes money can't be archived. Register their payment first.",
  },
  {
    id: "clients-reminder",
    chapter: "Clients",
    path: "/clients",
    target: "clients-reminder",
    placement: "top",
    title: "Payment reminders",
    body:
      "When someone owes you, FIA'O prepares a friendly **WhatsApp message** with their name, the amount and your store name. Review it, press the button and WhatsApp opens with the message ready: you just hit send.",
    missingBody:
      "Nobody owes you right now, so there is nothing to remind. When a customer owes money, a **reminder card** appears here with a ready-to-send WhatsApp message.",
  },
  {
    id: "clients-collections",
    chapter: "Clients",
    path: "/clients",
    target: "clients-collections",
    placement: "left",
    title: "Friendly Collections",
    body: "The customers who most need a nudge: **overdue** first, then the biggest debts. Click one to prepare their reminder.",
  },

  // ------------------------------------------------------------------- Credit
  {
    id: "credit-customer",
    chapter: "Credit",
    path: "/credit",
    target: "credit-customer",
    fallback: {
      target: "credit-empty",
      graceMs: 0, // credit-empty y credit-customer salen juntos al terminar de cargar: no hace falta esperar
      title: "Add your first customer",
      body:
        "This page works customer by customer. Add your first customer in **Clients** and come back: you'll see their debt, their history and the forms to register credits and payments.",
    },
    placement: "right",
    title: "Choose a customer",
    body:
      "Everything on this page works for the customer you pick here: their **debt**, their **history** and the forms to register **credits** and **payments**.",
  },
  {
    id: "credit-card",
    chapter: "Credit",
    path: "/credit",
    target: "credit-card",
    skipIfMissing: true,
    placement: "right",
    title: "Debt and credit limit",
    body:
      "See what the customer **owes**, their **limit** and how much of it they've used. If part of the debt is overdue, a red note tells you how much.",
  },
  {
    id: "credit-block",
    chapter: "Credit",
    path: "/credit",
    target: "credit-block",
    skipIfMissing: true,
    placement: "right",
    title: "Automatic blocking",
    body:
      "When it's on, FIA'O **rejects any new credit** that would take the customer over their limit. It's the same switch you'll find in Profile.",
    tip: "The rule is also enforced by the database, not just on screen.",
  },
  {
    id: "credit-history",
    chapter: "Credit",
    path: "/credit",
    target: "credit-history",
    skipIfMissing: true,
    placement: "auto",
    title: "Debt history",
    body:
      "Every credit and payment, newest first. **Payments cover the oldest credit first.** Each credit shows **Paid**, **Pending** or **Overdue**, with its due date.",
    tip: "Entries can't be edited or deleted. If you make a mistake, register a new entry to fix it: that keeps your notebook trustworthy.",
  },
  {
    id: "credit-new",
    chapter: "Credit",
    path: "/credit",
    target: "credit-new",
    skipIfMissing: true,
    placement: "auto",
    title: "Register a credit (fiado)",
    body:
      "Enter the **amount** and, if you like, **what the customer took**. Leave the due date empty to use your default days to pay.",
    tip: "You can also sell on credit straight from your inventory in **Products**.",
  },
  {
    id: "credit-payment",
    chapter: "Credit",
    path: "/credit",
    target: "credit-payment",
    skipIfMissing: true,
    placement: "auto",
    title: "Register a payment",
    body:
      "Choose **Partial** to enter any amount, or **Full** to pay everything. **Mark as Paid** settles the whole debt in one click. A payment can never be higher than what the customer owes.",
  },
  {
    id: "credit-side",
    chapter: "Credit",
    path: "/credit",
    target: "credit-side",
    skipIfMissing: true,
    placement: "left",
    title: "Activity and overview",
    body:
      "The latest movements of **all** your customers and a summary of your outstanding debt, today's payments, customers with debt and overdue accounts.",
  },

  // ----------------------------------------------------------------- Products
  {
    id: "products-tabs",
    chapter: "Products",
    path: "/products",
    target: "products-tabs",
    before: { click: "products-tab-inventory" },
    placement: "bottom",
    title: "Two tabs",
    body:
      "**Inventory** is where you manage your products. **Register Fiado Sale** lets you sell on credit straight from the inventory.",
  },
  {
    id: "products-search",
    chapter: "Products",
    path: "/products",
    target: "products-search",
    before: { click: "products-tab-inventory" },
    placement: "bottom",
    title: "Search",
    body: "Look up products by **name** or **category**. The search works in both tabs.",
  },
  {
    id: "products-grid",
    chapter: "Products",
    path: "/products",
    target: "products-grid",
    before: { click: "products-tab-inventory" },
    placement: "top",
    title: "Your inventory",
    body:
      "Each card shows the **price** and the **stock**. When a product reaches its alert level it turns **red** and a yellow warning appears at the top. **Edit** changes the details; **Remove** takes it out of your inventory but keeps past sales.",
    tip: "Low stock also shows in the bell and on the dashboard.",
  },
  {
    id: "products-add",
    chapter: "Products",
    path: "/products",
    target: "products-add",
    before: { click: "products-tab-inventory" },
    placement: "top",
    title: "Add a product",
    body:
      "Set the **name**, **category**, **price**, how it's sold (unit, lb, kg…), the **stock** and the level where you want to be warned. You can paste an image link if you like.",
  },
  {
    id: "products-sale",
    chapter: "Products",
    path: "/products",
    target: "products-content",
    before: { click: "products-tab-fiado" },
    placement: "bottom",
    title: "Sell on credit from your inventory",
    body:
      "Pick the **customer**, add products with **+** and **−**, and the total is calculated from your prices. One tap registers the debt **and** lowers the stock. If something fails (not enough stock or the limit is exceeded) **nothing is saved**.",
  },

  // ------------------------------------------------------------------ Reports
  {
    id: "reports-filters",
    chapter: "Reports",
    path: "/reports",
    target: "reports-filters",
    placement: "bottom",
    title: "Choose what to analyze",
    body:
      "Pick a ready-made **period** or set your own dates, and optionally focus on **one customer** or a **status**. Press **Apply Filters** to update everything on the page.",
  },
  {
    id: "reports-cards",
    chapter: "Reports",
    path: "/reports",
    target: "reports-cards",
    placement: "bottom",
    title: "Key numbers",
    body:
      "**Total active credit** is what customers owe today. **Collected** shows payments received compared with the previous period. **Pending balances** is debt that isn't late yet, plus how many accounts are overdue. **Total customers** shows how many you have and how many are new.",
  },
  {
    id: "reports-chart",
    chapter: "Reports",
    path: "/reports",
    target: "reports-chart",
    placement: "auto",
    title: "Credit and payments over time",
    body:
      "Bars compare the **credit you issued**, the **payments you received** and the **overdue** amounts, week by week (month by month for long periods).",
  },
  {
    id: "reports-status",
    chapter: "Reports",
    path: "/reports",
    target: "reports-status",
    placement: "auto",
    title: "Credit status",
    body: "Of the credit issued in the period, how much has been **paid**, is still **pending** or is already **overdue**.",
  },
  {
    id: "reports-table",
    chapter: "Reports",
    path: "/reports",
    target: "reports-table",
    placement: "top",
    title: "Every transaction",
    body: "A paginated list of all credits and payments in the period. **Payments** are shown with a minus sign.",
  },
  {
    id: "reports-export",
    chapter: "Reports",
    path: "/reports",
    target: "reports-export",
    placement: "bottom",
    title: "Export your reports",
    body: "Download exactly what you're seeing as an **Excel** file or a **PDF**: perfect for your records or your accountant.",
  },

  // ------------------------------------------------------------------ Profile
  {
    id: "profile-info",
    chapter: "Profile",
    path: "/profile",
    target: "profile-info",
    placement: "bottom",
    title: "Business information",
    body:
      "Your name, **store name**, phone, RUC and address. The store name appears in the reminders you send to customers, so keep it up to date.",
  },
  {
    id: "profile-rules",
    chapter: "Profile",
    path: "/profile",
    target: "profile-rules",
    placement: "auto",
    title: "Credit rules",
    body:
      "Set the **default credit limit**, how many **days to pay** customers have and whether **automatic blocking** is on. They apply to every customer who doesn't have their own limit.",
  },
  {
    id: "profile-account",
    chapter: "Profile",
    path: "/profile",
    target: "profile-account",
    placement: "top",
    title: "Account and notifications",
    body:
      "Turn the **notifications bell** on or off, replay this tour, and **log out** when you're done on a shared device.",
  },

  // ------------------------------------------------------------------ Contact
  {
    id: "contact-faq",
    chapter: "Contact",
    path: "/contact",
    target: "contact-faq",
    placement: "right",
    title: "Quick answers",
    body: "Common questions about how FIA'O works, answered honestly, including what it can't do yet.",
  },
  {
    id: "contact-form",
    chapter: "Contact",
    path: "/contact",
    target: "contact-form",
    placement: "left",
    title: "Talk to us",
    body: "Send a message with questions or ideas. Your **name** and **email** are filled in for you, and we reply by email.",
  },

  // --------------------------------------------------------------------- Done
  {
    id: "done",
    chapter: "Done",
    type: "outro",
    path: "/dashboard",
    title: "You're ready to go 🎉",
    body:
      "A simple routine:\n\n**1.** Add your customers.\n\n**2.** Register credits and payments as they happen.\n\n**3.** Check the dashboard every day to see who to collect.",
    tip: "Replay the tour any time with the ? button in the top bar.",
    nativeTip: "Replay the tour any time from More.",
  },
];
