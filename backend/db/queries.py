import logging
import psycopg2.extras
from db.connection import get_db

logger = logging.getLogger("mutual-fund-api.db.queries")

def _add_date_filters(query, params, from_date, to_date):
    """
    Appends date filtration criteria using PostgreSQL %s placeholder syntax.
    """
    if from_date:
        query += " AND trade_date >= %s"
        params.append(from_date)
    if to_date:
        query += " AND trade_date <= %s"
        params.append(to_date)
    return query, params

def fetch_all_transactions(from_date=None, to_date=None):
    """
    Retrieves all transactions within the specified date range.
    """
    conn = get_db()
    try:
        # Use RealDictCursor to return results as dictionaries
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        query = """
            SELECT 
                amc, folio, scheme, inv, pan, 
                trade_date as "tradeDate", 
                CAST(pur_price AS FLOAT) as "purPrice", 
                CAST(units AS FLOAT) as units, 
                CAST(amount AS FLOAT) as amount, 
                scheme_type as "schemeType", 
                tax_status as "taxStatus" 
            FROM transactions 
            WHERE 1=1
        """
        params = []
        query, params = _add_date_filters(query, params, from_date, to_date)
        query += " ORDER BY trade_date DESC"
        
        cursor.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        logger.error("Error fetching transactions: %s", str(e))
        raise
    finally:
        conn.close()

def fetch_investor_fund_summary(from_date=None, to_date=None):
    """
    Builds a summary of investments grouped by mutual fund schemes.
    """
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
    """
    Builds a summary of holdings grouped by investor PAN.
    """
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
    """
    Retrieves all unique investors with aggregated investment amounts.
    """
    conn = get_db()
    try:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        query = """
            SELECT 
                inv as inv_name, 
                pan, 
                tax_status, 
                CAST(SUM(amount) AS FLOAT) as total_amount, 
                COUNT(*) as transaction_count
            FROM transactions
            WHERE 1=1
        """
        params = []
        query, params = _add_date_filters(query, params, from_date, to_date)
        query += " GROUP BY pan, inv, tax_status ORDER BY total_amount DESC"
        
        cursor.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        logger.error("Error fetching investor list: %s", str(e))
        raise
    finally:
        conn.close()

def fetch_fund_summary(from_date=None, to_date=None):
    """
    Retrieves a performance summary of active mutual fund schemes.
    """
    conn = get_db()
    try:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        query = """
            SELECT 
                scheme, 
                scheme_type, 
                CAST(SUM(amount) AS FLOAT) as total_amount, 
                CAST(SUM(units) AS FLOAT) as total_units,
                CAST(AVG(pur_price) AS FLOAT) as avg_nav_price,
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
        logger.error("Error fetching fund summary: %s", str(e))
        raise
    finally:
        conn.close()
