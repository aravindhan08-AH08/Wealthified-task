import os
import sqlite3
import csv
import logging
from io import StringIO

# Configure logger
logger = logging.getLogger("mutual-fund-api.database")

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "mutual_funds.db")

DEFAULT_DATA = [
  {
    "amc": "DSP",
    "folio": "10074454/92",
    "scheme": "DSP Nifty 50 Equal Weight Index Fund - Reg - Growth",
    "inv": "Meethala Pullutummal Narayani",
    "pan": "AAEPN3766A",
    "trade_date": "2025-05-27",
    "pur_price": 24.86,
    "units": 261.4965,
    "amount": 6499.68,
    "scheme_type": "Index Fund",
    "tax_status": "Individual"
  },
  {
    "amc": "Kotak",
    "folio": "16635601/85",
    "scheme": "Kotak Gold Fund - Growth (Regular Plan)",
    "inv": "Shilpa J Suresh",
    "pan": "FRSPS3248J",
    "trade_date": "2025-05-27",
    "pur_price": 36.90,
    "units": 40.431,
    "amount": 1491.93,
    "scheme_type": "Gold FOF",
    "tax_status": "NRI - Non-Repatriable (NRO)"
  },
  {
    "amc": "Kotak",
    "folio": "16675812/23",
    "scheme": "Kotak Gold Fund - Growth (Regular Plan)",
    "inv": "Priyavarshini Damodaran",
    "pan": "HECPD7014E",
    "trade_date": "2025-05-27",
    "pur_price": 36.90,
    "units": 54.20,
    "amount": 1999.90,
    "scheme_type": "Gold FOF",
    "tax_status": "Individual"
  },
  {
    "amc": "Kotak",
    "folio": "15160625/67",
    "scheme": "Kotak Gold Fund - Growth (Regular Plan)",
    "inv": "Nivedhitha Rajagopal",
    "pan": "AVNPN8269J",
    "trade_date": "2025-05-27",
    "pur_price": 36.90,
    "units": 27.10,
    "amount": 999.95,
    "scheme_type": "Gold FOF",
    "tax_status": "Individual"
  }
]

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    logger.info("Initializing SQLite database...")
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amc TEXT,
                folio TEXT,
                scheme TEXT,
                inv TEXT,
                pan TEXT,
                trade_date TEXT,
                pur_price REAL,
                units REAL,
                amount REAL,
                scheme_type TEXT,
                tax_status TEXT
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_trade_date ON transactions(trade_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_pan ON transactions(pan)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_scheme ON transactions(scheme)")
        conn.commit()
        
        # Check if empty, then seed
        cursor.execute("SELECT COUNT(*) as count FROM transactions")
        count = cursor.fetchone()["count"]
        if count == 0:
            logger.info("Database is empty. Seeding default demo transactions...")
            seed_default_data(conn)
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error("Failed to initialize database: %s", str(e), exc_info=True)
        raise
    finally:
        conn.close()

def seed_default_data(conn):
    cursor = conn.cursor()
    for row in DEFAULT_DATA:
        cursor.execute("""
            INSERT INTO transactions (amc, folio, scheme, inv, pan, trade_date, pur_price, units, amount, scheme_type, tax_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            row["amc"], row["folio"], row["scheme"], row["inv"], row["pan"],
            row["trade_date"], row["pur_price"], row["units"], row["amount"],
            row["scheme_type"], row["tax_status"]
        ))
    conn.commit()

def reset_db():
    logger.info("Resetting SQLite database to default demo transactions...")
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions")
        seed_default_data(conn)
        logger.info("Database successfully reset and re-seeded.")
    except Exception as e:
        logger.error("Failed to reset database: %s", str(e), exc_info=True)
        raise
    finally:
        conn.close()

def _add_date_filters(query, params, from_date, to_date):
    if from_date:
        query += " AND trade_date >= ?"
        params.append(from_date)
    if to_date:
        query += " AND trade_date <= ?"
        params.append(to_date)
    return query, params

def fetch_all_transactions(from_date=None, to_date=None):
    conn = get_db()
    try:
        cursor = conn.cursor()
        query = "SELECT amc, folio, scheme, inv, pan, trade_date as tradeDate, pur_price as purPrice, units, amount, scheme_type as schemeType, tax_status as taxStatus FROM transactions WHERE 1=1"
        params = []
        query, params = _add_date_filters(query, params, from_date, to_date)
        query += " ORDER BY trade_date DESC"
        cursor.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        logger.error("Error fetching transactions: %s", str(e), exc_info=True)
        raise
    finally:
        conn.close()

def fetch_investor_fund_summary(from_date=None, to_date=None):
    transactions = fetch_all_transactions(from_date, to_date)
    by_scheme = {}
    for r in transactions:
        scheme = r["scheme"]
        if scheme not in by_scheme:
            by_scheme[scheme] = {
                "scheme": scheme,
                "scheme_type": r["schemeType"],
                "total_amount": 0.0,
                "total_units": 0.0,
                "investors": []
            }
        by_scheme[scheme]["total_amount"] += r["amount"]
        by_scheme[scheme]["total_units"] += r["units"]
        by_scheme[scheme]["investors"].append({
            "inv_name": r["inv"],
            "pan": r["pan"],
            "amount": r["amount"],
            "units": r["units"],
            "pur_price": r["purPrice"],
            "trade_date": r["tradeDate"]
        })
    return list(by_scheme.values())

def fetch_fund_investor_summary(from_date=None, to_date=None):
    transactions = fetch_all_transactions(from_date, to_date)
    by_investor = {}
    for r in transactions:
        pan = r["pan"]
        if pan not in by_investor:
            by_investor[pan] = {
                "inv_name": r["inv"],
                "pan": pan,
                "tax_status": r["taxStatus"],
                "total_amount": 0.0,
                "funds": []
            }
        by_investor[pan]["total_amount"] += r["amount"]
        by_investor[pan]["funds"].append({
            "scheme": r["scheme"],
            "scheme_type": r["schemeType"],
            "amount": r["amount"],
            "units": r["units"],
            "pur_price": r["purPrice"]
        })
    return list(by_investor.values())

def fetch_investor_list(from_date=None, to_date=None):
    conn = get_db()
    try:
        cursor = conn.cursor()
        query = """
            SELECT inv as inv_name, pan, tax_status, SUM(amount) as total_amount, COUNT(*) as transaction_count
            FROM transactions
            WHERE 1=1
        """
        params = []
        query, params = _add_date_filters(query, params, from_date, to_date)
        query += " GROUP BY pan, inv, tax_status ORDER BY total_amount DESC"
        cursor.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        logger.error("Error fetching investor list: %s", str(e), exc_info=True)
        raise
    finally:
        conn.close()

def fetch_fund_summary(from_date=None, to_date=None):
    conn = get_db()
    try:
        cursor = conn.cursor()
        query = """
            SELECT 
                scheme, 
                scheme_type, 
                SUM(amount) as total_amount, 
                SUM(units) as total_units,
                AVG(pur_price) as avg_nav_price,
                COUNT(DISTINCT pan) as investor_count
            FROM transactions
            WHERE 1=1
        """
        params = []
        query, params = _add_date_filters(query, params, from_date, to_date)
        query += " GROUP BY scheme, scheme_type ORDER BY total_amount DESC"
        cursor.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        logger.error("Error fetching fund summary: %s", str(e), exc_info=True)
        raise
    finally:
        conn.close()

def normalize_date(date_str: str) -> str:
    """
    Normalizes any standard date string (e.g. DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD)
    to a strict, zero-padded YYYY-MM-DD format for database compatibility.
    """
    if not date_str:
        return "2025-05-27"
        
    date_str = date_str.strip().replace("/", "-")
    parts = date_str.split("-")
    if len(parts) != 3:
        return "2025-05-27"
        
    try:
        # Check if YYYY-MM-DD or YYYY-M-D
        if len(parts[0]) == 4:
            year = parts[0]
            month = parts[1].zfill(2)
            day = parts[2].zfill(2)
        # Check if DD-MM-YYYY or MM-DD-YYYY
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

def import_csv(csv_text: str):
    f = StringIO(csv_text.strip())
    reader = csv.reader(f)
    try:
        headers = next(reader)
    except StopIteration:
        return 0
        
    headers = [h.strip().lower() for h in headers]
    
    # Field mapping variants for industry robustness
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
                
    # Guess indices based on length if strict headers are missing
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
                
                # Auto-calculate metrics
                if amount == 0 and units > 0 and pur_price > 0:
                    amount = round(units * pur_price, 2)
                elif units == 0 and amount > 0 and pur_price > 0:
                    units = round(amount / pur_price, 4)

                scheme_type = get_val("scheme_type", "Equity")
                tax_status = get_val("tax_status", "Individual")
                
                cursor.execute("""
                    INSERT INTO transactions (amc, folio, scheme, inv, pan, trade_date, pur_price, units, amount, scheme_type, tax_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (amc, folio, scheme, inv, pan, trade_date, pur_price, units, amount, scheme_type, tax_status))
                count += 1
            except Exception as e:
                logger.warning("Skipping CSV row due to validation error: %s", str(e))
                continue
                
        conn.commit()
    except Exception as e:
        logger.error("Failed to commit CSV transactions to DB: %s", str(e), exc_info=True)
        conn.rollback()
        raise
    finally:
        conn.close()
        
    logger.info("Successfully imported %d transactions from CSV.", count)
    return count
