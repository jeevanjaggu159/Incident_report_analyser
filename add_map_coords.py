import sqlite3
import os

db_path = "backend/incident_analyzer.db"

if not os.path.exists(db_path):
    print(f"Database file not found at {os.path.abspath(db_path)}")
    exit(1)

print(f"Connecting to {os.path.abspath(db_path)}")
conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    # Check if 'latitude' and 'longitude' columns exist in incidents table
    cur.execute("PRAGMA table_info(incidents)")
    columns = [col[1] for col in cur.fetchall()]
    print(f"Current columns in incidents table: {columns}")
    
    # Add latitude
    if "latitude" not in columns:
        print("Adding 'latitude' column to incidents table...")
        cur.execute("ALTER TABLE incidents ADD COLUMN latitude REAL")
        print("✓ Added latitude")
    else:
        print("✓ 'latitude' column already exists")

    # Add longitude
    if "longitude" not in columns:
        print("Adding 'longitude' column to incidents table...")
        cur.execute("ALTER TABLE incidents ADD COLUMN longitude REAL")
        print("✓ Added longitude")
    else:
        print("✓ 'longitude' column already exists")
        
    conn.commit()
    print("\nMigration successful!")

except Exception as e:
    print(f"\nMigration failed: {e}")
finally:
    conn.close()
