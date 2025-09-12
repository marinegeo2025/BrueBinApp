// lib/failsafe.js

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

/**
 * Minimal, robust validator for CNES bin tables (quiet on normal updates).
 * - Uses the first table (your original behaviour).
 * - If that table has no matching row, it falls back to scan other tables.
 * - Month check is optional: pass expectedMonths: [] to skip it.
 */
export function validateBinTable($, {
  expectedMonths = MONTHS,            // pass [] at call sites to skip month check
  requiredKeyword = "Ness",
}) {
  const tables = $("table");
  if (!tables.length) {
    throw new Error("No table found on CNES page");
  }

  // Helper to collect headers (your original approach)
  const collectHeaders = ($table) => {
    let headers = $table.find("thead th").map((_, th) => $(th).text().trim()).get();
    if (headers.length === 0) {
      headers = $table.find("tr").first().find("th,td").map((_, cell) => $(cell).text().trim()).get();
    }
    return headers;
  };

  // Month check (optional, skipped if expectedMonths is empty)
  const headersHaveAnyExpectedMonth = (headers) => {
    if (!expectedMonths || expectedMonths.length === 0) return true; // skip check
    return headers.some(h =>
      expectedMonths.some(m => h.toLowerCase().includes(m.toLowerCase()))
    );
  };

  // Core: does this specific table contain a row whose first cell includes the keyword?
  const tableHasKeywordRow = ($table, needle) => {
    const rows = $table.find("tbody tr").length ? $table.find("tbody tr") : $table.find("tr").slice(1);
    let found = false;
    rows.each((_, row) => {
      const firstCell = $(row).children("th,td").first();
      const area = firstCell.text().trim().toLowerCase();
      if (area.includes(needle)) { found = true; return false; }
    });
    return found;
  };

  const needle = String(requiredKeyword).toLowerCase();

  // 1) Try your original target: the first table
  let $picked = tables.first();
  let headers = collectHeaders($picked);

  // If the first table fails the optional month check, we *don’t* fail yet—we’ll try fallback tables.
  let monthOK = headersHaveAnyExpectedMonth(headers);
  let hasKeyword = tableHasKeywordRow($picked, needle);

  // 2) Fallback: if the first table didn’t have the keyword row, scan the rest
  if (!hasKeyword) {
    tables.slice(1).each((_, t) => {
      if (hasKeyword) return;
      const $t = $(t);
      const h = collectHeaders($t);
      const mOK = headersHaveAnyExpectedMonth(h); // still optional
      const kw = tableHasKeywordRow($t, needle);
      if (kw) {
        $picked = $t;
        headers = h;
        monthOK = mOK;
        hasKeyword = true;
      }
    });
  }

  // Final decisions:
  // If no table has even a single row for the keyword, we must stop (real breakage).
  if (!hasKeyword) {
    throw new Error(`No row containing "${requiredKeyword}" found`);
  }

  // If month check is enabled and *no* months were seen in the chosen table’s headers,
  // then throw (this is unusual enough to warrant attention). If you want this never to throw,
  // simply pass expectedMonths: [] at the call sites.
  if (!monthOK) {
    throw new Error(`No month-like header found. Saw headers: ${headers.join(", ")}`);
  }

  // Otherwise, pass silently (no return value—same as your original).
}
