"""
Configuration management for the AI Backend application.
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Application settings
    app_name: str = "AI Conversational Backend"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Database settings
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "ai_conversations"
    
    # AI Model settings
    default_model: str = "microsoft/DialoGPT-medium"
    max_tokens: int = 512
    temperature: float = 0.7
    model_cache_dir: str = "./models"
    
    # Authentication settings
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS settings
    cors_origins: list = ["http://localhost:3000", "http://localhost:3001"]
    
    # Redis settings (for background tasks)
    redis_url: str = "redis://localhost:6379"
    
    # Logging settings
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()
