"""
AI model management and inference.
"""
import os
import time
from typing import List, Dict, Any, Optional, Tuple
import torch
from transformers import (
    AutoTokenizer, 
    AutoModelForCausalLM, 
    ConversationPipeline,
    pipeline
)
from sentence_transformers import SentenceTransformer
import structlog

from app.config import settings

logger = structlog.get_logger()


class ModelManager:
    """Manages AI models and inference."""
    
    def __init__(self):
        self.conversation_model = None
        self.tokenizer = None
        self.embedding_model = None
        self.conversation_pipeline = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
    async def initialize_models(self):
        """Initialize all AI models."""
        logger.info("Initializing AI models", device=self.device)
        
        try:
            # Create model cache directory
            os.makedirs(settings.model_cache_dir, exist_ok=True)
            
            # Load conversational model
            await self._load_conversation_model()
            
            # Load embedding model for semantic search
            await self._load_embedding_model()
            
            logger.info("All AI models initialized successfully")
            
        except Exception as e:
            logger.error("Failed to initialize AI models", error=str(e))
            raise
    
    async def _load_conversation_model(self):
        """Load the conversational AI model."""
        logger.info("Loading conversation model", model=settings.default_model)
        
        self.tokenizer = AutoTokenizer.from_pretrained(
            settings.default_model,
            cache_dir=settings.model_cache_dir
        )
        
        self.conversation_model = AutoModelForCausalLM.from_pretrained(
            settings.default_model,
            cache_dir=settings.model_cache_dir,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            device_map="auto" if self.device == "cuda" else None
        )
        
        # Create conversation pipeline
        self.conversation_pipeline = ConversationPipeline(
            model=self.conversation_model,
            tokenizer=self.tokenizer,
            device=0 if self.device == "cuda" else -1
        )
        
        # Add padding token if not present
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
    
    async def _load_embedding_model(self):
        """Load the sentence embedding model."""
        logger.info("Loading embedding model")
        
        self.embedding_model = SentenceTransformer(
            'all-MiniLM-L6-v2',
            cache_folder=settings.model_cache_dir
        )
    
    async def generate_response(
        self, 
        conversation_history: List[Dict[str, str]], 
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Generate a response based on conversation history.
        
        Args:
            conversation_history: List of messages with 'role' and 'content'
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            
        Returns:
            Tuple of (response_text, metadata)
        """
        start_time = time.time()
        
        try:
            # Use provided values or defaults
            max_tokens = max_tokens or settings.max_tokens
            temperature = temperature or settings.temperature
            
            # Format conversation for the model
            formatted_conversation = self._format_conversation(conversation_history)
            
            # Generate response
            response = self.conversation_pipeline(
                formatted_conversation,
                max_length=max_tokens,
                temperature=temperature,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id
            )
            
            # Extract the generated text
            generated_text = response.generated_responses[-1]
            
            processing_time = time.time() - start_time
            
            # Calculate confidence score (simplified)
            confidence_score = self._calculate_confidence(generated_text)
            
            metadata = {
                "model_used": settings.default_model,
                "processing_time": processing_time,
                "confidence_score": confidence_score,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "device": self.device
            }
            
            logger.info(
                "Generated response",
                processing_time=processing_time,
                confidence_score=confidence_score,
                response_length=len(generated_text)
            )
            
            return generated_text, metadata
            
        except Exception as e:
            logger.error("Failed to generate response", error=str(e))
            raise
    
    def _format_conversation(self, conversation_history: List[Dict[str, str]]) -> str:
        """Format conversation history for the model."""
        formatted = ""
        for message in conversation_history[-settings.max_tokens//50:]:  # Limit context
            role = message.get("role", "user")
            content = message.get("content", "")
            
            if role == "user":
                formatted += f"Human: {content}\n"
            elif role == "assistant":
                formatted += f"Assistant: {content}\n"
        
        formatted += "Assistant: "
        return formatted
    
    def _calculate_confidence(self, text: str) -> float:
        """Calculate a simple confidence score for the generated text."""
        # This is a simplified confidence calculation
        # In practice, you might use model logits or other metrics
        
        if not text or len(text.strip()) < 5:
            return 0.1
        
        # Basic heuristics
        word_count = len(text.split())
        if word_count < 3:
            return 0.3
        elif word_count > 100:
            return 0.6
        else:
            return min(0.9, 0.4 + (word_count / 100) * 0.5)
    
    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Get sentence embeddings for semantic search."""
        try:
            embeddings = self.embedding_model.encode(texts, convert_to_tensor=False)
            return embeddings.tolist()
        except Exception as e:
            logger.error("Failed to generate embeddings", error=str(e))
            raise
    
    async def semantic_similarity(self, text1: str, text2: str) -> float:
        """Calculate semantic similarity between two texts."""
        try:
            embeddings = await self.get_embeddings([text1, text2])
            
            # Calculate cosine similarity
            import numpy as np
            emb1, emb2 = np.array(embeddings[0]), np.array(embeddings[1])
            similarity = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
            
            return float(similarity)
        except Exception as e:
            logger.error("Failed to calculate similarity", error=str(e))
            return 0.0


# Global model manager instance
model_manager = ModelManager()
