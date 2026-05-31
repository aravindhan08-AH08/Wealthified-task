import logging
from db.connection import get_db

logger = logging.getLogger("mutual-fund-api.db.seeder")

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

def init_db():
    """
    Initializes PostgreSQL tables and indexes. Seeds default demo data if empty.
    """
    logger.info("Initializing PostgreSQL database tables...")
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                amc VARCHAR(255),
                folio VARCHAR(255),
                scheme VARCHAR(255),
                inv VARCHAR(255),
                pan VARCHAR(50),
                trade_date VARCHAR(50),
                pur_price NUMERIC(15, 4),
                units NUMERIC(15, 4),
                amount NUMERIC(15, 2),
                scheme_type VARCHAR(100),
                tax_status VARCHAR(100)
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_trade_date ON transactions(trade_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_pan ON transactions(pan)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_scheme ON transactions(scheme)")
        conn.commit()

        cursor.execute("SELECT COUNT(*) as count FROM transactions")
        count = cursor.fetchone()[0]
        if count == 0:
            logger.info("Transactions table is empty. Seeding default data...")
            seed_default_data(conn)
        
        logger.info("Database initialization completed successfully.")
    except Exception as e:
        logger.error("Failed to initialize database: %s", str(e))
        conn.rollback()
        raise
    finally:
        conn.close()

def seed_default_data(conn):
    """
    Seeds default demo records into the transactions table.
    """
    cursor = conn.cursor()
    for row in DEFAULT_DATA:
        cursor.execute("""
            INSERT INTO transactions (amc, folio, scheme, inv, pan, trade_date, pur_price, units, amount, scheme_type, tax_status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            row["amc"], row["folio"], row["scheme"], row["inv"], row["pan"],
            row["trade_date"], row["pur_price"], row["units"], row["amount"],
            row["scheme_type"], row["tax_status"]
        ))
    conn.commit()

def reset_db():
    """
    Clears the transactions table and re-seeds it with default demo data.
    """
    logger.info("Resetting PostgreSQL database to default records...")
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("TRUNCATE TABLE transactions RESTART IDENTITY")
        seed_default_data(conn)
        logger.info("Database reset completed successfully.")
    except Exception as e:
        logger.error("Failed to reset database: %s", str(e))
        conn.rollback()
        raise
    finally:
        conn.close()
