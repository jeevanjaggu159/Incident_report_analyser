import sqlite3
import os

db_path = "backend/incident_analyzer.db"
print(f"Connecting to {os.path.abspath(db_path)}")
conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    # Check if 'role' column exists in users table
    cur.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cur.fetchall()]
    print(f"Current columns in users table: {columns}")
    
    if "role" in columns:
        print("Migrating users table to remove 'role' column...")
        cur.execute("CREATE TABLE users_new (id INTEGER PRIMARY KEY, username VARCHAR(50) NOT NULL UNIQUE, hashed_password VARCHAR(255) NOT NULL, is_active INTEGER DEFAULT 1)")
        cur.execute("INSERT INTO users_new (id, username, hashed_password, is_active) SELECT id, username, hashed_password, is_active FROM users")
        cur.execute("DROP TABLE users")
        cur.execute("ALTER TABLE users_new RENAME TO users")
        conn.commit()
        print("Migration successful.")
    else:
        print("No migration needed, 'role' column not found.")
except Exception as e:
    print(f"Migration failed: {e}")
finally:
    conn.close()
