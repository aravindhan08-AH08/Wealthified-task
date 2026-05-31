import csv
import logging
from io import StringIO
from app.db.connection import get_db

logger = logging.getLogger("mutual-fund-api.db.importer")

def normalize_date(date_str: str) -> str:
    """
    Normalizes different date formats (e.g. DD-MM-YYYY, DD/MM/YYYY) to YYYY-MM-DD.
    """
    if not date_str:
        return "2025-05-27"
        
    date_str = date_str.strip().replace("/", "-")
    parts = date_str.split("-")
    if len(parts) != 3:
        return "2025-05-27"
        
    try:
        # Check for YYYY-MM-DD
        if len(parts[0]) == 4:
            year = parts[0]
            month = parts[1].zfill(2)
            day = parts[2].zfill(2)
        # Check for DD-MM-YYYY or MM-DD-YYYY
        elif len(parts[2]) == 4:
            year = parts[2]
            month = parts[1].zfill(2)
            day = parts[0].zfill(2)
        else:
            return "2025-05-27"
            
        y = int(year)
        m = int(month)
        d = int(day)
        if 1000 <= y <= 9999 and 1 <= m <= 12 and 1 <= d <= 31:
            return f"{year}-{month}-{day}"
    except ValueError:
        pass
        
    return "2025-05-27"

def import_csv(csv_text: str) -> int:
    """
    Parses mutual fund transactions from a CSV file and inserts them into PostgreSQL.
    """
    f = StringIO(csv_text.strip())
    reader = csv.reader(f)
    try:
        headers = next(reader)
    except StopIteration:
        return 0
        
    headers = [h.strip().lower() for h in headers]
    
    # Map different possible CSV column names to schema names
    field_mappings = {
        "amc": ["amc", "mutual fund company", "fund house", "asset management company"],
        "folio": ["folio", "folio number", "folio no", "folio_number"],
        "scheme": ["scheme", "scheme name", "mutual fund", "fund", "fund name", "scheme_name"],
        "inv": ["inv", "investor", "investor name", "name", "holder name", "primary holder", "investor_name"],
        "pan": ["pan", "pan number", "pan no", "pan_number"],
        "trade_date": ["tradedate", "trade date", "transaction date", "date", "date of purchase", "transaction_date"],
        "pur_price": ["purprice", "pur price", "purchase price", "nav", "nav price", "price", "purchase_price"],
        "units": ["units", "units purchased", "quantity", "unit quantity"],
        "amount": ["amount", "amount invested", "total amount", "investment amount", "purchase amount", "total_amount"],
        "scheme_type": ["schemetype", "scheme type", "type", "category", "scheme_type"],
        "tax_status": ["taxstatus", "tax status", "investor status", "tax_status"]
    }
    
    col_map = {}
    for target, alternates in field_mappings.items():
        for alt in alternates:
            if alt in headers:
                col_map[target] = headers.index(alt)
                break
                
    # Fallback to index positions if headers are not matched
    if "scheme" not in col_map and len(headers) >= 3:
        col_map["amc"] = 0 if len(headers) > 0 else None
        col_map["folio"] = 1 if len(headers) > 1 else None
        col_map["scheme"] = 2 if len(headers) > 2 else None
        col_map["inv"] = 3 if len(headers) > 3 else None
        col_map["pan"] = 4 if len(headers) > 4 else None
        col_map["trade_date"] = 5 if len(headers) > 5 else None
        col_map["pur_price"] = 6 if len(headers) > 6 else None
        col_map["units"] = 7 if len(headers) > 7 else None
        col_map["amount"] = 8 if len(headers) > 8 else None
        col_map["scheme_type"] = 9 if len(headers) > 9 else None
        col_map["tax_status"] = 10 if len(headers) > 10 else None
        
    conn = get_db()
    cursor = conn.cursor()
    
    count = 0
    try:
        for row in reader:
            if not row or len(row) <= max(col_map.values(), default=0):
                continue
                
            def get_val(key, default=""):
                idx = col_map.get(key)
                return row[idx].strip() if idx is not None and idx < len(row) else default

            try:
                amc = get_val("amc", "Unknown")
                folio = get_val("folio", "Unknown")
                scheme = get_val("scheme")
                if not scheme:
                    continue
                    
                inv = get_val("inv", "Unknown")
                pan = get_val("pan", "Unknown")
                trade_date = normalize_date(get_val("trade_date"))

                pur_price = float(get_val("pur_price", "0").replace(",", ""))
                units = float(get_val("units", "0").replace(",", ""))
                amount = float(get_val("amount", "0").replace(",", ""))
                
                # Automatically compute missing amount or units if possible
                if amount == 0 and units > 0 and pur_price > 0:
                    amount = round(units * pur_price, 2)
                elif units == 0 and amount > 0 and pur_price > 0:
                    units = round(amount / pur_price, 4)

                scheme_type = get_val("scheme_type", "Equity")
                tax_status = get_val("tax_status", "Individual")
                
                cursor.execute("""
                    INSERT INTO transactions (amc, folio, scheme, inv, pan, trade_date, pur_price, units, amount, scheme_type, tax_status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (amc, folio, scheme, inv, pan, trade_date, pur_price, units, amount, scheme_type, tax_status))
                count += 1
            except Exception as e:
                logger.warning("Skipping CSV row due to validation error: %s", str(e))
                continue
                
        conn.commit()
    except Exception as e:
        logger.error("Failed to import CSV transactions to database: %s", str(e))
        conn.rollback()
        raise
    finally:
        conn.close()
        
    logger.info("Successfully imported %d transactions from CSV.", count)
    return count
