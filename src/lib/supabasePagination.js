// Descarga todas las páginas de una consulta Supabase sin truncar los resultados.
export const SUPABASE_PAGE_SIZE = 500;

export async function fetchAllPages(buildPage, pageSize = SUPABASE_PAGE_SIZE) {
  if (typeof buildPage !== "function") throw new TypeError("buildPage must be a function.");
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new RangeError("pageSize must be a positive integer.");

  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildPage(from, from + pageSize - 1);
    if (error) throw error;
    const page = Array.isArray(data) ? data : [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}
