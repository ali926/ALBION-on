import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.getcwd(), "data", "albion_local.db")
SCHEMA_PATH = os.path.join(os.getcwd(), "backend", "app", "db", "schema.sql")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database with the schema."""
    if not os.path.exists("data"):
        os.makedirs("data")
        
    conn = get_db_connection()
    with open(SCHEMA_PATH, 'r') as f:
        schema = f.read()
    
    conn.executescript(schema)
    conn.commit()
    conn.close()
    print(f"[{datetime.now()}] Database initialized at {DB_PATH}")

if __name__ == "__main__":
    init_db()
