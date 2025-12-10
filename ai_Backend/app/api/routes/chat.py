"""
Chat API endpoints for conversational AI functionality.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from bson import ObjectId

from app.models.user import User
from app.models.conversation import (
    Conversation, Message, MessageCreate, MessageResponse,
    ConversationCreate, ConversationResponse, MessageType
)
from app.api.dependencies import get_current_active_user, get_object_id
from app.ai.conversation_manager import conversation_manager
import structlog

logger = structlog.get_logger()

router = APIRouter()


class ChatRequest(BaseModel):
    """Request model for chat messages."""
    message: str
    conversation_id: Optional[str] = None
    model_config: Optional[dict] = None


class ChatResponse(BaseModel):
    """Response model for chat messages."""
    conversation_id: str
    user_message_id: str
    ai_message_id: str
    response: str
    metadata: dict


@router.post("/chat", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Send a message and get AI response."""
    try:
        # Convert conversation_id if provided
        conversation_id = None
        if request.conversation_id:
            conversation_id = get_object_id(request.conversation_id)
        
        # Process the message
        result = await conversation_manager.process_user_message(
            conversation_id=conversation_id,
            user_message=request.message,
            user_id=current_user.id
        )
        
        return ChatResponse(
            conversation_id=str(conversation_id) if conversation_id else result.get("conversation_id"),
            user_message_id=result["user_message_id"],
            ai_message_id=result["ai_message_id"],
            response=result["response"],
            metadata=result["metadata"]
        )
        
    except Exception as e:
        logger.error("Failed to process chat message", error=str(e), user_id=str(current_user.id))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process message"
        )


@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_active_user)
):
    """Get user's conversations."""
    try:
        conversations = await Conversation.find(
            Conversation.user_id == current_user.id
        ).sort(-Conversation.updated_at).skip(offset).limit(limit).to_list()
        
        result = []
        for conv in conversations:
            # Get recent messages
            recent_messages = await conv.get_messages(limit=3)
            
            result.append(ConversationResponse(
                id=str(conv.id),
                user_id=str(conv.user_id),
                title=conv.title,
                status=conv.status,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                message_count=conv.message_count,
                recent_messages=[
                    MessageResponse(
                        id=str(msg.id),
                        conversation_id=str(msg.conversation_id),
                        content=msg.content,
                        message_type=msg.message_type,
                        status=msg.status,
                        timestamp=msg.timestamp,
                        confidence_score=msg.confidence_score
                    )
                    for msg in recent_messages
                ]
            ))
        
        return result
        
    except Exception as e:
        logger.error("Failed to get conversations", error=str(e), user_id=str(current_user.id))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve conversations"
        )


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific conversation with messages."""
    try:
        conv_id = get_object_id(conversation_id)
        conversation = await Conversation.get(conv_id)
        
        if not conversation or conversation.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Get all messages
        messages = await conversation.get_messages(limit=100)
        
        return ConversationResponse(
            id=str(conversation.id),
            user_id=str(conversation.user_id),
            title=conversation.title,
            status=conversation.status,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            message_count=conversation.message_count,
            recent_messages=[
                MessageResponse(
                    id=str(msg.id),
                    conversation_id=str(msg.conversation_id),
                    content=msg.content,
                    message_type=msg.message_type,
                    status=msg.status,
                    timestamp=msg.timestamp,
                    confidence_score=msg.confidence_score
                )
                for msg in messages
            ]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get conversation", error=str(e), conversation_id=conversation_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve conversation"
        )


@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    request: ConversationCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new conversation."""
    try:
        conversation = Conversation(
            user_id=current_user.id,
            title=request.title or "New Conversation",
            model_config=request.model_config or {}
        )
        await conversation.insert()
        
        return ConversationResponse(
            id=str(conversation.id),
            user_id=str(conversation.user_id),
            title=conversation.title,
            status=conversation.status,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            message_count=conversation.message_count,
            recent_messages=[]
        )
        
    except Exception as e:
        logger.error("Failed to create conversation", error=str(e), user_id=str(current_user.id))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create conversation"
        )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a conversation and all its messages."""
    try:
        conv_id = get_object_id(conversation_id)
        conversation = await Conversation.get(conv_id)
        
        if not conversation or conversation.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Delete all messages in the conversation
        await Message.find(Message.conversation_id == conv_id).delete()
        
        # Delete the conversation
        await conversation.delete()
        
        return {"message": "Conversation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete conversation", error=str(e), conversation_id=conversation_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete conversation"
        )
