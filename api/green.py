from http.server import BaseHTTPRequestHandler
import requests
from bs4 import BeautifulSoup

URL = "https://www.cne-siar.gov.uk/bins-and-recycling/waste-recycling-collections-lewis-and-harris/glass-green-bin-collections/friday-collections"
TITLE = "GREEN Bin Collection Dates for Brue"
ICON  = "fa-wine-bottle"
H1_COLOR = "#027a02"
BODY_BG = "#f0f8ea"
CARD_BG = "#fff"
LI_BG   = "#dff0d8"

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        html = self.render()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(html.encode("utf-8"))

    def render(self):
        try:
            r = requests.get(URL, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
            r.raise_for_status()
        except requests.RequestException as e:
            return f"<p>Error fetching data: {e}</p>"

        soup = BeautifulSoup(r.text, "html.parser")
        table = soup.find("table")
        if not table:
            return "<p>Could not find bin collection information on the page.</p>"

        headers = [th.get_text(strip=True) for th in table.find_all("th")]
        months = headers[1:]

        cells_for_brue = []
        for row in table.find_all("tr"):
            tds = row.find_all("td")
            if tds and "Brue" in tds[0].get_text(strip=True):
                cells_for_brue = [td.get_text(strip=True) for td in tds[1:]]
                break

        if cells_for_brue:
            sections = []
            for month, dates_str in zip(months, cells_for_brue):
                dates = [d.strip() for d in dates_str.split(",") if d.strip()]
                lis = "\n".join(f'<li><i class="fas fa-calendar-day"></i> {d}</li>' for d in dates) or "<li>-</li>"
                sections.append(f"<h2>{month}</h2>\n<ul>{lis}</ul>")
            content = "\n".join(sections)
        else:
            content = "<p>No bin collection dates found. Try refreshing later.</p>"

        return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{TITLE}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">
  <style>
    body {{ font-family:'Poppins',sans-serif; backgrou
