# lib/failsafe.py

from bs4 import BeautifulSoup

MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
]

def validate_bin_table(soup: BeautifulSoup, required_keyword="Brue", expected_months=MONTHS):
    """
    Minimal, robust validator for CNES bin tables.
    - Ensures at least one <table>.
    - Optionally checks header months.
    - Ensures one row contains the required keyword.
    """
    tables = soup.find_all("table")
    if not tables:
        raise ValueError("No <table> found on CNES page")

    def collect_headers(table):
        headers = [th.get_text(strip=True) for th in table.find_all("th")]
        if not headers:
            first_row = table.find("tr")
            if first_row:
                headers = [cell.get_text(strip=True) for cell in first_row.find_all(["th", "td"])]
        return headers

    def has_expected_month(headers):
        if not expected_months:  # skip check
            return True
        return any(
            any(m.lower() in h.lower() for m in expected_months)
            for h in headers
        )

    def table_has_keyword(table, needle):
        for row in table.find_all("tr"):
            first_cell = row.find(["td", "th"])
            if first_cell and needle.lower() in first_cell.get_text(strip=True).lower():
                return True
        return False

    needle = required_keyword.lower()
    picked = None
    headers = []

    # 1) Try first table
    headers = collect_headers(tables[0])
    if has_expected_month(headers) and table_has_keyword(tables[0], needle):
        picked = tables[0]
    else:
        # 2) fallback scan other tables
        for t in tables[1:]:
            headers = collect_headers(t)
            if has_expected_month(headers) and table_has_keyword(t, needle):
                picked = t
                break

    if not picked:
        raise ValueError(f'No row containing "{required_keyword}" found')

    if expected_months and not has_expected_month(headers):
        raise ValueError(f"No month-like header found. Saw: {headers}")

    # ✅ passes silently if everything is ok
    return True
