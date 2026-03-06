#!/bin/bash
# Initialize database script

echo "Initializing PostgreSQL database..."

# Wait for PostgreSQL to be ready
until psql -h "$DB_HOST" -U "$DB_USER" -d "postgres" -c '\q' 2>/dev/null; do
  echo "Waiting for PostgreSQL to start..."
  sleep 1
done

# Create database if it doesn't exist
psql -h "$DB_HOST" -U "$DB_USER" -d "postgres" -c "CREATE DATABASE incident_analyzer_db;"

echo "Database initialized successfully!"
