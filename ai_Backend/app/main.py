"""
Main FastAPI application entry point.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import structlog

from app.config import settings
from app.database import init_database
from app.api.routes import chat, users, conversations
from app.websocket import websocket_router

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered conversational backend with NLU capabilities",
    debug=settings.debug,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware for security
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "0.0.0.0"]
)


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    logger.info("Starting AI Backend application", version=settings.app_version)

    # Initialize database connection
    await init_database()
    logger.info("Database initialized successfully")

    # Initialize AI models
    try:
        from app.ai.models import model_manager
        await model_manager.initialize_models()
        logger.info("AI models initialized successfully")
    except Exception as e:
        logger.warning("Failed to initialize AI models", error=str(e))
        logger.info("Application will continue without AI models. Some features may not work.")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown."""
    logger.info("Shutting down AI Backend application")


@app.get("/")
async def root():
    """Root endpoint for health check."""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": settings.app_name}


# Include API routers
app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(conversations.router, prefix="/api/v1", tags=["conversations"])

# Include WebSocket router
app.include_router(websocket_router, prefix="/ws")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
