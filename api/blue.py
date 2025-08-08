import requests
from bs4 import BeautifulSoup

URL = "https://www.cne-siar.gov.uk/bins-and-recycling/waste-recycling-collections-lewis-and-harris/organic-food-and-garden-waste-and-mixed-recycling-blue-bin/thursday-collections"
TITLE = "Blue Bin — Brue (Thursday route)"

def handler(request):
    try:
        response = requests.get(URL, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        return {"statusCode": 500, "headers": {"Content-Type": "text/html"}, "body": f"<p>Error fetching data: {e}</p>"}

    soup = BeautifulSoup(response.text, "html.parser")
    table = soup.find("table")
    if not table:
        return {"statusCode": 200, "headers": {"Content-Type": "text/html"}, "body": "<p>Could not find bin collection information.</p>"}

    headers = [th.get_text(strip=True) for th in table.find_all("th")]
    months = headers[1:]
    dates = []

    for row in table.find_all("tr"):
        cells = row.find_all("td")
        if len(cells) >= 2 and "Brue" in cells[0].get_text(strip=True):
            dates = [cells[i].get_text(strip=True) for i in range(1, len(cells))]
            break

    rows = "".join(f"<tr><td>{m}</td><td>{d or '-'}</td></tr>" for m, d in zip(months, dates))
    body = f"""
    <html><head><meta charset="utf-8"><title>{TITLE}</title>
    <style>
    body {{ font-family: Arial, sans-serif; padding: 20px; }}
    table {{ border-collapse: collapse; width: 100%; max-width: 500px; }}
    td, th {{ border: 1px solid #ddd; padding: 8px; }}
    th {{ background: #f3f3f3; }}
    </style></head><body>
    <h1>{TITLE}</h1>
    <table><thead><tr><th>Month</th><th>Dates</th></tr></thead><tbody>
    {rows}
    </tbody></table>
    <p><a href="/">← Back</a></p>
    </body></html>
    """
    return {"statusCode": 200, "headers": {"Content-Type": "text/html"}, "body": body}
