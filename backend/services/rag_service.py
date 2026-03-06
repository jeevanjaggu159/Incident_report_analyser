"""
RAG (Retrieval Augmented Generation) service for similarity search and context retrieval.
Uses FAISS for efficient vector similarity search.
"""
import logging
import pickle
import os
import numpy as np
import faiss
from typing import List, Dict, Tuple
from config import settings
from services.embedding_service import embedding_service

logger = logging.getLogger(__name__)


class RAGService:
    """Service for RAG operations using FAISS."""
    
    def __init__(self):
        """Initialize RAG service and load or create FAISS index."""
        self.index_path = settings.FAISS_INDEX_PATH
        self.metadata_path = settings.FAISS_METADATA_PATH
        self.top_k = settings.RAG_TOP_K
        self.min_similarity = settings.MIN_SIMILARITY_SCORE
        
        # Ensure data directory exists
        os.makedirs(os.path.dirname(self.index_path) or ".", exist_ok=True)
        
        self.index = None
        self.metadata = []
        
        # Determine embedding dimension based on model
        if settings.DEMO_MODE:
            self.dimension = 384  # Mock embedding dimension
        else:
            self.dimension = 3072  # Gemini embedding-001 dimension
        
        self._load_or_create_index()
        logger.info(f"RAG service initialized with dimension: {self.dimension}")
    
    def _load_or_create_index(self):
        """Load existing FAISS index or create a new one."""
        try:
            if os.path.exists(self.index_path):
                logger.info("Loading existing FAISS index")
                self.index = faiss.read_index(self.index_path)
                
                if os.path.exists(self.metadata_path):
                    with open(self.metadata_path, 'rb') as f:
                        self.metadata = pickle.load(f)
                    logger.info(f"Loaded {len(self.metadata)} metadata entries")
            else:
                logger.info("Creating new FAISS index")
                self.index = faiss.IndexFlatL2(self.dimension)
                self.metadata = []
        except Exception as e:
            logger.error(f"Error loading/creating FAISS index: {str(e)}")
            self.index = faiss.IndexFlatL2(self.dimension)
            self.metadata = []
    
    def add_incident(self, incident_id: int, embedding: np.ndarray, 
                    report_text: str, analysis: Dict) -> None:
        """
        Add a new incident to the FAISS index.
        
        Args:
            incident_id: ID of the incident
            embedding: Embedding vector
            report_text: Original report text
            analysis: Analysis results
        """
        try:
            if embedding is None or len(embedding) == 0:
                logger.warning(f"Skipping incident {incident_id}: empty embedding")
                return
            
            # Ensure embedding is float32 and proper shape
            embedding = np.array(embedding, dtype=np.float32)
            if embedding.ndim == 1:
                embedding = embedding.reshape(1, -1)
            
            # Add to index
            self.index.add(embedding)
            
            # Store metadata
            self.metadata.append({
                "incident_id": incident_id,
                "report_text": report_text,
                "analysis": analysis
            })
            
            logger.debug(f"Added incident {incident_id} to FAISS index")
            
            # Save index and metadata
            self._save_index()
            
        except Exception as e:
            logger.error(f"Error adding incident to FAISS: {str(e)}")
            raise
    
    def search_similar_incidents(self, embedding: np.ndarray) -> List[Dict]:
        """
        Search for similar incidents using FAISS.
        
        Args:
            embedding: Query embedding vector
            
        Returns:
            List of similar incidents with metadata (up to top_k results)
        """
        try:
            if self.index is None or self.index.ntotal == 0:
                logger.debug("FAISS index is empty, returning no results")
                return []
            
            # Prepare query embedding
            embedding = np.array(embedding, dtype=np.float32)
            if embedding.ndim == 1:
                embedding = embedding.reshape(1, -1)
            
            # Search FAISS
            distances, indices = self.index.search(embedding, min(self.top_k, self.index.ntotal))
            
            results = []
            for idx, distance in zip(indices[0], distances[0]):
                # Convert L2 distance to similarity score (0-1)
                similarity = 1 / (1 + distance)
                
                if similarity >= self.min_similarity and idx < len(self.metadata):
                    metadata = self.metadata[int(idx)]
                    metadata['similarity_score'] = float(similarity)
                    results.append(metadata)
                    logger.debug(f"Found similar incident: {metadata['incident_id']} "
                               f"(similarity: {similarity:.3f})")
            
            logger.info(f"Found {len(results)} similar incidents")
            return results
            
        except Exception as e:
            logger.error(f"Error searching FAISS index: {str(e)}")
            return []
    
    def _save_index(self) -> None:
        """Save FAISS index and metadata to disk."""
        try:
            if self.index:
                faiss.write_index(self.index, self.index_path)
                with open(self.metadata_path, 'wb') as f:
                    pickle.dump(self.metadata, f)
                logger.debug("FAISS index saved successfully")
        except Exception as e:
            logger.error(f"Error saving FAISS index: {str(e)}")
    
    def rebuild_index_from_db(self, incidents: List[Tuple]) -> None:
        """
        Rebuild FAISS index from database incidents.
        Useful after restarts or maintenance.
        
        Args:
            incidents: List of (incident_id, embedding_json, report_text, analysis_json)
        """
        try:
            logger.info(f"Rebuilding FAISS index from {len(incidents)} incidents")
            
            # Create new index
            self.index = faiss.IndexFlatL2(self.dimension)
            self.metadata = []
            
            for incident_id, embedding_json, report_text, analysis in incidents:
                try:
                    embedding = np.array(embedding_json, dtype=np.float32)
                    self.add_incident(incident_id, embedding, report_text, analysis)
                except Exception as e:
                    logger.warning(f"Failed to add incident {incident_id}: {str(e)}")
            
            logger.info(f"FAISS index rebuilt with {self.index.ntotal} incidents")
            
        except Exception as e:
            logger.error(f"Error rebuilding FAISS index: {str(e)}")
            raise


# Global service instance
rag_service = RAGService()
