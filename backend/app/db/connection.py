import os
import logging
import psycopg2
import psycopg2.extras

logger = logging.getLogger("mutual-fund-api.db.connection")

# Get database connection credentials from environment variables or defaults
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "wealthify")
DB_USER = os.environ.get("DB_USER", "postgres")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "postgres")

def get_db():
    """
    Connects to the PostgreSQL database using psycopg2.
    """
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return conn
    except Exception as e:
        logger.error("Failed to connect to PostgreSQL database: %s", str(e))
        raise
