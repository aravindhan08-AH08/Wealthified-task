# ============================================================
# database.py — Database Facade (Re-exporting Submodules)
# ============================================================

# Re-exporting database connection helpers from local db package
from db.connection import get_db

# Re-exporting setup, seeding and reset logic
from db.seeder import init_db, reset_db

# Re-exporting database query functions
from db.queries import (
    fetch_all_transactions,
    fetch_investor_fund_summary,
    fetch_fund_investor_summary,
    fetch_investor_list,
    fetch_fund_summary
)

# Re-exporting import and date normalization functions
from db.importer import import_csv, normalize_date
