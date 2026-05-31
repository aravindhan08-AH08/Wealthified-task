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
    Connects to the PostgreSQL database using psycopg2. Automatically creates the database if it doesn't exist.
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
    except psycopg2.OperationalError as e:
        # If database does not exist, automatically create it
        if "does not exist" in str(e):
            logger.info("Database '%s' does not exist. Attempting to create it automatically...", DB_NAME)
            try:
                # Connect to default 'postgres' database
                temp_conn = psycopg2.connect(
                    host=DB_HOST,
                    port=DB_PORT,
                    database="postgres",
                    user=DB_USER,
                    password=DB_PASSWORD
                )
                temp_conn.autocommit = True
                cursor = temp_conn.cursor()
                cursor.execute(f'CREATE DATABASE "{DB_NAME}"')
                cursor.close()
                temp_conn.close()
                logger.info("Database '%s' successfully created.", DB_NAME)
                
                # Reconnect to the newly created database
                conn = psycopg2.connect(
                    host=DB_HOST,
                    port=DB_PORT,
                    database=DB_NAME,
                    user=DB_USER,
                    password=DB_PASSWORD
                )
                return conn
            except Exception as creation_err:
                logger.error("Failed to automatically create PostgreSQL database '%s': %s", DB_NAME, str(creation_err))
                raise
        else:
            logger.error("Failed to connect to PostgreSQL database: %s", str(e))
            raise
    except Exception as e:
        logger.error("Failed to connect to PostgreSQL database: %s", str(e))
        raise
