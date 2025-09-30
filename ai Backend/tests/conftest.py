"""
Test configuration and fixtures.
"""
import asyncio
import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.main import app
from app.config import settings
from app.models.user import User
from app.models.conversation import Conversation, Message


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_db():
    """Set up test database."""
    # Use a test database
    test_db_name = "test_ai_conversations"
    client = AsyncIOMotorClient(settings.mongodb_url)
    database = client[test_db_name]
    
    # Initialize Beanie with test database
    await init_beanie(
        database=database,
        document_models=[User, Conversation, Message]
    )
    
    yield database
    
    # Clean up: drop test database
    await client.drop_database(test_db_name)
    client.close()


@pytest.fixture
async def client(test_db):
    """Create test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def sync_client():
    """Create synchronous test client."""
    return TestClient(app)


@pytest.fixture
async def test_user(test_db):
    """Create a test user."""
    user = User(
        email="test@example.com",
        username="testuser",
        full_name="Test User",
        hashed_password=User.hash_password("testpassword123")
    )
    await user.insert()
    return user


@pytest.fixture
async def authenticated_headers(test_user):
    """Get authentication headers for test user."""
    from app.api.routes.users import create_access_token
    from datetime import timedelta
    
    access_token = create_access_token(
        data={"sub": str(test_user.id)},
        expires_delta=timedelta(minutes=30)
    )
    
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
async def test_conversation(test_user, test_db):
    """Create a test conversation."""
    conversation = Conversation(
        user_id=test_user.id,
        title="Test Conversation"
    )
    await conversation.insert()
    return conversation


@pytest.fixture
async def test_message(test_conversation, test_db):
    """Create a test message."""
    message = Message(
        conversation_id=test_conversation.id,
        content="Hello, this is a test message",
        message_type="user"
    )
    await message.insert()
    return message


@pytest.fixture(autouse=True)
async def cleanup_db(test_db):
    """Clean up database after each test."""
    yield
    
    # Clean up all collections
    await User.delete_all()
    await Conversation.delete_all()
    await Message.delete_all()
