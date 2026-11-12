// Textos del recorrido en español. El contenido original de tourSteps.js se mantiene en inglés.
export const TOUR_UI = {
  en: {
    guidedTour: "Guided tour",
    pageTour: "Tour of this page",
    pageTourDescription: "Just the screen you're on",
    fullTour: "Full tour",
    fullTourDescription: "Every screen, about 5 minutes",
    profileDescription: "A step-by-step walkthrough of every screen.",
    startTour: "Start tour",
    maybeLater: "Maybe later",
    skipTour: "Skip tour",
    back: "Back",
    next: "Next",
    finish: "Finish",
    closeTour: "Close tour",
    loading: "Loading…",
    stepOf: (index, total) => `Step ${index} of ${total}`,
  },
  es: {
    guidedTour: "Recorrido guiado",
    pageTour: "Recorrido de esta página",
    pageTourDescription: "Solo esta pantalla",
    fullTour: "Recorrido completo",
    fullTourDescription: "Todas las secciones, unos 5 minutos",
    profileDescription: "Una guía paso a paso por cada sección de FIA'O.",
    startTour: "Iniciar recorrido",
    maybeLater: "Quizás después",
    skipTour: "Saltar recorrido",
    back: "Anterior",
    next: "Siguiente",
    finish: "Finalizar",
    closeTour: "Cerrar recorrido",
    loading: "Cargando…",
    stepOf: (index, total) => `Paso ${index} de ${total}`,
  },
};

const CHAPTERS_ES = {
  Welcome: "Bienvenida",
  Navigation: "Navegación",
  Dashboard: "Panel principal",
  Clients: "Clientes",
  Credit: "Créditos",
  Products: "Productos",
  Reports: "Informes",
  Profile: "Perfil",
  Contact: "Contacto",
  Done: "Final",
};

