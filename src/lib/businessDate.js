// Fechas de negocio: el comercio vive en Panamá (America/Panama, UTC-5, sin horario de verano).
// Puro: sin red ni navegador. Lo usan el overlay offline y el modo de compatibilidad.
const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Panama" });

// Fecha (YYYY-MM-DD) en Panamá de un instante ISO / Date / timestamp.
export const panamaDate = (when) => fmt.format(new Date(when));

// Suma días de calendario a una fecha YYYY-MM-DD (aritmética en UTC puro: no depende de la zona del dispositivo).
export function addDaysToDate(ymd, days) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// Vencimiento por defecto de un fiado hecho en `occurredAt`: fecha de Panamá + días del comercio.
export const defaultDueDate = (occurredAt, days = 15) => addDaysToDate(panamaDate(occurredAt), Number(days));
