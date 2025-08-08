from http.server import BaseHTTPRequestHandler
import requests
from bs4 import BeautifulSoup

URL = "https://www.cne-siar.gov.uk/bins-and-recycling/waste-recycling-collections-lewis-and-harris/glass-green-bin-collections/friday-collections"
TITLE = "Green Bin — Brue (Friday route)"

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            r = requests.get(URL, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
            r.raise_for_status()
        except requests.RequestException as e:
            self._send(500, f"<h1>Error fetching data</h1><p>{e}</p>")
            return

        soup = BeautifulSoup(r.text, "html.parser")
        table = soup.find("table")
        if not table:
            self._send(200, "<h1>No table found on council page.</h1>")
            return

        headers = [th.get_text(strip=True) for th in table.find_all("th")]
        months = headers[1:]

        dates = []
        for row in table.find_all("tr"):
            tds = row.find_all("td")
            if tds and "Brue" in tds[0].get_text(strip=True):
                dates = [td.get_text(strip=True) for td in tds[1:]]
                break

        rows = "".join(f"<tr><td>{m}</td><td>{d or '-'}</td></tr>" for m, d in zip(months, dates))
        body = f"""<html><head><meta charset="utf-8"><title>{TITLE}</title></head>
        <body><h1>{TITLE}</h1><table border="1" cellpadding="6"><tr><th>Month</th><th>Dates</th></tr>{rows}</table>
        <p><a href="/">← Back</a></p></body></html>"""
        self._send(200, body)

    def _send(self, code, body):
        self.send_response(code); self.send_header("Content-Type","text/html; charset=utf-8"); self.end_headers()
        self.wfile.write(body.encode("utf-8"))
