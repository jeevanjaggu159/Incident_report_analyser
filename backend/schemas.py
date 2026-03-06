"""
Pydantic schemas for request/response validation.
Ensures type safety and automatic documentation generation.
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class AnalysisRequest(BaseModel):
    """Schema for incident analysis request."""
    report_text: str = Field(..., min_length=10, max_length=5000, 
                             description="The incident/accident report text")
    
    class Config:
        json_schema_extra = {
            "example": {
                "report_text": "A truck collided with a car at the intersection of Main and Oak Street..."
            }
        }


class AnalysisResult(BaseModel):
    """Schema for structured analysis output."""
    category: str = Field(default="Uncategorized", description="Category or type of incident")
    root_cause: str = Field(..., description="The primary root cause of the incident")
    contributing_factors: List[str] = Field(..., description="List of contributing factors")
    severity: str = Field(..., description="Severity level: Critical, High, Medium, Low")
    prevention_measures: List[str] = Field(..., description="Recommended prevention measures")


class AnalysisResponse(BaseModel):
    """Schema for API response."""
    id: int = Field(..., description="Incident ID in database")
    report_text: str = Field(..., description="Original report text")
    analysis: AnalysisResult = Field(..., description="Analysis results")
    similar_incidents: List[int] = Field(default=[], description="IDs of similar incidents from history")
    created_at: datetime = Field(..., description="Timestamp of creation")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "report_text": "A truck collided with a car...",
                "analysis": {
                    "category": "Vehicle Collision",
                    "root_cause": "Driver distraction",
                    "contributing_factors": ["Poor visibility", "Speed"],
                    "severity": "High",
                    "prevention_measures": ["Driver training", "Speed reduction"]
                },
                "similar_incidents": [2, 5],
                "created_at": "2026-03-02T10:30:00"
            }
        }


class IncidentHistory(BaseModel):
    """Schema for incident history item."""
    id: int
    report_text: str
    category: str
    severity: str
    root_cause: str
    created_at: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "report_text": "A truck collided...",
                "category": "Vehicle Collision",
                "severity": "High",
                "root_cause": "Driver distraction",
                "created_at": "2026-03-02T10:30:00"
            }
        }


class AnalyticsData(BaseModel):
    """Schema for analytics data."""
    total_incidents: int
    severity_distribution: dict = Field(
        ..., 
        description="Count of incidents by severity level"
    )
    category_distribution: dict = Field(
        ..., 
        description="Count of incidents by category"
    )
    incidents_over_time: List[dict] = Field(
        default=[],
        description="Time-series data of incident counts"
    )
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int


class ChatRequest(BaseModel):
    """Schema for a RAG chat query."""
    query: str = Field(..., description="The user's question about the incident data")

class ChatResponse(BaseModel):
    """Schema for the RAG chat answer."""
    answer: str = Field(..., description="The AI-generated answer based on context")
    sources: List[dict] = Field(default=[], description="List of source incidents used for context")

class ErrorResponse(BaseModel):
    """Schema for error responses."""
    detail: str = Field(..., description="Error message")
    status_code: int = Field(..., description="HTTP status code")
    
    class Config:
        json_schema_extra = {
            "example": {
                "detail": "Invalid request",
                "status_code": 400
            }
        }
