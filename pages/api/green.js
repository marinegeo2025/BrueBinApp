// /api/green.js
import axios from "axios";
import * as cheerio from "cheerio";
import { validateBinTable } from "../../lib/failsafe.js";
import translations from "../../lib/translations.js";

const URL =
  "https://www.cne-siar.gov.uk/bins-and-recycling/waste-recycling-collections-lewis-and-harris/glass-green-bin-collections/friday-collections";

const TARGET_AREAS = ["Brue", "Barvas"];

export default async function handler(req, res) {
  const lang = req.query.lang === "en" ? "en" : "gd"; // Gaelic default
  const t = translations[lang];

  try {
    // --- Fetch page ---
    const response = await axios.get(URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 10000,
    });
    const $ = cheerio.load(response.data);

    // --- Require both Brue + Barvas ---
    try {
      validateBinTable($, { expectedMonths: [], requiredKeyword: "Brue" });
      validateBinTable($, { expectedMonths: [], requiredKeyword: "Barvas" });
    } catch (err) {
      return res.status(500).send(`<p>⚠️ Structure changed: ${err.message}</p>`);
    }

    // --- Extract headers ---
    const headers = [];
    $("thead th").each((_, th) => headers.push($(th).text().trim()));
    if (headers.length === 0) {
      $("tr")
        .first()
        .find("th,td")
        .each((_, cell) => headers.push($(cell).text().trim()));
    }
    const months = headers.slice(1);

    // --- Build sections for Brue + Barvas ---
    const sectionsForAll = TARGET_AREAS.map((area) => {
      let cells = [];
      $("tr").each((_, row) => {
        const tds = $(row).find("td");
        if (tds.length && $(tds[0]).text().trim().includes(area)) {
          cells = tds
            .slice(1)
            .map((_, td) => $(td).text().trim())
            .get();
        }
      });

      if (cells.length) {
        const monthSections = months.map((month, i) => {
          const monthLabel = t.months?.[month] || month;
          const dates = cells[i]
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean);
          const lis =
            dates.length > 0
              ? dates
                  .map((d) => `<li><i class="fas fa-calendar-day"></i> ${d}</li>`)
                  .join("")
              : "<li>-</li>";
          return `<h3>${monthLabel}</h3><ul>${lis}</ul>`;
        });
        return `<h2>${t[area.toLowerCase() + "Heading"] || area}</h2>${monthSections.join(
          ""
        )}`;
      } else {
        return `<h2>${t[area.toLowerCase() + "Heading"] || area}</h2><p>${t.noData}</p>`;
      }
    });

    const content = sectionsForAll.join("<hr/>");

    // --- Return styled HTML ---
    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>${t.greenTitle}</title>
  <link rel="stylesheet" href="/style.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
</head>
<body class="green-page">
  <div class="container">
    <h1><i class="fas fa-wine-bottle"></i> ${t.greenTitle}</h1>
    ${content}
    <div style="text-align:center;">
      <a class="back" href="/?lang=${lang}">${t.back}</a>
    </div>
  </div>
</body>
</html>`);
  } catch (err) {
    res.status(500).send(`<p>${t.errorFetching} ${err.message}</p>`);
  }
}
