// /api/blue.js
import axios from "axios";
import * as cheerio from "cheerio";
import { validateBinTable } from "../../lib/failsafe.js";
import translations from "../../lib/translations.js";

const URL =
  "https://www.cne-siar.gov.uk/bins-and-recycling/waste-recycling-collections-lewis-and-harris/organic-food-and-garden-waste-and-mixed-recycling-blue-bin/thursday-collections";

export default async function handler(req, res) {
  const lang = req.query.lang === "en" ? "en" : "gd"; // default Gaelic
  const t = translations[lang];

  try {
    // --- Fetch page ---
    const response = await axios.get(URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 10000,
    });
    const $ = cheerio.load(response.data);

    // --- Validate Brue & Barvas rows ---
    try {
      validateBinTable($, { expectedMonths: [], requiredKeyword: "Brue" });
      validateBinTable($, { expectedMonths: [], requiredKeyword: "Barvas" });
    } catch (err) {
      return res
        .status(500)
        .send(`<p>⚠️ Structure changed: ${err.message}</p>`);
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

    // --- Find Brue row ---
    let cellsForBrue = [];
    $("tr").each((_, row) => {
      const tds = $(row).find("td");
      if (tds.length && $(tds[0]).text().trim().includes("Brue")) {
        cellsForBrue = tds
          .slice(1)
          .map((_, td) => $(td).text().trim())
          .get();
      }
    });

    // --- Build content ---
    let content = "";
    if (cellsForBrue.length) {
      const sections = months.map((month, i) => {
        const monthLabel = t.months?.[month] || month; // translate month
        const dates = cellsForBrue[i]
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean);
        const lis =
          dates.length > 0
            ? dates
                .map((d) => `<li><i class="fas fa-calendar-day"></i> ${d}</li>`)
                .join("")
            : "<li>-</li>";
        return `<h2>${monthLabel}</h2><ul>${lis}</ul>`;
      });
      content = sections.join("");
    } else {
      content = `<p>${t.noData}</p>`;
    }

    // --- Return styled HTML ---
    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>${t.blueTitle}</title>
  <link rel="stylesheet" href="/style.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
</head>
<body class="blue-page">
  <div class="container">
    <h1><i class="fas fa-recycle"></i> ${t.blueTitle}</h1>
    ${content}
    <a class="back" href="/?lang=${lang}">${t.back}</a>
  </div>
</body>
</html>`);
  } catch (err) {
    res
      .status(500)
      .send(`<p>${t.errorFetching} ${err.message}</p>`);
  }
}
