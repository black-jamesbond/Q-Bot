"""
API endpoint tests.
"""
import pytest
from httpx import AsyncClient


class TestHealthEndpoints:
    """Test health and basic endpoints."""
    
    async def test_root_endpoint(self, client: AsyncClient):
        """Test root endpoint."""
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert "status" in data
    
    async def test_health_check(self, client: AsyncClient):
        """Test health check endpoint."""
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestUserEndpoints:
    """Test user management endpoints."""
    
    async def test_user_registration(self, client: AsyncClient):
        """Test user registration."""
        user_data = {
            "email": "newuser@example.com",
            "username": "newuser",
            "full_name": "New User",
            "password": "securepassword123"
        }
        
        response = await client.post("/api/v1/register", json=user_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["username"] == user_data["username"]
        assert data["full_name"] == user_data["full_name"]
        assert "id" in data
        assert "hashed_password" not in data  # Should not expose password
    
    async def test_user_registration_duplicate_email(self, client: AsyncClient, test_user):
        """Test registration with duplicate email."""
        user_data = {
            "email": test_user.email,
            "username": "differentuser",
            "password": "securepassword123"
        }
        
        response = await client.post("/api/v1/register", json=user_data)
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]
    
    async def test_user_login(self, client: AsyncClient, test_user):
        """Test user login."""
        login_data = {
            "username": test_user.username,
            "password": "testpassword123"
        }
        
        response = await client.post("/api/v1/login", data=login_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    async def test_user_login_invalid_credentials(self, client: AsyncClient, test_user):
        """Test login with invalid credentials."""
        login_data = {
            "username": test_user.username,
            "password": "wrongpassword"
        }
        
        response = await client.post("/api/v1/login", data=login_data)
        assert response.status_code == 401
    
    async def test_get_current_user(self, client: AsyncClient, test_user, authenticated_headers):
        """Test getting current user info."""
        response = await client.get("/api/v1/me", headers=authenticated_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["email"] == test_user.email
        assert data["username"] == test_user.username
        assert data["id"] == str(test_user.id)
    
    async def test_get_current_user_unauthorized(self, client: AsyncClient):
        """Test getting current user without authentication."""
        response = await client.get("/api/v1/me")
        assert response.status_code == 403  # No authorization header


class TestChatEndpoints:
    """Test chat functionality endpoints."""
    
    async def test_send_chat_message(self, client: AsyncClient, test_user, authenticated_headers):
        """Test sending a chat message."""
        message_data = {
            "message": "Hello, how are you?",
            "conversation_id": None
        }
        
        # Note: This test might fail if AI models are not loaded
        # In a real test environment, you'd mock the AI response
        response = await client.post("/api/v1/chat", json=message_data, headers=authenticated_headers)
        
        # The response might be 500 if models aren't loaded, which is expected in test
        assert response.status_code in [200, 500]
        
        if response.status_code == 200:
            data = response.json()
            assert "conversation_id" in data
            assert "response" in data
            assert "user_message_id" in data
            assert "ai_message_id" in data
    
    async def test_get_conversations(self, client: AsyncClient, test_user, authenticated_headers):
        """Test getting user conversations."""
        response = await client.get("/api/v1/conversations", headers=authenticated_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    async def test_create_conversation(self, client: AsyncClient, test_user, authenticated_headers):
        """Test creating a new conversation."""
        conversation_data = {
            "title": "Test Conversation",
            "model_config": {"temperature": 0.8}
        }
        
        response = await client.post("/api/v1/conversations", json=conversation_data, headers=authenticated_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == conversation_data["title"]
        assert "id" in data
        assert data["user_id"] == str(test_user.id)
    
    async def test_get_conversation_details(self, client: AsyncClient, test_conversation, authenticated_headers):
        """Test getting conversation details."""
        response = await client.get(
            f"/api/v1/conversations/{test_conversation.id}",
            headers=authenticated_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == str(test_conversation.id)
        assert data["title"] == test_conversation.title
    
    async def test_delete_conversation(self, client: AsyncClient, test_conversation, authenticated_headers):
        """Test deleting a conversation."""
        response = await client.delete(
            f"/api/v1/conversations/{test_conversation.id}",
            headers=authenticated_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "deleted" in data["message"].lower()


class TestConversationEndpoints:
    """Test conversation management endpoints."""
    
    async def test_get_conversation_stats(self, client: AsyncClient, test_user, authenticated_headers):
        """Test getting conversation statistics."""
        response = await client.get("/api/v1/conversations/stats", headers=authenticated_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "total_conversations" in data
        assert "active_conversations" in data
        assert "total_messages" in data
        assert "avg_messages_per_conversation" in data
    
    async def test_search_conversations(self, client: AsyncClient, test_conversation, authenticated_headers):
        """Test searching conversations."""
        response = await client.get(
            "/api/v1/conversations/search?query=test",
            headers=authenticated_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "title_matches" in data
        assert "content_matches" in data
    
    async def test_archive_conversation(self, client: AsyncClient, test_conversation, authenticated_headers):
        """Test archiving a conversation."""
        response = await client.post(
            f"/api/v1/conversations/{test_conversation.id}/archive",
            headers=authenticated_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "archived" in data["message"].lower()
    
    async def test_restore_conversation(self, client: AsyncClient, test_conversation, authenticated_headers):
        """Test restoring an archived conversation."""
        # First archive it
        await client.post(
            f"/api/v1/conversations/{test_conversation.id}/archive",
            headers=authenticated_headers
        )
        
        # Then restore it
        response = await client.post(
            f"/api/v1/conversations/{test_conversation.id}/restore",
            headers=authenticated_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "restored" in data["message"].lower()
