// Descargar el reporte como Excel o como PDF, todo dentro del navegador (gratis, sin servidor).
import { buildXlsx, S } from "@/lib/xlsxWriter";
import { truncate } from "@/lib/reports";

const cents = (n) => Math.round(Number(n) * 100) / 100;

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// -------------------------------------------------------------------- Excel
export function exportExcel(tables, filename) {
  const bytes = buildXlsx([
    {
      name: tables.labels?.summary || "Summary",
      rows: [
        [{ v: tables.title, s: S.title }],
        ...tables.subtitle.map((line) => [line]),
        [],
        [{ v: tables.labels?.metric || "Metric", s: S.bold }, { v: tables.labels?.value || "Value", s: S.bold }],
        ...tables.summary.map((s) => [s.label, ["Customers", "Clientes"].includes(s.label) ? s.value : { v: cents(s.value), s: S.money }]),
      ],
    },
    {
      name: tables.labels?.transactions || "Transactions",
      rows: [
        tables.headers.map((v) => ({ v, s: S.bold })),
        ...tables.rows.map((r) => r.cells.map((cell, i) => (i === 4 ? { v: cents(cell), s: S.money } : cell))),
      ],
    },
  ]);
  downloadBlob(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
}

// ---------------------------------------------------------------------- PDF
// Dibuja el reporte en un documento jsPDF (hoja A4, medidas en puntos).
export function drawReportPdf(doc, tables) {
  const left = 40;
  const right = 555;
  const bottom = 790;
  const cols = [
    { title: tables.headers[0], x: left, max: 11 },
    { title: tables.headers[1], x: 105, max: 20 },
    { title: tables.headers[2], x: 215, max: 30 },
    { title: tables.headers[5], x: 375, max: 10 },
    { title: tables.headers[4], x: right, max: 14, align: "right" },
  ];
  const pick = [0, 1, 2, 5, 4]; // qué celda va en cada columna
  let y = 50;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(tables.title, left, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const line of tables.subtitle) {
    doc.text(line, left, y);
    y += 14;
  }
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(tables.labels?.summary || "Summary", left, y);
  y += 8;
  doc.setDrawColor(200);
  doc.line(left, y, right, y);
  y += 16;
  doc.setFontSize(10);
  for (const s of tables.summary) {
    doc.setFont("helvetica", "normal");
    doc.text(s.label, left, y);
    doc.setFont("helvetica", "bold");
    doc.text(s.text, right, y, { align: "right" });
    y += 16;
  }
  y += 14;

  const header = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    for (const c of cols) doc.text(c.title, c.x, y, c.align ? { align: c.align } : undefined);
    y += 6;
    doc.setDrawColor(200);
    doc.line(left, y, right, y);
    y += 14;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(tables.labels?.transactions || "Transactions", left, y);
  y += 16;
  header();

  if (tables.rows.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(tables.labels?.empty || "No transactions in this period.", left, y);
  }
  for (const row of tables.rows) {
    if (y > bottom) {
      doc.addPage();
      y = 50;
      header();
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    cols.forEach((c, i) => doc.text(truncate(row.text[pick[i]], c.max), c.x, y, c.align ? { align: c.align } : undefined));
    y += 16;
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`${tables.labels?.page || "Page"} ${p} ${tables.labels?.page === "Página" ? "de" : "of"} ${pages}`, right, 820, { align: "right" });
  }
}

export async function exportPdf(tables, filename) {
  const { jsPDF } = await import("jspdf"); // se carga solo cuando se pulsa el botón
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  drawReportPdf(doc, tables);
  doc.save(filename);
}