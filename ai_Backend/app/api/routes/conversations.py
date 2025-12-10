"""
Conversation management API endpoints.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from bson import ObjectId

from app.models.user import User
from app.models.conversation import (
    Conversation, Message, MessageResponse, ConversationStatus
)
from app.api.dependencies import get_current_active_user, get_object_id
from app.ai.conversation_manager import conversation_manager
import structlog

logger = structlog.get_logger()

router = APIRouter()


class ConversationUpdate(BaseModel):
    """Model for updating conversation properties."""
    title: Optional[str] = None
    status: Optional[ConversationStatus] = None
    model_config: Optional[dict] = None


class ConversationStats(BaseModel):
    """Model for conversation statistics."""
    total_conversations: int
    active_conversations: int
    total_messages: int
    avg_messages_per_conversation: float


@router.get("/conversations/stats", response_model=ConversationStats)
async def get_conversation_stats(
    current_user: User = Depends(get_current_active_user)
):
    """Get conversation statistics for the current user."""
    try:
        # Get total conversations
        total_conversations = await Conversation.find(
            Conversation.user_id == current_user.id
        ).count()
        
        # Get active conversations
        active_conversations = await Conversation.find(
            Conversation.user_id == current_user.id,
            Conversation.status == ConversationStatus.ACTIVE
        ).count()
        
        # Get total messages
        user_conversations = await Conversation.find(
            Conversation.user_id == current_user.id
        ).to_list()
        
        total_messages = sum(conv.message_count for conv in user_conversations)
        
        # Calculate average
        avg_messages = total_messages / total_conversations if total_conversations > 0 else 0
        
        return ConversationStats(
            total_conversations=total_conversations,
            active_conversations=active_conversations,
            total_messages=total_messages,
            avg_messages_per_conversation=round(avg_messages, 2)
        )
        
    except Exception as e:
        logger.error("Failed to get conversation stats", error=str(e), user_id=str(current_user.id))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve conversation statistics"
        )


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(
    conversation_id: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user)
):
    """Get messages from a specific conversation."""
    try:
        conv_id = get_object_id(conversation_id)
        conversation = await Conversation.get(conv_id)
        
        if not conversation or conversation.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Get messages with pagination
        messages = await Message.find(
            Message.conversation_id == conv_id
        ).sort(-Message.timestamp).skip(offset).limit(limit).to_list()
        
        return [
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
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get conversation messages", error=str(e), conversation_id=conversation_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve messages"
        )


@router.put("/conversations/{conversation_id}", response_model=dict)
async def update_conversation(
    conversation_id: str,
    update_data: ConversationUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update conversation properties."""
    try:
        conv_id = get_object_id(conversation_id)
        conversation = await Conversation.get(conv_id)
        
        if not conversation or conversation.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Update fields
        updated_fields = []
        
        if update_data.title is not None:
            conversation.title = update_data.title
            updated_fields.append("title")
        
        if update_data.status is not None:
            conversation.status = update_data.status
            updated_fields.append("status")
        
        if update_data.model_config is not None:
            conversation.model_config.update(update_data.model_config)
            updated_fields.append("model_config")
        
        if updated_fields:
            conversation.update_timestamp()
            await conversation.save()
            
            logger.info(
                "Conversation updated",
                conversation_id=conversation_id,
                updated_fields=updated_fields,
                user_id=str(current_user.id)
            )
        
        return {
            "message": "Conversation updated successfully",
            "updated_fields": updated_fields
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update conversation", error=str(e), conversation_id=conversation_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update conversation"
        )


@router.get("/conversations/search")
async def search_conversations(
    query: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
):
    """Search conversations by title or content."""
    try:
        # Search in conversation titles
        title_matches = await Conversation.find(
            Conversation.user_id == current_user.id,
            {"title": {"$regex": query, "$options": "i"}}
        ).limit(limit).to_list()
        
        # Search in message content
        message_matches = await Message.aggregate([
            {
                "$match": {
                    "content": {"$regex": query, "$options": "i"}
                }
            },
            {
                "$lookup": {
                    "from": "conversations",
                    "localField": "conversation_id",
                    "foreignField": "_id",
                    "as": "conversation"
                }
            },
            {
                "$match": {
                    "conversation.user_id": current_user.id
                }
            },
            {
                "$group": {
                    "_id": "$conversation_id",
                    "conversation": {"$first": "$conversation"},
                    "matching_messages": {"$push": "$$ROOT"}
                }
            },
            {
                "$limit": limit
            }
        ]).to_list()
        
        results = {
            "title_matches": [
                {
                    "id": str(conv.id),
                    "title": conv.title,
                    "updated_at": conv.updated_at,
                    "message_count": conv.message_count
                }
                for conv in title_matches
            ],
            "content_matches": [
                {
                    "conversation_id": str(match["_id"]),
                    "conversation_title": match["conversation"][0]["title"],
                    "matching_messages": len(match["matching_messages"])
                }
                for match in message_matches
            ]
        }
        
        return results
        
    except Exception as e:
        logger.error("Failed to search conversations", error=str(e), query=query)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search conversations"
        )


@router.post("/conversations/{conversation_id}/archive")
async def archive_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Archive a conversation."""
    try:
        conv_id = get_object_id(conversation_id)
        conversation = await Conversation.get(conv_id)
        
        if not conversation or conversation.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        conversation.status = ConversationStatus.ARCHIVED
        conversation.update_timestamp()
        await conversation.save()
        
        logger.info("Conversation archived", conversation_id=conversation_id, user_id=str(current_user.id))
        
        return {"message": "Conversation archived successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to archive conversation", error=str(e), conversation_id=conversation_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to archive conversation"
        )


@router.post("/conversations/{conversation_id}/restore")
async def restore_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Restore an archived conversation."""
    try:
        conv_id = get_object_id(conversation_id)
        conversation = await Conversation.get(conv_id)
        
        if not conversation or conversation.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        conversation.status = ConversationStatus.ACTIVE
        conversation.update_timestamp()
        await conversation.save()
        
        logger.info("Conversation restored", conversation_id=conversation_id, user_id=str(current_user.id))
        
        return {"message": "Conversation restored successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to restore conversation", error=str(e), conversation_id=conversation_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to restore conversation"
        )
