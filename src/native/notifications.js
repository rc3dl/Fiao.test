// Recordatorio diario en Android (notificación local). Se calcula con los mismos avisos de la campana.
// Cada vez que se abre la app se reprograma con los datos más recientes; si ya no hay nada pendiente, se cancela.
import { LocalNotifications } from "@capacitor/local-notifications";

const REMINDER_ID = 4101;
const CHANNEL = "fiao-alerts";
const HOUR = 9; // se muestra a las 9:00

const TEXTS = {
  es: {
    title: "FIA'O: hay cosas por revisar",
    channel: "Avisos de cuentas y productos",
    overdue: (n) => `${n} ${n === 1 ? "cuenta vencida" : "cuentas vencidas"}`,
    stock: (n) => `${n} ${n === 1 ? "producto por reponer" : "productos por reponer"}`,
  },
  en: {
    title: "FIA'O: things to review",
    channel: "Account and product alerts",
    overdue: (n) => `${n} overdue ${n === 1 ? "account" : "accounts"}`,
    stock: (n) => `${n} ${n === 1 ? "product" : "products"} to restock`,
  },
};

function nextRun() {
  const d = new Date();
  d.setHours(HOUR, 0, 0, 0);
  if (d <= new Date()) d.setDate(d.getDate() + 1);
  return d;
}

export async function cancelReminder() {
  try {
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
  } catch {
    /* nada que cancelar */
  }
}

export async function syncReminder({ overdue, stock, language }) {
  try {
    if (!overdue && !stock) return await cancelReminder();

    let permission = await LocalNotifications.checkPermissions();
    if (permission.display === "prompt" || permission.display === "prompt-with-rationale") {
      permission = await LocalNotifications.requestPermissions();
    }
    if (permission.display !== "granted") return undefined;

    const tx = TEXTS[language] || TEXTS.en;
    await LocalNotifications.createChannel({ id: CHANNEL, name: tx.channel, importance: 4, visibility: 1 });
    await cancelReminder();
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REMINDER_ID,
          title: tx.title,
          body: [overdue && tx.overdue(overdue), stock && tx.stock(stock)].filter(Boolean).join(" · "),
          channelId: CHANNEL,
          schedule: { at: nextRun(), allowWhileIdle: true },
        },
      ],
    });
  } catch {
    /* sin permiso o sin el plugin sincronizado: no se hace nada */
  }
  return undefined;
}
