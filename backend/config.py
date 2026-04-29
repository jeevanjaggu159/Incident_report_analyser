"""
Configuration management for the Incident Report Analyzer application.
Loads settings from environment variables with appropriate defaults.
Designed for local development without Docker.
Includes optimization settings for OpenAI API.
"""
import os
from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Database Configuration
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/incident_db"
    
    # Gemini Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_EMBEDDING_MODEL: str = "models/gemini-embedding-001"
    
    # FAISS Configuration
    FAISS_INDEX_PATH: str = "./data/faiss_index.bin"
    FAISS_METADATA_PATH: str = "./data/faiss_metadata.pkl"
    
    # Application Configuration
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEMO_MODE: bool = False  # Set to True to use mock services instead of real APIs
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/app.log"
    
    # RAG Configuration
    RAG_TOP_K: int = 3  # Number of similar incidents to retrieve
    MIN_SIMILARITY_SCORE: float = 0.5
    
    # Free Tier Optimization Settings
    # These settings help stay within Google Gemini Free Tier quotas
    CACHE_ENABLED: bool = True  # Enable result caching
    CACHE_TTL_SECONDS: int = 7200  # 2-hour cache for free tier (increased retention)
    MAX_CACHE_SIZE: int = 100  # Max number of cached analyses to prevent memory issues
    
    # Request rate limiting for free tier
    MIN_REQUEST_INTERVAL_SECONDS: float = 3.0  # Minimum seconds between API calls
    ENABLE_RATE_LIMITING: bool = True  # Enable request throttling
    
    # LLM temperature (lower = more deterministic, reduces variation)
    LLM_TEMPERATURE: float = 0.3  # Lower temp uses fewer tokens typically
    
    # Max output tokens (balance detail vs. token usage)
    LLM_MAX_TOKENS: int = 2000  # Increased to prevent truncated JSON responses
    
    # Free tier retry configuration
    FREE_TIER_MAX_RETRIES: int = 5  # Retry attempts on rate limit
    FREE_TIER_INITIAL_RETRY_DELAY: int = 2  # Initial backoff in seconds
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Load settings - will use .env file if it exists
try:
    settings = Settings()
except Exception as e:
    print(f"Warning: Could not load settings from .env file: {e}")
    print("Using default configuration. Please create backend/.env file.")
    settings = Settings()

