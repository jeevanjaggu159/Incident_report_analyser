"""
Database connection and session management using SQLAlchemy.
Provides database engine and session factory for ORM operations.
Optimized for local PostgreSQL without Docker.
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from config import settings
import logging

logger = logging.getLogger(__name__)

# Create database engine with connection pooling
# QueuePool is better for production scenarios with concurrency
# SQLite doesn't support connect_timeout, so we use conditional configuration
if 'sqlite' in settings.DATABASE_URL:
    engine = create_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        poolclass=QueuePool,
        pool_size=20,
        max_overflow=0,
        echo=settings.DEBUG,
        connect_args={"connect_timeout": 10}
    )

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def get_db() -> Session:
    """
    Dependency injection function for FastAPI routes.
    Provides database session and ensures cleanup.
    
    Usage:
        async def my_route(db: Session = Depends(get_db)):
            # Use db here
            pass
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    """
    Initialize database tables from models.
    Creates all tables defined in SQLAlchemy models if they don't exist.
    """
    try:
        from models import Base
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        raise


def check_db_connection():
    """
    Check if database connection is working.
    Useful for health checks and startup verification.
    
    Returns:
        bool: True if connection successful, False otherwise
    """
    try:
        with engine.connect() as connection:
            connection.execute("SELECT 1")
        logger.info("Database connection successful")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        return False

