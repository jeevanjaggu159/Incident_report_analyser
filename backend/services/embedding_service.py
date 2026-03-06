"""
Embedding service for generating vector embeddings using Google Gemini API.
Converts text to embeddings for similarity search in RAG.
Uses Gemini Embeddings API for production-quality vectors.
"""
import logging
from typing import List
import numpy as np
import google.generativeai as genai
from config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating and managing text embeddings using Gemini."""
    
    def __init__(self):
        """Initialize the embedding service with Gemini client."""
        api_key = settings.GEMINI_API_KEY
        
        if api_key:
            genai.configure(api_key=api_key)
        else:
            logger.warning("GEMINI_API_KEY not set in environment variables")
            
        self.model = settings.GEMINI_EMBEDDING_MODEL
        logger.info(f"Initialized embedding service with model: {self.model}")
    
    def generate_embedding(self, text: str) -> np.ndarray:
        """
        Generate embedding for given text using Gemini API.
        
        Args:
            text: Input text to embed
            
        Returns:
            numpy array of embedding vector (float32)
            
        Raises:
            Exception: If Gemini API call fails
            ValueError: If text is empty or invalid
        """
        try:
            if not text or len(text.strip()) == 0:
                raise ValueError("Text cannot be empty")
            
            logger.debug(f"Generating embedding for text: {text[:50]}...")
            
            # Call Gemini Embeddings API
            response = genai.embed_content(
                model=self.model,
                content=text,
                task_type="retrieval_document"
            )
            
            # Extract embedding from response
            embedding = response['embedding']
            logger.debug("Embedding generated successfully")
            
            return np.array(embedding, dtype=np.float32)
            
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[np.ndarray]:
        """
        Generate embeddings for multiple texts efficiently.
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors (float32)
            
        Raises:
            Exception: If Gemini API call fails
        """
        try:
            if not texts:
                return []
            
            # Filter out empty strings
            texts = [t for t in texts if t and len(t.strip()) > 0]
            
            if not texts:
                logger.warning("No valid texts provided for batch embedding")
                return []
            
            logger.debug(f"Generating embeddings batch for {len(texts)} texts")
            
            # Call Gemini API with batch of texts
            response = genai.embed_content(
                model=self.model,
                content=texts,
                task_type="retrieval_document"
            )
            
            # Extract embeddings from response
            embeddings = []
            for emb in response['embedding']:
                embeddings.append(np.array(emb, dtype=np.float32))
            
            logger.debug(f"Batch embeddings generated: {len(embeddings)} vectors")
            return embeddings
            
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {str(e)}")
            raise
    
    @staticmethod
    def calculate_similarity(embedding1: np.ndarray, 
                            embedding2: np.ndarray) -> float:
        """
        Calculate cosine similarity between two embeddings.
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            
        Returns:
            Similarity score between 0 and 1 (1 = identical, 0 = orthogonal)
        """
        try:
            if embedding1.size == 0 or embedding2.size == 0:
                return 0.0
            
            # Normalize vectors
            norm1 = np.linalg.norm(embedding1)
            norm2 = np.linalg.norm(embedding2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            norm_embedding1 = embedding1 / norm1
            norm_embedding2 = embedding2 / norm2
            
            # Cosine similarity
            similarity = float(np.dot(norm_embedding1, norm_embedding2))
            return max(0.0, min(1.0, similarity))  # Clamp to [0, 1]
            
        except Exception as e:
            logger.error(f"Error calculating similarity: {str(e)}")
            return 0.0


# Global service instance - created lazily to avoid errors if API key not set
_embedding_service = None

def get_embedding_service():
    """Get or create the embedding service instance."""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service

# For backwards compatibility, create a default instance
try:
    embedding_service = EmbeddingService()
except ValueError as e:
    logger.warning(f"Embedding service not initialized: {e}")
    embedding_service = None