const STEPS_ES = {
  welcome: {
    title: "¡Te damos la bienvenida a FIA'O! 👋",
    body: "Este recorrido guiado te muestra cada pantalla: **qué contiene** y **cómo utilizarla**. Dura unos cinco minutos y puedes salir cuando quieras.",
    tip: "Puedes repetirlo cuando quieras desde el botón ? de la barra superior, ya sea completo o solo para la página actual.",
    nativeTip: "Puedes repetirlo cuando quieras desde Más (abajo a la derecha) o desde Perfil, ya sea completo o solo para la página actual.",
  },
  "nav-links": {
    title: "Barra de navegación",
    body: "Desde aquí puedes entrar a las secciones principales: **Inicio** (tu panel), **Créditos**, **Productos**, **Clientes**, **Informes** y **Contacto**. La pestaña amarilla indica dónde estás.",
    mobileBody: "Abre este menú para ir a **Inicio**, **Créditos**, **Productos**, **Clientes**, **Informes**, **Contacto** y tu **Perfil**. La opción amarilla indica la página actual.",
    nativeBody: "Con esta barra te mueves entre **Inicio**, **Créditos**, **Clientes** y **Productos**. **Más** abre Informes, Contacto, tu Perfil y los ajustes. La opción amarilla indica la página actual.",
  },
  bell: {
    title: "Notificaciones",
    body: "La campana te avisa sobre **cuentas vencidas** y **productos con pocas existencias**. El número indica cuántos asuntos requieren tu atención. Tócala para ver la lista e ir directamente al problema.",
    tip: "Puedes desactivar las alertas desde Perfil.",
  },
  "theme-toggle": {
    title: "Modo claro u oscuro",
    body: "Cambia la apariencia de la aplicación según te resulte más cómoda. FIA'O recuerda tu elección en este dispositivo.",
  },
  "profile-link": {
    title: "Tu perfil",
    body: "Aquí están los datos de tu negocio, las reglas de crédito, las notificaciones y la opción para **cerrar sesión**. Visitaremos esta sección al final del recorrido.",
  },
  "tour-button": {
    title: "Repetir este recorrido",
    body: "Pulsa el botón **?** cuando necesites una guía. Puedes repetir el **recorrido completo** o solo el de **la página actual**.",
  },
  "dash-stats": {
    title: "Tus números de un vistazo",
    body: "La **Deuda pendiente** muestra cuánto te deben los clientes. **Pagos de hoy** suma lo que has cobrado durante el día. **Clientes con deuda** y **Vencidos** cuentan a las personas que corresponden a esas cifras.",
    tip: "Los datos se actualizan cada vez que registras un fiado o un pago.",
  },
  "dash-collect": {
    title: "A quién cobrar",
    body: "Aquí aparecen los clientes que te deben, primero los que tienen pagos **vencidos** y después quienes tienen las deudas más altas. Pulsa un nombre para ir a **Clientes** y preparar un recordatorio.",
  },
  "dash-activity": {
    title: "Actividad reciente",
    body: "Muestra los últimos fiados y pagos que registraste, ordenados del más reciente al más antiguo, para que sepas qué ha ocurrido.",
  },
  "dash-quick": {
    title: "Accesos rápidos",
    body: "Atajos a las distintas secciones, con avisos actualizados, como la cantidad de cuentas **vencidas** o de productos con **pocas existencias**.",
  },
  "clients-new": {
    title: "Agregar un cliente",
    body: "Comienza aquí. Solo necesitas un **nombre**; agrega un **número de teléfono** para enviar recordatorios por WhatsApp. También puedes asignarle un **límite de crédito** propio: déjalo vacío para utilizar el límite predeterminado.",
  },
  "clients-search": {
    title: "Encuentra a alguien rápidamente",
    body: "Busca por **nombre** o **número de teléfono**. La lista se actualiza mientras escribes.",
  },
  "clients-filters": {
    title: "Filtrar por estado",
    body: "**Todos** muestra a todos los clientes. **Al día** significa que no tienen deuda; **Pendiente**, que deben dinero pero aún no está vencido; y **Vencido**, que ya pasó la fecha de pago.",
  },
  "clients-table": {
    title: "Todos tus clientes de un vistazo",
    body: "Consulta las **compras**, la **deuda pendiente** y el **estado** de cada cliente. Pulsa **Ver detalle** para editar sus datos o archivarlo.",
    tip: "Un cliente que todavía debe dinero no puede archivarse. Primero registra su pago.",
    fallback: {
      title: "Tus clientes aparecerán aquí",
      body: "Cuando agregues clientes, verás una tabla con sus **compras**, **deuda pendiente** y **estado**. Pulsa **Ver detalle** en cualquier fila para editar sus datos o archivarlos.",
    },
  },
  "clients-reminder": {
    title: "Recordatorios de pago",
    body: "Cuando alguien te debe dinero, FIA'O prepara un **mensaje de WhatsApp** con su nombre, el monto y el nombre de tu negocio. Revísalo y pulsa el botón para abrir WhatsApp con el mensaje listo; solo tendrás que enviarlo.",
    missingBody: "Ahora mismo nadie te debe dinero, así que no hay recordatorios pendientes. Cuando un cliente tenga una deuda, aquí aparecerá una **tarjeta de recordatorio** con un mensaje listo para enviar por WhatsApp.",
  },
  "clients-collections": {
    title: "Cobros amigables",
    body: "Aquí aparecen los clientes que más necesitan un recordatorio: primero los **vencidos** y después los que tienen las deudas más altas. Pulsa uno para preparar su mensaje.",
  },
  "credit-customer": {
    title: "Selecciona un cliente",
    body: "Todo lo que aparece en esta página corresponde al cliente que selecciones: su **deuda**, su **historial** y los formularios para registrar **fiados** y **pagos**.",
    fallback: {
      title: "Agrega tu primer cliente",
      body: "Esta página funciona cliente por cliente. Agrega tu primer cliente en **Clientes** y vuelve aquí: podrás consultar su deuda, su historial y los formularios para registrar fiados y pagos.",
    },
  },
  "credit-card": {
    title: "Deuda y límite de crédito",
    body: "Consulta cuánto **debe** el cliente, cuál es su **límite** y qué parte ha utilizado. Si una parte de la deuda está vencida, aparecerá un aviso rojo con el monto correspondiente.",
  },
  "credit-block": {
    title: "Bloqueo automático",
    body: "Cuando está activado, FIA'O **rechaza cualquier fiado nuevo** que haga que el cliente supere su límite. Es el mismo ajuste que encontrarás en Perfil.",
    tip: "La regla también se aplica en la base de datos, no solamente en la pantalla.",
  },
  "credit-history": {
    title: "Historial de deuda",
    body: "Aquí aparecen todos los fiados y pagos, empezando por el más reciente. **Los pagos cubren primero el fiado más antiguo.** Cada fiado muestra si está **Pagado**, **Pendiente** o **Vencido**, junto con su fecha de pago.",
    tip: "Los movimientos no se pueden editar ni eliminar. Si cometes un error, registra un nuevo movimiento para corregirlo y mantener un historial confiable.",
  },
  "credit-new": {
    title: "Registrar un fiado",
    body: "Introduce el **monto** y, si quieres, una descripción de **lo que se llevó el cliente**. Deja vacía la fecha de vencimiento para utilizar los días predeterminados para pagar.",
    tip: "También puedes vender al crédito directamente desde tu inventario en **Productos**.",
  },
  "credit-payment": {
    title: "Registrar un pago",
    body: "Elige **Parcial** para introducir cualquier monto o **Completo** para saldar todo. **Marcar como pagado** liquida la deuda completa con un solo toque. El pago nunca puede superar lo que el cliente debe.",
  },
  "credit-side": {
    title: "Actividad y resumen",
    body: "Consulta los movimientos más recientes de **todos** tus clientes y un resumen de la deuda pendiente, los pagos de hoy, los clientes con deuda y las cuentas vencidas.",
  },
  "products-tabs": {
    title: "Dos pestañas",
    body: "En **Inventario** administras tus productos. En **Registrar venta fiada** puedes vender a crédito directamente desde el inventario.",
  },
  "products-search": {
    title: "Buscar productos",
    body: "Busca productos por **nombre** o **categoría**. La búsqueda funciona en ambas pestañas.",
  },
  "products-grid": {
    title: "Tu inventario",
    body: "Cada tarjeta muestra el **precio** y las **existencias**. Cuando un producto alcanza el nivel de alerta, se marca en **rojo** y aparece un aviso amarillo en la parte superior. **Editar** cambia sus datos; **Eliminar** lo quita del inventario, pero conserva las ventas anteriores.",
    tip: "Los productos con pocas existencias también aparecen en la campana y en el panel principal.",
  },
  "products-add": {
    title: "Agregar un producto",
    body: "Indica el **nombre**, la **categoría**, el **precio**, cómo se vende (unidad, lb, kg…), las **existencias** y el nivel en el que quieres recibir una alerta. También puedes pegar un enlace a una imagen.",
  },
  "products-sale": {
    title: "Vender fiado desde el inventario",
    body: "Selecciona el **cliente**, agrega productos con **+** y **−**, y el total se calcula con sus precios. Al confirmar, se registra la deuda **y** se descuentan las existencias. Si ocurre un error (por ejemplo, falta de inventario o se supera el límite), **no se guarda nada**.",
  },
  "reports-filters": {
    title: "Elige qué analizar",
    body: "Selecciona un **período** predeterminado o establece tus propias fechas. También puedes filtrar por **un cliente** o por **estado**. Pulsa **Aplicar filtros** para actualizar la información de la página.",
  },
  "reports-cards": {
    title: "Cifras principales",
    body: "El **crédito activo total** es lo que los clientes deben actualmente. **Cobrado** muestra los pagos recibidos en comparación con el período anterior. **Saldos pendientes** muestra la deuda que aún no está vencida y cuántas cuentas están vencidas. **Total de clientes** indica cuántos tienes y cuántos son nuevos.",
  },
  "reports-chart": {
    title: "Fiados y pagos a lo largo del tiempo",
    body: "Las barras comparan el **crédito que registraste**, los **pagos que recibiste** y los montos **vencidos**, semana a semana (o mes a mes en períodos largos).",
  },
  "reports-status": {
    title: "Estado de los créditos",
    body: "Muestra qué parte del crédito registrado durante el período ya fue **pagada**, sigue **pendiente** o está **vencida**.",
  },
  "reports-table": {
    title: "Todas las transacciones",
    body: "Consulta una lista paginada de todos los fiados y pagos del período. Los **pagos** aparecen con un signo negativo.",
  },
  "reports-export": {
    title: "Exportar tus informes",
    body: "Descarga exactamente la información que estás viendo en un archivo de **Excel** o **PDF**, ideal para tus registros o para tu contador.",
  },
  "profile-info": {
    title: "Información del negocio",
    body: "Aquí puedes consultar y actualizar tu nombre, **nombre del negocio**, teléfono, RUC y dirección. El nombre del negocio aparece en los recordatorios que envías a tus clientes; mantenlo actualizado.",
  },
  "profile-rules": {
    title: "Reglas de crédito",
    body: "Configura el **límite de crédito predeterminado**, los **días para pagar** y si el **bloqueo automático** está activado. Estas reglas se aplican a los clientes que no tienen un límite propio.",
  },
  "profile-account": {
    title: "Cuenta y notificaciones",
    body: "Activa o desactiva la **campana de notificaciones**, repite este recorrido y **cierra sesión** cuando termines de usar FIA'O en un dispositivo compartido.",
  },
  "contact-faq": {
    title: "Respuestas rápidas",
    body: "Aquí encontrarás preguntas frecuentes sobre el funcionamiento de FIA'O, respondidas con claridad, incluso sobre las funciones que todavía no están disponibles.",
  },
  "contact-form": {
    title: "Ponte en contacto",
    body: "Envía un mensaje con tus preguntas o ideas. Tu **nombre** y **correo electrónico** aparecen completados, y te responderemos por correo.",
  },
  done: {
    title: "¡Ya estás listo para comenzar! 🎉",
    body: "Una rutina sencilla:\n\n**1.** Agrega tus clientes.\n\n**2.** Registra los fiados y pagos a medida que ocurren.\n\n**3.** Revisa el panel principal todos los días para saber a quién cobrar.",
    tip: "Puedes repetir el recorrido cuando quieras con el botón ? de la barra superior.",
    nativeTip: "Puedes repetir el recorrido cuando quieras desde Más.",
  },
};

export function getTourUi(language = "en") {
  return TOUR_UI[language === "es" ? "es" : "en"];
}

export function localizeTourStep(step, language = "en") {
  if (language !== "es") return step;
  const translated = STEPS_ES[step.id] || {};
  return {
    ...step,
    chapter: CHAPTERS_ES[step.chapter] || step.chapter,
    title: translated.title || step.title,
    body: translated.body || step.body,
    mobileBody: translated.mobileBody || step.mobileBody,
    nativeBody: translated.nativeBody || step.nativeBody,
    nativeTip: translated.nativeTip || step.nativeTip,
    missingBody: translated.missingBody || step.missingBody,
    tip: translated.tip || step.tip,
    fallback: step.fallback
      ? { ...step.fallback, ...(translated.fallback || {}) }
      : step.fallback,
  };
}
