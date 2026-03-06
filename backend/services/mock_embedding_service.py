"""
Mock Embedding Service for DEMO MODE
Provides simulated embeddings without API calls.
"""
import logging
from typing import List
import numpy as np

logger = logging.getLogger(__name__)


class MockEmbeddingService:
    """Mock service that generates dummy embeddings without API calls."""
    
    def __init__(self):
        """Initialize the mock embedding service."""
        self.model = "mock-embedding"
        logger.info("Initialized Mock Embedding service (DEMO MODE - No API calls)")
    
    def generate_embedding(self, text: str) -> np.ndarray:
        """
        Generate a mock embedding for given text.
        
        Args:
            text: Input text to embed
            
        Returns:
            Random numpy array of embedding vector (float32)
        """
        if not text or len(text.strip()) == 0:
            raise ValueError("Text cannot be empty")
        
        logger.debug(f"Generating mock embedding for text: {text[:50]}...")
        
        # Generate a consistent pseudo-random embedding based on text length
        # This ensures same text always gets similar vector
        np.random.seed(len(text))
        embedding = np.random.randn(384).astype(np.float32)  # 384 dims like real embeddings
        
        # Normalize
        embedding = embedding / np.linalg.norm(embedding)
        
        logger.debug("Mock embedding generated successfully")
        return embedding
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[np.ndarray]:
        """
        Generate mock embeddings for multiple texts.
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors (float32)
        """
        if not texts:
            return []
        
        # Filter out empty strings
        texts = [t for t in texts if t and len(t.strip()) > 0]
        
        if not texts:
            logger.warning("No valid texts provided for batch embedding")
            return []
        
        logger.debug(f"Generating mock embeddings batch for {len(texts)} texts")
        
        embeddings = []
        for text in texts:
            embeddings.append(self.generate_embedding(text))
        
        logger.debug(f"Batch mock embeddings generated: {len(embeddings)} vectors")
        return embeddings
    
    @staticmethod
    def calculate_similarity(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Calculate cosine similarity between two embeddings.
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            
        Returns:
            Similarity score between 0 and 1
        """
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
        return max(0.0, min(1.0, similarity))


# Global service instance
mock_embedding_service = MockEmbeddingService()
