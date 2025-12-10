#!/usr/bin/env python3
"""
Startup script for the AI Backend application.
This script initializes the AI models and starts the server.
"""
import asyncio
import sys
import os
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from app.config import settings
from app.ai.models import model_manager
import structlog

logger = structlog.get_logger()


async def initialize_application():
    """Initialize the application and AI models."""
    try:
        logger.info("Starting AI Backend initialization...")
        
        # Create necessary directories
        os.makedirs(settings.model_cache_dir, exist_ok=True)
        os.makedirs("logs", exist_ok=True)
        
        # Initialize AI models
        logger.info("Loading AI models...")
        await model_manager.initialize_models()
        
        logger.info("AI Backend initialization completed successfully!")
        return True
        
    except Exception as e:
        logger.error("Failed to initialize AI Backend", error=str(e))
        return False


def main():
    """Main entry point."""
    import uvicorn
    
    # Run initialization
    success = asyncio.run(initialize_application())
    
    if not success:
        logger.error("Failed to initialize application. Exiting.")
        sys.exit(1)
    
    # Start the server
    logger.info(
        "Starting AI Backend server",
        host=settings.host,
        port=settings.port,
        debug=settings.debug
    )
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
        access_log=True
    )


if __name__ == "__main__":
    main()
