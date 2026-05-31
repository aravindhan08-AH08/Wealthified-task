import logging
from fastapi import FastAPI, UploadFile, File, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Configure production-ready system logging
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
    # Initialize the SQLite DB on application startup
    try:
        init_db()
        yield
    except Exception as e:
        logger.critical("Application startup failed due to database error: %s", str(e))
        raise

app = FastAPI(
    title="Mutual Fund Dashboard API",
    description="Production-grade API for mutual fund transaction summaries and CSV imports",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for standard local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits all origins for easy local development/testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/transactions")
def get_transactions(
    from_date: str = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: str = Query(None, description="End date (YYYY-MM-DD)")
):
    logger.info("GET /api/transactions requested with from_date=%s, to_date=%s", from_date, to_date)
    try:
        data = fetch_all_transactions(from_date, to_date)
        return {"data": data}
    except Exception as e:
        logger.error("GET /api/transactions failed: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal server error occurred while retrieving transactions.")

@app.get("/api/investor-fund-summary")
def get_investor_fund_summary(
    from_date: str = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: str = Query(None, description="End date (YYYY-MM-DD)")
):
    logger.info("GET /api/investor-fund-summary requested with from_date=%s, to_date=%s", from_date, to_date)
    try:
        data = fetch_investor_fund_summary(from_date, to_date)
        return {"data": data}
    except Exception as e:
        logger.error("GET /api/investor-fund-summary failed: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal server error occurred while building investor-fund summary.")

@app.get("/api/fund-investor-summary")
def get_fund_investor_summary(
    from_date: str = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: str = Query(None, description="End date (YYYY-MM-DD)")
):
    logger.info("GET /api/fund-investor-summary requested with from_date=%s, to_date=%s", from_date, to_date)
    try:
        data = fetch_fund_investor_summary(from_date, to_date)
        return {"data": data}
    except Exception as e:
        logger.error("GET /api/fund-investor-summary failed: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal server error occurred while building fund-investor summary.")

@app.get("/api/investor-list")
def get_investor_list(
    from_date: str = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: str = Query(None, description="End date (YYYY-MM-DD)")
):
    logger.info("GET /api/investor-list requested with from_date=%s, to_date=%s", from_date, to_date)
    try:
        data = fetch_investor_list(from_date, to_date)
        return {"data": data}
    except Exception as e:
        logger.error("GET /api/investor-list failed: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal server error occurred while retrieving investor list.")

@app.get("/api/fund-summary")
def get_fund_summary(
    from_date: str = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: str = Query(None, description="End date (YYYY-MM-DD)")
):
    logger.info("GET /api/fund-summary requested with from_date=%s, to_date=%s", from_date, to_date)
    try:
        data = fetch_fund_summary(from_date, to_date)
        return {"data": data}
    except Exception as e:
        logger.error("GET /api/fund-summary failed: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal server error occurred while retrieving mutual fund summary.")

@app.post("/api/upload-csv")
async def upload_csv_file(file: UploadFile = File(...)):
    logger.info("POST /api/upload-csv requested with file=%s", file.filename)
    if not file.filename.endswith('.csv'):
        logger.warning("Rejected file upload: %s is not a CSV", file.filename)
        raise HTTPException(status_code=400, detail="Invalid file type. Only CSV files are allowed.")
    try:
        content = await file.read()
        csv_text = content.decode("utf-8", errors="ignore")
        count = import_csv(csv_text)
        return {
            "success": True,
            "message": f"Successfully imported {count} transactions from {file.filename}."
        }
    except Exception as e:
        logger.error("POST /api/upload-csv failed: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to parse and import mutual fund CSV transactions.")

@app.post("/api/reset-db")
def reset_database():
    logger.info("POST /api/reset-db requested")
    try:
        reset_db()
        return {
            "success": True,
            "message": "Database successfully cleared and re-seeded with standard demo mutual fund records."
        }
    except Exception as e:
        logger.error("POST /api/reset-db failed: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to reset and re-seed the SQLite database.")
