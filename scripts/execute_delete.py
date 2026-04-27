import os
import psycopg
from dotenv import load_dotenv

# Load env vars from the backend directory
dotenv_path = os.path.join(os.path.dirname(__file__), '../tutorpaes/backend/.env')
load_dotenv(dotenv_path)

db_url = os.environ.get("ALEMBIC_DATABASE_URL")
if not db_url:
    db_url = os.environ.get("DATABASE_URL")

# Convert sqlalchemy URL to psycopg connection string if needed
# (DATABASE_URL=postgresql+psycopg://mvp:mvp@127.0.0.1:5432/mvp_db)
if db_url and db_url.startswith("postgresql+psycopg://"):
    db_url = db_url.replace("postgresql+psycopg://", "postgresql://")

sql_file = os.path.join(os.path.dirname(__file__), 'delete_questions.sql')

try:
    with open(sql_file, 'r') as f:
        sql = f.read()

    print(f"Connecting to database...")
    with psycopg.connect(db_url) as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            rows_deleted = cur.rowcount
            conn.commit()
            print(f"✅ Success! Deleted {rows_deleted} questions.")
except Exception as e:
    print(f"❌ Error: {e}")
