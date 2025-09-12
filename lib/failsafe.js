// lib/failsafe.js

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

/**
 * Minimal, robust validator for CNES bin tables.
 * - Ensures at least one <table>.
 * - Optionally checks header months.
 * - Ensures one row contains the required keyword.
 *
 * @param {CheerioStatic} $ - cheerio-loaded page
 * @param {Object} options
 * @param {string[]} options.expectedMonths - month names to check, [] to skip check
 * @param {string} options.requiredKeyword - area name to validate (e.g. "Brue")
 */
export function validateBinTable($, { expectedMonths = MONTHS, requiredKeyword = "Brue" } = {}) {
  const tables = $("table");
  if (!tables.length) {
    throw new Error("No <table> found on CNES page");
  }

  // Helper: collect headers from a table
  const collectHeaders = ($table) => {
    let headers = [];
    $table.find("thead th").each((_, th) => headers.push($(th).text().trim()));
    if (headers.length === 0) {
      const firstRow = $table.find("tr").first();
      if (firstRow.length) {
        firstRow.find("th,td").each((_, cell) => headers.push($(cell).text().trim()));
      }
    }
    return headers;
  };

  // Helper: does header row look like it contains months?
  const hasExpectedMonth = (headers) => {
    if (!expectedMonths || expectedMonths.length === 0) return true;
    return headers.some((h) =>
      expectedMonths.some((m) => h.toLowerCase().includes(m.toLowerCase()))
    );
  };

  // Helper: does this table contain the keyword row?
  const tableHasKeyword = ($table, needle) => {
    let found = false;
    $table.find("tr").each((_, row) => {
      const firstCell = $(row).find("td,th").first();
      if (firstCell && firstCell.text().trim().toLowerCase().includes(needle)) {
        found = true;
        return false; // break loop
      }
    });
    return found;
  };

  const needle = String(requiredKeyword).toLowerCase();
  let headers = collectHeaders(tables.first());

  // 1) Try the first table
  let picked = null;
  if (hasExpectedMonth(headers) && tableHasKeyword(tables.first(), needle)) {
    picked = tables.first();
  } else {
    // 2) fallback scan
    tables.slice(1).each((_, table) => {
      if (picked) return;
      const h = collectHeaders($(table));
      if (hasExpectedMonth(h) && tableHasKeyword($(table), needle)) {
        picked = $(table);
        headers = h;
      }
    });
  }

  if (!picked) {
    throw new Error(`No row containing "${requiredKeyword}" found`);
  }

  if (expectedMonths.length && !hasExpectedMonth(headers)) {
    throw new Error(`No month-like header found. Saw: ${headers.join(", ")}`);
  }

  // ✅ passes silently if everything is ok
  return true;
}
