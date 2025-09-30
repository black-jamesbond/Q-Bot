"""
Conversation and Message models for chat functionality.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from beanie import Document, Indexed
from pydantic import Field
from bson import ObjectId


class MessageType(str, Enum):
    """Message type enumeration."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class MessageStatus(str, Enum):
    """Message status enumeration."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Message(Document):
    """Message document model."""
    
    conversation_id: Indexed(ObjectId)
    content: str
    message_type: MessageType
    status: MessageStatus = MessageStatus.COMPLETED
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # AI-specific fields
    model_used: Optional[str] = None
    confidence_score: Optional[float] = None
    processing_time: Optional[float] = None
    
    # Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Settings:
        name = "messages"
        indexes = [
            "conversation_id",
            "timestamp",
            "message_type",
        ]


class ConversationStatus(str, Enum):
    """Conversation status enumeration."""
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class Conversation(Document):
    """Conversation document model."""
    
    user_id: Indexed(ObjectId)
    title: Optional[str] = None
    status: ConversationStatus = ConversationStatus.ACTIVE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Conversation settings
    model_config: Dict[str, Any] = Field(default_factory=dict)
    context_window: int = 10  # Number of previous messages to consider
    
    # Analytics
    message_count: int = 0
    total_tokens_used: int = 0
    
    # Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Settings:
        name = "conversations"
        indexes = [
            "user_id",
            "created_at",
            "updated_at",
            "status",
        ]
    
    def update_timestamp(self):
        """Update the updated_at timestamp."""
        self.updated_at = datetime.utcnow()
    
    async def get_messages(self, limit: int = 50) -> List[Message]:
        """Get messages for this conversation."""
        return await Message.find(
            Message.conversation_id == self.id
        ).sort(-Message.timestamp).limit(limit).to_list()
    
    async def add_message(self, content: str, message_type: MessageType, **kwargs) -> Message:
        """Add a new message to the conversation."""
        message = Message(
            conversation_id=self.id,
            content=content,
            message_type=message_type,
            **kwargs
        )
        await message.insert()
        
        # Update conversation stats
        self.message_count += 1
        self.update_timestamp()
        await self.save()
        
        return message


# Pydantic schemas for API
class MessageCreate(Document):
    """Schema for creating a message."""
    content: str
    message_type: MessageType = MessageType.USER


class MessageResponse(Document):
    """Schema for message response."""
    id: str
    conversation_id: str
    content: str
    message_type: MessageType
    status: MessageStatus
    timestamp: datetime
    confidence_score: Optional[float] = None


class ConversationCreate(Document):
    """Schema for creating a conversation."""
    title: Optional[str] = None
    model_config: Dict[str, Any] = Field(default_factory=dict)


class ConversationResponse(Document):
    """Schema for conversation response."""
    id: str
    user_id: str
    title: Optional[str] = None
    status: ConversationStatus
    created_at: datetime
    updated_at: datetime
    message_count: int
    recent_messages: List[MessageResponse] = Field(default_factory=list)
