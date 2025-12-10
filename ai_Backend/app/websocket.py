"""
WebSocket implementation for real-time chat functionality.
"""
import json
from typing import Dict, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from jose import JWTError, jwt
from bson import ObjectId
import structlog

from app.config import settings
from app.models.user import User
from app.ai.conversation_manager import conversation_manager

logger = structlog.get_logger()

websocket_router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections."""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_connections: Dict[str, str] = {}  # user_id -> connection_id
    
    async def connect(self, websocket: WebSocket, user_id: str, connection_id: str):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        self.user_connections[user_id] = connection_id
        
        logger.info(
            "WebSocket connection established",
            user_id=user_id,
            connection_id=connection_id,
            total_connections=len(self.active_connections)
        )
    
    def disconnect(self, connection_id: str, user_id: Optional[str] = None):
        """Remove a WebSocket connection."""
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        
        if user_id and user_id in self.user_connections:
            del self.user_connections[user_id]
        
        logger.info(
            "WebSocket connection closed",
            user_id=user_id,
            connection_id=connection_id,
            total_connections=len(self.active_connections)
        )
    
    async def send_personal_message(self, message: dict, user_id: str):
        """Send a message to a specific user."""
        connection_id = self.user_connections.get(user_id)
        if connection_id and connection_id in self.active_connections:
            websocket = self.active_connections[connection_id]
            try:
                await websocket.send_text(json.dumps(message))
                return True
            except Exception as e:
                logger.error("Failed to send WebSocket message", error=str(e), user_id=user_id)
                self.disconnect(connection_id, user_id)
                return False
        return False
    
    async def broadcast(self, message: dict):
        """Broadcast a message to all connected clients."""
        disconnected = []
        for connection_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error("Failed to broadcast message", error=str(e), connection_id=connection_id)
                disconnected.append(connection_id)
        
        # Clean up disconnected connections
        for connection_id in disconnected:
            self.disconnect(connection_id)


# Global connection manager
manager = ConnectionManager()


async def get_user_from_token(token: str) -> Optional[User]:
    """Extract user from JWT token."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        
        user = await User.get(ObjectId(user_id))
        return user if user and user.is_active else None
    except JWTError:
        return None


@websocket_router.websocket("/chat")
async def websocket_chat_endpoint(websocket: WebSocket, token: str):
    """WebSocket endpoint for real-time chat."""
    # Authenticate user
    user = await get_user_from_token(token)
    if not user:
        await websocket.close(code=4001, reason="Authentication failed")
        return
    
    connection_id = f"{user.id}_{id(websocket)}"
    
    try:
        await manager.connect(websocket, str(user.id), connection_id)
        
        # Send welcome message
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "message": "Connected to AI chat",
            "user_id": str(user.id)
        }))
        
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            try:
                message_data = json.loads(data)
                await handle_websocket_message(websocket, user, message_data)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON format"
                }))
            except Exception as e:
                logger.error("Error handling WebSocket message", error=str(e), user_id=str(user.id))
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Failed to process message"
                }))
    
    except WebSocketDisconnect:
        manager.disconnect(connection_id, str(user.id))
    except Exception as e:
        logger.error("WebSocket error", error=str(e), user_id=str(user.id))
        manager.disconnect(connection_id, str(user.id))


async def handle_websocket_message(websocket: WebSocket, user: User, message_data: dict):
    """Handle incoming WebSocket messages."""
    message_type = message_data.get("type")
    
    if message_type == "chat_message":
        await handle_chat_message(websocket, user, message_data)
    elif message_type == "typing":
        await handle_typing_indicator(websocket, user, message_data)
    elif message_type == "ping":
        await websocket.send_text(json.dumps({"type": "pong"}))
    else:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Unknown message type: {message_type}"
        }))


async def handle_chat_message(websocket: WebSocket, user: User, message_data: dict):
    """Handle chat messages through WebSocket."""
    try:
        content = message_data.get("content", "").strip()
        conversation_id = message_data.get("conversation_id")
        
        if not content:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "Message content cannot be empty"
            }))
            return
        
        # Send typing indicator
        await websocket.send_text(json.dumps({
            "type": "ai_typing",
            "conversation_id": conversation_id
        }))
        
        # Convert conversation_id if provided
        conv_id = None
        if conversation_id:
            try:
                conv_id = ObjectId(conversation_id)
            except Exception:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid conversation ID"
                }))
                return
        
        # Process the message
        result = await conversation_manager.process_user_message(
            conversation_id=conv_id,
            user_message=content,
            user_id=user.id
        )
        
        # Send user message confirmation
        await websocket.send_text(json.dumps({
            "type": "message_sent",
            "message_id": result["user_message_id"],
            "conversation_id": str(conv_id) if conv_id else result.get("conversation_id"),
            "content": content,
            "timestamp": message_data.get("timestamp")
        }))
        
        # Send AI response
        await websocket.send_text(json.dumps({
            "type": "ai_response",
            "message_id": result["ai_message_id"],
            "conversation_id": str(conv_id) if conv_id else result.get("conversation_id"),
            "content": result["response"],
            "metadata": result["metadata"]
        }))
        
        logger.info(
            "WebSocket chat message processed",
            user_id=str(user.id),
            conversation_id=str(conv_id) if conv_id else "new",
            response_length=len(result["response"])
        )
        
    except Exception as e:
        logger.error("Failed to process WebSocket chat message", error=str(e), user_id=str(user.id))
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": "Failed to process your message. Please try again."
        }))


async def handle_typing_indicator(websocket: WebSocket, user: User, message_data: dict):
    """Handle typing indicators."""
    conversation_id = message_data.get("conversation_id")
    is_typing = message_data.get("is_typing", False)
    
    # For now, just acknowledge the typing indicator
    # In a multi-user chat, you would broadcast this to other participants
    await websocket.send_text(json.dumps({
        "type": "typing_acknowledged",
        "conversation_id": conversation_id,
        "is_typing": is_typing
    }))


@websocket_router.websocket("/notifications")
async def websocket_notifications_endpoint(websocket: WebSocket, token: str):
    """WebSocket endpoint for general notifications."""
    user = await get_user_from_token(token)
    if not user:
        await websocket.close(code=4001, reason="Authentication failed")
        return
    
    connection_id = f"notif_{user.id}_{id(websocket)}"
    
    try:
        await manager.connect(websocket, str(user.id), connection_id)
        
        await websocket.send_text(json.dumps({
            "type": "notifications_connected",
            "message": "Connected to notifications"
        }))
        
        # Keep connection alive
        while True:
            data = await websocket.receive_text()
            # Handle ping/pong for keep-alive
            if data == "ping":
                await websocket.send_text("pong")
    
    except WebSocketDisconnect:
        manager.disconnect(connection_id, str(user.id))
    except Exception as e:
        logger.error("Notifications WebSocket error", error=str(e), user_id=str(user.id))
        manager.disconnect(connection_id, str(user.id))
