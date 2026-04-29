"""
FastAPI application for Incident Report Analyzer.
Main entry point for the backend API.
Production-ready without Docker dependency.
"""
import logging
import os
import json
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import numpy as np

from config import settings
from database import get_db, init_db, SessionLocal
from models import Incident, User
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


# ==================== Dependencies ====================

# Authentication has been removed. 

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


# ==================== Incident Endpoints ====================

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
            embedding=json.dumps(embedding.tolist()),
            latitude=analysis.get("latitude"),
            longitude=analysis.get("longitude")
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
    search: Optional[str] = None,
    date: Optional[str] = None,
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
        query = db.query(Incident)
        
        if search:
            search_term = f"%{search.lower()}%"
            from sqlalchemy import func
            # Support searching both the report text and the analysis root cause/category
            query = query.filter(func.lower(Incident.report_text).like(search_term))
            
        if date:
            from sqlalchemy import func
            query = query.filter(func.date(Incident.created_at) == date)
            
        incidents = query.order_by(Incident.created_at.desc())\
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
                incident_date=inc.analysis.get("incident_date", "Unknown"),
                incident_location=inc.analysis.get("incident_location", "Unknown"),
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
        location_count = {}
        daily_counts = {}
        locations_list = []
        
        for incident in incidents:
            severity = incident.analysis.get("severity", "Unknown")
            if severity in severity_count:
                severity_count[severity] += 1
                
            category = incident.analysis.get("category", "Uncategorized")
            category_count[category] = category_count.get(category, 0) + 1
            
            location = incident.analysis.get("incident_location", "Unknown")
            location_count[location] = location_count.get(location, 0) + 1
            
            # Extract coordinates for map
            lat = incident.latitude if hasattr(incident, 'latitude') else incident.analysis.get("latitude")
            lng = incident.longitude if hasattr(incident, 'longitude') else incident.analysis.get("longitude")
            
            if lat is not None and lng is not None:
                locations_list.append({
                    "id": incident.id,
                    "latitude": float(lat),
                    "longitude": float(lng),
                    "severity": severity,
                    "category": category,
                    "report_text": incident.report_text[:100] + "..." if len(incident.report_text) > 100 else incident.report_text
                })
            
            # Aggregate by actual incident date if available
            date_str = incident.analysis.get("incident_date")
            if not date_str or str(date_str).lower() == "unknown":
                date_str = incident.created_at.strftime("%Y-%m-%d") if incident.created_at else "Unknown"
            else:
                date_str = str(date_str).split('T')[0]
                
            daily_counts[date_str] = daily_counts.get(date_str, 0) + 1
            
        # Format the time series data for recharts
        time_series_data = [{"date": k, "count": v} for k, v in sorted(daily_counts.items())]
        
        logger.info(f"Analytics: total={total}, distribution={severity_count}, categories={category_count}, locations={location_count}")
        
        return AnalyticsData(
            total_incidents=total,
            severity_distribution=severity_count,
            category_distribution=category_count,
            location_distribution=location_count,
            incidents_over_time=time_series_data,
            incidents_with_location=locations_list,
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
async def chat_with_data(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Ask a natural language question about historical incident data.
    Uses RAG to find relevant incidents and generate an answer based ONLY on that data.
    """
    try:
        query = request.query
        history = [{"role": msg.role, "content": msg.content} for msg in request.history]
        logger.info(f"Received chat query: {query} with {len(history)} history messages")
        
        # 0. If the query is short or relative ("what about the first one?"), 
        # append some context from the prior history to improve embedding retrieval.
        search_query = query
        if len(history) > 0 and len(query.split()) < 10:
            last_bot_msg = next((m['content'] for m in reversed(history) if m['role'] == 'assistant'), None)
            if last_bot_msg:
                # Truncate last assistant message to essential keywords to guide vector search
                context_hint = last_bot_msg[:200]
                search_query = f"{query}. Context: {context_hint}"
                logger.debug(f"Enhanced search query for vector retrieval: {search_query}")

        # 1. Get embedding for the user's enhanced question
        logger.debug("Generating embedding for chat query...")
        embedding = embedding_service.generate_embedding(search_query)
        
        # 2. Search FAISS for relevant past incidents
        logger.debug("Searching FAISS for context...")
        relevant_incidents = rag_service.search_similar_incidents(embedding)
        
        # 2.5 Also check for explicit incident IDs in the query
        import re
        explicit_ids = [int(m) for m in re.findall(r'(?:incident|report|id|#)\s*(?:number\s*)?#?\s*(\d+)', query.lower())]
        if explicit_ids:
            logger.info(f"Detected explicit incident IDs in query: {explicit_ids}")
            # Filter out IDs already in relevant_incidents to avoid duplicates
            existing_ids = {inc.get("incident_id") for inc in relevant_incidents}
            missing_ids = [i for i in explicit_ids if i not in existing_ids][:3] # Max 3 to fit constraints
            
            if missing_ids:
                # Fetch missing explicit incidents from DB
                db_incidents = db.query(Incident).filter(Incident.id.in_(missing_ids)).all()
                for i, db_inc in enumerate(db_incidents):
                    logger.info(f"Adding explicitly requested incident {db_inc.id} to context")
                    # Analysis might be missing on older records, fallback
                    analysis_data = db_inc.analysis or {}
                    relevant_incidents.insert(i, {
                        "incident_id": db_inc.id,
                        "report_text": db_inc.report_text,
                        "analysis": analysis_data,
                        "similarity_score": 1.0  # Max score for explicit requests
                    })
                    
        # Limit total chunks to RAG_TOP_K * 2 to avoid token limits
        relevant_incidents = relevant_incidents[:10]
        
        # 3. Format context sources for the response
        sources = []
        for incident in relevant_incidents:
            sources.append({
                "id": incident.get("incident_id"),
                "similarity": incident.get("similarity_score"),
                "category": incident.get("analysis", {}).get("category", "Unknown"),
                "report_text": incident.get("report_text", ""),
                "analysis": incident.get("analysis", {})
            })
            
        # 4. Ask LLM to answer the question using the context and history
        logger.debug("Generating answer with LLM...")
        answer = llm_service.answer_question_with_context(query, relevant_incidents, history=history)
        
        # 5. Check if the LLM deemed the query irrelevant to the context
        if answer.startswith("[IRRELEVANT]"):
            answer = answer.replace("[IRRELEVANT]", "").strip()
            sources = [] # Clear sources so cards don't render for greetings
            logger.info("Query deemed irrelevant to specific incidents; clearing sources list.")
        else:
            # Parse SOURCES: [...] from the answer
            import re
            sources_match = re.search(r'SOURCES:\s*\[(.*?)\]', answer)
            if sources_match:
                try:
                    ids_str = sources_match.group(1)
                    if ids_str.strip():
                        used_ids = {int(i.strip()) for i in ids_str.split(',') if i.strip().isdigit()}
                    else:
                        used_ids = set()
                    
                    # Filter sources to only include those actually used by the LLM
                    sources = [s for s in sources if s['id'] in used_ids]
                    logger.info(f"LLM indicated it used specific incident IDs: {used_ids}. Filtering sources.")
                    
                    # Remove the SOURCES: [...] line from the final answer
                    answer = re.sub(r'\n*SOURCES:\s*\[.*?\]\s*', '', answer).strip()
                except Exception as e:
                    logger.warning(f"Failed to parse SOURCES from LLM answer: {e}")
        
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
