import logging
from fastapi import FastAPI, UploadFile, File, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("mutual-fund-api")

from app.database import (
    init_db,
    reset_db,
    fetch_all_transactions,
    fetch_investor_fund_summary,
    fetch_fund_investor_summary,
    fetch_investor_list,
    fetch_fund_summary,
    import_csv
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database on startup
    try:
        init_db()
        yield
    except Exception as e:
        logger.critical("Failed to initialize database: %s", str(e))
        raise

app = FastAPI(
    title="Mutual Fund API",
    description="API for mutual fund transaction summaries and CSV imports",
    version="1.0.0",
    lifespan=lifespan
)

# Set up CORS middleware for local frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/transactions")
def get_transactions(
    from_date: str = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: str = Query(None, description="End date (YYYY-MM-DD)")
):
    logger.info("Transactions list requested (from: %s, to: %s)", from_date, to_date)
    try:
        data = fetch_all_transactions(from_date, to_date)
        return {"data": data}
    except Exception as e:
        logger.error("Failed to retrieve transactions: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve transaction records.")

@app.get("/api/investor-fund-summary")
def get_investor_fund_summary(
    from_date: str = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: str = Query(None, description="End date (YYYY-MM-DD)")
):
    logger.info("Investor fund summary requested (from: %s, to: %s)", from_date, to_date)
    try:
        data = fetch_investor_fund_summary(from_date, to_date)
        return {"data": data}
    except Exception as e:
        logger.error("Failed to retrieve investor fund summary: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to build investor fund summary.")

@app.get("/api/fund-investor-summary")
def get_fund_investor_summary(
    from_date: str = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: str = Query(None, description="End date (YYYY-MM-DD)")
):
    logger.info("Fund investor summary requested (from: %s, to: %s)", from_date, to_date)
    try:
        data = fetch_fund_investor_summary(from_date, to_date)
        return {"data": data}
    except Exception as e:
        logger.error("Failed to retrieve fund investor summary: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to build fund investor summary.")

@app.get("/api/investor-list")
def get_investor_list(
    from_date: str = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: str = Query(None, description="End date (YYYY-MM-DD)")
):
    logger.info("Investor profiles list requested (from: %s, to: %s)", from_date, to_date)
    try:
        data = fetch_investor_list(from_date, to_date)
        return {"data": data}
    except Exception as e:
        logger.error("Failed to retrieve investor profiles: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve investor profile list.")

@app.get("/api/fund-summary")
def get_fund_summary(
    from_date: str = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: str = Query(None, description="End date (YYYY-MM-DD)")
):
    logger.info("Mutual schemes summary requested (from: %s, to: %s)", from_date, to_date)
    try:
        data = fetch_fund_summary(from_date, to_date)
        return {"data": data}
    except Exception as e:
        logger.error("Failed to retrieve schemes summary: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve mutual fund schemes list.")

@app.post("/api/upload-csv")
async def upload_csv_file(file: UploadFile = File(...)):
    logger.info("CSV file upload requested: %s", file.filename)
    if not file.filename.lower().endswith('.csv'):
        logger.warning("Rejected file: %s is not a CSV", file.filename)
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
    try:
        content = await file.read()
        csv_text = content.decode("utf-8", errors="ignore")
        count = import_csv(csv_text)
        return {
            "success": True,
            "message": f"Successfully imported {count} transactions from {file.filename}."
        }
    except Exception as e:
        logger.error("CSV import failed: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to parse and import CSV file.")

@app.post("/api/reset-db")
def reset_database():
    logger.info("Database reset requested")
    try:
        reset_db()
        return {
            "success": True,
            "message": "Database reset successful. Default mock records restored."
        }
    except Exception as e:
        logger.error("Database reset failed: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to reset and re-seed database.")
