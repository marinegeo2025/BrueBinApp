from http.server import BaseHTTPRequestHandler
import requests
from bs4 import BeautifulSoup
from lib.failsafe import validate_bin_table
from lib.translations import translations
import urllib.parse

URL = "https://www.cne-siar.gov.uk/bins-and-recycling/waste-recycling-collections-lewis-and-harris/glass-green-bin-collections/friday-collections"
ICON  = "fa-wine-bottle"
H1_COLOR = "#027a02"
BODY_BG = "#f0f8ea"
CARD_BG = "#fff"
LI_BG   = "#dff0d8"

TARGET_AREAS = ["Brue", "Barvas"]

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        html = self.render()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(html.encode("utf-8"))

    def render(self):
        # --- Detect lang param (?lang=en or ?lang=gd, default gd) ---
        query = urllib.parse.urlparse(self.path).query
        params = dict(qc.split("=") for qc in query.split("&") if "=" in qc)
        lang = params.get("lang", "gd")
        t = translations["en"] if lang == "en" else translations["gd"]

        # --- Fetch page ---
        try:
            r = requests.get(URL, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
            r.raise_for_status()
        except requests.RequestException as e:
            return f"<p>{t['errorFetching']} {e}</p>"

        soup = BeautifulSoup(r.text, "html.parser")

        # --- Require both Brue and Barvas before parsing ---
        try:
            validate_bin_table(soup, required_keyword="Brue", expected_months=[])
            validate_bin_table(soup, required_keyword="Barvas", expected_months=[])
        except Exception as e:
            return f"<p>⚠️ Structure changed: {e}</p>"

        table = soup.find("table")
        if not table:
            return f"<p>{t['noData']}</p>"

        headers = [th.get_text(strip=True) for th in table.find_all("th")]
        months = headers[1:]

        sections_for_all = []
        for area in TARGET_AREAS:
            cells = []
            for row in table.find_all("tr"):
                tds = row.find_all("td")
                if tds and area in tds[0].get_text(strip=True):
                    cells = [td.get_text(strip=True) for td in tds[1:]]
                    break

            if cells:
                month_sections = []
                for month, dates_str in zip(months, cells):
                    dates = [d.strip() for d in dates_str.split(",") if d.strip()]
                    lis = "\n".join(
                        f'<li><i class="fas fa-calendar-day"></i> {d}</li>' for d in dates
                    ) or "<li>-</li>"
                    month_sections.append(f"<h3>{month}</h3>\n<ul>{lis}</ul>")
                section_html = f"<h2>{area}</h2>" + "\n".join(month_sections)
            else:
                section_html = f"<h2>{area}</h2><p>{t['noData']}</p>"

            sections_for_all.append(section_html)

        content = "\n<hr/>\n".join(sections_for_all)

        # --- Styled bilingual HTML ---
        return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{t['greenTitle']}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">
  <style>
    body {{
      font-family: 'Poppins', sans-serif;
      background: {BODY_BG};
      display: flex; justify-content: center; align-items: center;
      min-height: 100vh; margin: 0; padding: 20px;
    }}
    .container {{
      background: {CARD_BG}; padding: 25px; border-radius: 12px;
      box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
      width: 90%; max-width: 600px;
    }}
    h1 {{ color: {H1_COLOR}; font-size: 24px; margin-bottom: 20px; text-align:center; }}
    h2 {{ font-size: 22px; color: #333; margin-top: 25px; }}
    h3 {{ font-size: 18px; color: #444; margin-top: 12px; font-weight: 600; }}
    ul {{ list-style: none; padding: 0; }}
    li {{
      background: {LI_BG}; margin: 6px 0; padding: 8px; border-radius: 6px;
      font-size: 15px; color: #333; font-weight: 500;
    }}
    hr {{ margin: 20px 0; border: none; border-top: 1px solid #ccc; }}
    .back {{ display:inline-block; margin-top:16px; text-decoration:none; color:#0066cc; }}
  </style>
</head>
<body>
  <div class="container">
    <h1><i class="fas {ICON}"></i> {t['greenTitle']}</h1>
    {content}
    <div style="text-align:center;">
      <a class="back" href="/?lang={lang}">{t['back']}</a>
    </div>
  </div>
</body>
</html>"""
