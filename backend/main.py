"""
FastAPI application for Incident Report Analyzer.
Main entry point for the backend API.
Production-ready without Docker dependency.
"""
import logging
import os
import json
from typing import List
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import numpy as np

from config import settings
from database import get_db, init_db, SessionLocal
from models import Incident
from schemas import (
    AnalysisRequest, AnalysisResponse, IncidentHistory, 
    AnalyticsData, ErrorResponse, ChatRequest, ChatResponse
)

# Conditional imports based on DEMO_MODE
if settings.DEMO_MODE:
    from services.mock_embedding_service import mock_embedding_service as embedding_service
    from services.mock_llm_service import mock_llm_service as llm_service
else:
    from services.embedding_service import embedding_service
    from services.llm_service import llm_service

from services.rag_service import rag_service

# Configure logging
os.makedirs("logs", exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    Handles initialization and cleanup of resources.
    """
    # Startup
    logger.info("=== Starting Incident Report Analyzer ===")
    if settings.DEMO_MODE:
        logger.warning("DEMO MODE ENABLED - Using simulated AI responses (no API calls)")
    try:
        try:
            init_db()
            logger.info("Database initialized successfully")
            
            # Rebuild FAISS index from existing incidents
            try:
                session = SessionLocal()
                try:
                    incidents = session.query(
                        Incident.id, 
                        Incident.embedding, 
                        Incident.report_text, 
                        Incident.analysis
                    ).all()
                    
                    if incidents:
                        logger.info(f"Rebuilding FAISS index from {len(incidents)} existing incidents")
                        
                        # Convert embeddings from JSON strings to numpy arrays
                        processed_incidents = []
                        for incident_id, embedding_json, report_text, analysis in incidents:
                            try:
                                if embedding_json:
                                    embedding = json.loads(embedding_json) if isinstance(embedding_json, str) else embedding_json
                                    processed_incidents.append((incident_id, embedding, report_text, analysis))
                            except Exception as e:
                                logger.warning(f"Could not process incident {incident_id}: {str(e)}")
                        
                        if processed_incidents:
                            rag_service.rebuild_index_from_db(processed_incidents)
                            logger.info(f"FAISS index rebuilt with {len(processed_incidents)} incidents")
                    else:
                        logger.info("No existing incidents found, starting with empty FAISS index")
                finally:
                    session.close()
            except Exception as e:
                logger.warning(f"Could not rebuild FAISS index on startup: {str(e)}")
                logger.info("FAISS index will be populated as new incidents are analyzed")
                
        except Exception as e:
            logger.warning(f"Database connection failed: {str(e)}")
            logger.warning("Starting application in demo mode (without database persistence)")
            logger.info("Analysis results will not be saved to database, but API will still work")
    
    except Exception as e:
        logger.error(f"Startup error: {str(e)}", exc_info=True)
        logger.info("Continuing startup despite errors...")
    
    yield
    
    # Shutdown
    logger.info("=== Shutting down Incident Report Analyzer ===")
    try:
        logger.info("Cleanup completed")
    except Exception as e:
        logger.error(f"Shutdown error: {str(e)}")


# Create FastAPI app
app = FastAPI(
    title="Incident Report Analyzer",
    description="Gen AI application for analyzing transportation incident reports",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Helper Functions ====================

def parse_embedding_json(embedding_json) -> np.ndarray:
    """Parse embedding from JSON string or list."""
    if isinstance(embedding_json, str):
        try:
            embedding = json.loads(embedding_json)
        except json.JSONDecodeError:
            embedding = []
    else:
        embedding = embedding_json or []
    return np.array(embedding, dtype=np.float32) if embedding else np.array([])


# ==================== API Endpoints ====================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    logger.debug("Health check called")
    return {
        "status": "healthy",
        "service": "Incident Report Analyzer",
        "version": "1.0.0"
    }


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_incident(
    request: AnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Analyze an incident report using LLM with RAG.
    
    - Generates embedding from report text
    - Searches for similar incidents
    - Uses LLM to generate structured analysis
    - Stores results in database
    - Returns analysis with similar incidents
    """
    try:
        logger.info("Received incident analysis request")
        logger.debug(f"Report text: {request.report_text[:100]}...")
        
        # Validate input
        if not request.report_text or len(request.report_text.strip()) < 10:
            logger.warning("Invalid report text received")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Report text must be at least 10 characters long"
            )
        
        # Step 1: Generate embedding
        logger.info("Generating embedding for report")
        embedding = embedding_service.generate_embedding(request.report_text)
        logger.debug(f"Embedding shape: {embedding.shape}")
        
        # Step 2: Search for similar incidents (RAG)
        logger.info("Searching for similar incidents")
        similar_results = rag_service.search_similar_incidents(embedding)
        
        # Prepare context for LLM
        context_reports = [
            {
                "report_text": result["report_text"],
                "analysis": result["analysis"]
            }
            for result in similar_results
        ]
        logger.info(f"Found {len(context_reports)} similar incidents")
        
        # Step 3: Analyze with LLM
        logger.info("Calling LLM for analysis")
        analysis = llm_service.analyze_incident(request.report_text, context_reports)
        
        # Validate analysis output
        if not llm_service.validate_analysis_output(analysis):
            logger.error("Invalid analysis output from LLM")
            raise ValueError("LLM produced invalid analysis output")
        
        logger.info(f"Analysis generated: severity={analysis['severity']}")
        
        # Step 4: Store in database
        logger.info("Storing incident in database")
        incident = Incident(
            report_text=request.report_text,
            analysis=analysis,
            embedding=json.dumps(embedding.tolist())
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)
        logger.info(f"Incident stored with ID: {incident.id}")
        
        # Step 5: Add to FAISS index
        logger.info("Adding incident to FAISS index")
        rag_service.add_incident(
            incident.id,
            embedding,
            request.report_text,
            analysis
        )
        
        # Prepare response
        similar_ids = [result["incident_id"] for result in similar_results]
        
        response = AnalysisResponse(
            id=incident.id,
            report_text=request.report_text,
            analysis=analysis,
            similar_incidents=similar_ids,
            created_at=incident.created_at
        )
        
        logger.info("Analysis request completed successfully")
        return response
        
    except HTTPException:
        raise
    except ValueError as e:
        error_msg = str(e)
        logger.error(f"Validation error during analysis: {error_msg}", exc_info=True)
        
        # Check if it's a quota/rate limit error
        if "quota" in error_msg.lower() or "rate limit" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": error_msg,
                    "suggestion": "Please upgrade your Google Gemini API plan at https://ai.google.dev",
                    "retry_after": 300
                }
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
    except Exception as e:
        logger.error(f"Error during analysis: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@app.get("/api/history", response_model=List[IncidentHistory])
async def get_history(
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Get history of analyzed incidents with pagination.
    
    Query Parameters:
    - limit: Number of records to return (default: 20, max: 100)
    - offset: Number of records to skip (default: 0)
    """
    try:
        logger.info(f"Fetching history: limit={limit}, offset={offset}")
        
        # Validate limits
        if limit > 100:
            limit = 100
        if limit < 1:
            limit = 1
        if offset < 0:
            offset = 0
        
        # Query incidents
        incidents = db.query(Incident)\
            .order_by(Incident.created_at.desc())\
            .offset(offset)\
            .limit(limit)\
            .all()
        
        logger.info(f"Retrieved {len(incidents)} incidents from history")
        
        # Convert to response schema
        history = [
            IncidentHistory(
                id=inc.id,
                report_text=inc.report_text[:100] + "..." if len(inc.report_text) > 100 else inc.report_text,
                category=inc.analysis.get("category", "Uncategorized"),
                severity=inc.analysis.get("severity", "Unknown"),
                root_cause=inc.analysis.get("root_cause", "Unknown"),
                created_at=inc.created_at
            )
            for inc in incidents
        ]
        
        return history
        
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch history: {str(e)}"
        )


@app.get("/api/incident/{incident_id}", response_model=AnalysisResponse)
async def get_incident(
    incident_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific incident.
    
    Path Parameters:
    - incident_id: ID of the incident to retrieve
    """
    try:
        logger.info(f"Fetching incident {incident_id}")
        
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        
        if not incident:
            logger.warning(f"Incident {incident_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Incident {incident_id} not found"
            )
        
        # Ensure category exists in older database entries
        analysis_data = incident.analysis.copy() if incident.analysis else {}
        if "category" not in analysis_data:
            analysis_data["category"] = "Uncategorized"
            
        response = AnalysisResponse(
            id=incident.id,
            report_text=incident.report_text,
            analysis=analysis_data,
            similar_incidents=[],
            created_at=incident.created_at
        )
        
        logger.info(f"Successfully retrieved incident {incident_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching incident: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch incident: {str(e)}"
        )


from datetime import datetime

@app.get("/api/analytics", response_model=AnalyticsData)
async def get_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get analytics data about all analyzed incidents.
    
    Returns:
    - Total number of incidents
    - Distribution by severity level
    - Counts for each severity
    - Time-series data
    """
    try:
        logger.info(f"Fetching analytics data (start: {start_date}, end: {end_date})")
        
        query = db.query(Incident)
        
        if start_date:
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                query = query.filter(Incident.created_at >= start_dt)
            except ValueError:
                pass # Ignore malformed dates
                
        if end_date:
            try:
                # Add one day to include the entire end_date
                end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
                query = query.filter(Incident.created_at <= end_dt)
            except ValueError:
                pass
                
        incidents = query.all()
        total = len(incidents)
        
        # Count by severity and category
        severity_count = {
            "Critical": 0,
            "High": 0,
            "Medium": 0,
            "Low": 0
        }
        category_count = {}
        daily_counts = {}
        
        for incident in incidents:
            severity = incident.analysis.get("severity", "Unknown")
            if severity in severity_count:
                severity_count[severity] += 1
                
            category = incident.analysis.get("category", "Uncategorized")
            category_count[category] = category_count.get(category, 0) + 1
            
            # Aggregate by date strictly (YYYY-MM-DD)
            date_str = incident.created_at.strftime("%Y-%m-%d") if incident.created_at else "Unknown"
            daily_counts[date_str] = daily_counts.get(date_str, 0) + 1
            
        # Format the time series data for recharts
        time_series_data = [{"date": k, "count": v} for k, v in sorted(daily_counts.items())]
        
        logger.info(f"Analytics: total={total}, distribution={severity_count}, categories={category_count}")
        
        return AnalyticsData(
            total_incidents=total,
            severity_distribution=severity_count,
            category_distribution=category_count,
            incidents_over_time=time_series_data,
            critical_count=severity_count["Critical"],
            high_count=severity_count["High"],
            medium_count=severity_count["Medium"],
            low_count=severity_count["Low"]
        )
        
    except Exception as e:
        logger.error(f"Error fetching analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch analytics: {str(e)}"
        )


@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_data(request: ChatRequest):
    """
    Ask a natural language question about historical incident data.
    Uses RAG to find relevant incidents and generate an answer based ONLY on that data.
    """
    try:
        query = request.query
        logger.info(f"Received chat query: {query}")
        
        # 1. Get embedding for the user's question
        logger.debug("Generating embedding for chat query...")
        embedding = embedding_service.generate_embedding(query)
        
        # 2. Search FAISS for relevant past incidents
        logger.debug("Searching FAISS for context...")
        relevant_incidents = rag_service.search_similar_incidents(embedding)
        
        # 3. Format context sources for the response
        sources = []
        for incident in relevant_incidents:
            sources.append({
                "id": incident.get("incident_id"),
                "similarity": incident.get("similarity_score"),
                "category": incident.get("analysis", {}).get("category", "Unknown")
            })
            
        # 4. Ask LLM to answer the question using the context
        logger.debug("Generating answer with LLM...")
        answer = llm_service.answer_question_with_context(query, relevant_incidents)
        
        return ChatResponse(
            answer=answer,
            sources=sources
        )
        
    except Exception as e:
        logger.error(f"Error processing chat query: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat query: {str(e)}"
        )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "status_code": 500
        }
    )


if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server on {settings.HOST}:{settings.PORT}")
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
