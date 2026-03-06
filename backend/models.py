"""
SQLAlchemy ORM models for the Incident Report Analyzer.
Defines the database schema for storing incident reports and their analysis.
"""
from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import json

Base = declarative_base()


class Incident(Base):
    """
    Incident model for storing incident reports and their analysis.
    
    Attributes:
        id: Primary key
        report_text: Original incident report text
        analysis: JSON object containing analysis results
        embedding: Vector embedding for similarity search
        created_at: Timestamp of when the report was created
    """
    __tablename__ = "incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    report_text = Column(Text, nullable=False)
    analysis = Column(JSON, nullable=False)
    # Using TEXT to store embedding as JSON array (since pgvector might not be installed)
    embedding = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Incident(id={self.id}, created_at={self.created_at})>"
    
    def to_dict(self):
        """Convert model instance to dictionary."""
        return {
            "id": self.id,
            "report_text": self.report_text,
            "analysis": self.analysis,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
