"""
Database connection and initialization.
"""
import motor.motor_asyncio
from beanie import init_beanie
import structlog

from app.config import settings
from app.models.user import User
from app.models.conversation import Conversation, Message

logger = structlog.get_logger()


class Database:
    """Database connection manager."""
    
    def __init__(self):
        self.client = None
        self.database = None
    
    async def connect(self):
        """Connect to MongoDB."""
        try:
            self.client = motor.motor_asyncio.AsyncIOMotorClient(settings.mongodb_url)
            self.database = self.client[settings.database_name]
            
            # Test the connection
            await self.client.admin.command('ping')
            logger.info("Connected to MongoDB successfully", database=settings.database_name)
            
        except Exception as e:
            logger.error("Failed to connect to MongoDB", error=str(e))
            raise
    
    async def disconnect(self):
        """Disconnect from MongoDB."""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")


# Global database instance
db = Database()


async def init_database():
    """Initialize database connection and Beanie ODM."""
    await db.connect()
    
    # Initialize Beanie with document models
    await init_beanie(
        database=db.database,
        document_models=[User, Conversation, Message]
    )
    
    logger.info("Beanie ODM initialized successfully")


async def get_database():
    """Get database instance for dependency injection."""
    return db.database
