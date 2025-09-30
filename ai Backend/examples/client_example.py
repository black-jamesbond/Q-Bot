#!/usr/bin/env python3
"""
Example client for the AI Backend API.
This demonstrates how to interact with the backend from a Python client.
"""
import asyncio
import json
import websockets
from httpx import AsyncClient


class AIBackendClient:
    """Client for interacting with the AI Backend API."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.ws_url = base_url.replace("http", "ws")
        self.token = None
        self.client = None
    
    async def __aenter__(self):
        self.client = AsyncClient(base_url=self.base_url)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.client:
            await self.client.aclose()
    
    async def register(self, email: str, username: str, password: str, full_name: str = None):
        """Register a new user."""
        data = {
            "email": email,
            "username": username,
            "password": password,
            "full_name": full_name
        }
        
        response = await self.client.post("/api/v1/register", json=data)
        response.raise_for_status()
        return response.json()
    
    async def login(self, username: str, password: str):
        """Login and store the access token."""
        data = {
            "username": username,
            "password": password
        }
        
        response = await self.client.post("/api/v1/login", data=data)
        response.raise_for_status()
        
        result = response.json()
        self.token = result["access_token"]
        return result
    
    def _get_headers(self):
        """Get authorization headers."""
        if not self.token:
            raise ValueError("Not authenticated. Please login first.")
        return {"Authorization": f"Bearer {self.token}"}
    
    async def get_profile(self):
        """Get current user profile."""
        response = await self.client.get("/api/v1/me", headers=self._get_headers())
        response.raise_for_status()
        return response.json()
    
    async def send_message(self, message: str, conversation_id: str = None):
        """Send a chat message."""
        data = {
            "message": message,
            "conversation_id": conversation_id
        }
        
        response = await self.client.post("/api/v1/chat", json=data, headers=self._get_headers())
        response.raise_for_status()
        return response.json()
    
    async def get_conversations(self, limit: int = 20, offset: int = 0):
        """Get user conversations."""
        params = {"limit": limit, "offset": offset}
        response = await self.client.get("/api/v1/conversations", params=params, headers=self._get_headers())
        response.raise_for_status()
        return response.json()
    
    async def create_conversation(self, title: str = None, model_config: dict = None):
        """Create a new conversation."""
        data = {
            "title": title,
            "model_config": model_config or {}
        }
        
        response = await self.client.post("/api/v1/conversations", json=data, headers=self._get_headers())
        response.raise_for_status()
        return response.json()
    
    async def websocket_chat(self, on_message_callback=None):
        """Connect to WebSocket for real-time chat."""
        if not self.token:
            raise ValueError("Not authenticated. Please login first.")
        
        uri = f"{self.ws_url}/ws/chat?token={self.token}"
        
        async with websockets.connect(uri) as websocket:
            print("Connected to WebSocket chat")
            
            # Send a test message
            await websocket.send(json.dumps({
                "type": "chat_message",
                "content": "Hello from WebSocket!",
                "conversation_id": None
            }))
            
            # Listen for messages
            async for message in websocket:
                data = json.loads(message)
                print(f"Received: {data}")
                
                if on_message_callback:
                    await on_message_callback(data)


async def main():
    """Example usage of the AI Backend client."""
    async with AIBackendClient() as client:
        try:
            # Check if server is running
            response = await client.client.get("/health")
            print(f"Server status: {response.json()}")
            
            # Register a new user (or skip if already exists)
            try:
                user = await client.register(
                    email="demo@example.com",
                    username="demouser",
                    password="demopassword123",
                    full_name="Demo User"
                )
                print(f"Registered user: {user['username']}")
            except Exception as e:
                print(f"Registration failed (user might already exist): {e}")
            
            # Login
            login_result = await client.login("demouser", "demopassword123")
            print(f"Logged in successfully: {login_result['token_type']}")
            
            # Get profile
            profile = await client.get_profile()
            print(f"User profile: {profile['username']} ({profile['email']})")
            
            # Create a conversation
            conversation = await client.create_conversation(
                title="Demo Conversation",
                model_config={"temperature": 0.8}
            )
            print(f"Created conversation: {conversation['id']}")
            
            # Send a message
            response = await client.send_message(
                message="Hello! How are you today?",
                conversation_id=conversation['id']
            )
            print(f"AI Response: {response['response']}")
            
            # Get conversations
            conversations = await client.get_conversations()
            print(f"Total conversations: {len(conversations)}")
            
            # WebSocket example (uncomment to test)
            # print("Testing WebSocket connection...")
            # await client.websocket_chat()
            
        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    asyncio.run(main())
