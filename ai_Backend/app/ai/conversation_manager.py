"""
Conversation management and context handling.
"""
from typing import List, Dict, Any, Optional
import structlog
from bson import ObjectId

from app.models.conversation import Conversation, Message, MessageType, MessageStatus
from app.ai.models import model_manager

logger = structlog.get_logger()


class ConversationManager:
    """Manages conversation flow and context."""
    
    def __init__(self):
        self.active_conversations: Dict[str, Dict] = {}
    
    async def process_user_message(
        self, 
        conversation_id: ObjectId, 
        user_message: str,
        user_id: ObjectId
    ) -> Dict[str, Any]:
        """
        Process a user message and generate an AI response.
        
        Args:
            conversation_id: The conversation ID
            user_message: The user's message content
            user_id: The user ID
            
        Returns:
            Dictionary containing the AI response and metadata
        """
        try:
            # Get or create conversation
            conversation = await self._get_or_create_conversation(
                conversation_id, user_id
            )
            
            # Save user message
            user_msg = await conversation.add_message(
                content=user_message,
                message_type=MessageType.USER
            )
            
            # Create pending AI message
            ai_msg = await conversation.add_message(
                content="",
                message_type=MessageType.ASSISTANT,
                status=MessageStatus.PROCESSING
            )
            
            # Get conversation history for context
            conversation_history = await self._get_conversation_context(conversation)
            
            # Generate AI response
            response_text, metadata = await model_manager.generate_response(
                conversation_history=conversation_history,
                max_tokens=conversation.model_config.get("max_tokens"),
                temperature=conversation.model_config.get("temperature")
            )
            
            # Update AI message with response
            ai_msg.content = response_text
            ai_msg.status = MessageStatus.COMPLETED
            ai_msg.model_used = metadata.get("model_used")
            ai_msg.confidence_score = metadata.get("confidence_score")
            ai_msg.processing_time = metadata.get("processing_time")
            ai_msg.metadata = metadata
            
            await ai_msg.save()
            
            # Update conversation stats
            conversation.total_tokens_used += metadata.get("tokens_used", 0)
            await conversation.save()
            
            logger.info(
                "Processed user message",
                conversation_id=str(conversation_id),
                user_id=str(user_id),
                response_length=len(response_text),
                processing_time=metadata.get("processing_time")
            )
            
            return {
                "conversation_id": str(conversation.id),
                "user_message_id": str(user_msg.id),
                "ai_message_id": str(ai_msg.id),
                "response": response_text,
                "metadata": metadata
            }
            
        except Exception as e:
            logger.error(
                "Failed to process user message",
                error=str(e),
                conversation_id=str(conversation_id),
                user_id=str(user_id)
            )
            
            # Update AI message status to failed if it exists
            if 'ai_msg' in locals():
                ai_msg.status = MessageStatus.FAILED
                ai_msg.metadata = {"error": str(e)}
                await ai_msg.save()
            
            raise
    
    async def _get_or_create_conversation(
        self, 
        conversation_id: Optional[ObjectId], 
        user_id: ObjectId
    ) -> Conversation:
        """Get existing conversation or create a new one."""
        if conversation_id:
            conversation = await Conversation.get(conversation_id)
            if conversation and conversation.user_id == user_id:
                return conversation
        
        # Create new conversation
        conversation = Conversation(
            user_id=user_id,
            title="New Conversation",
            model_config={
                "max_tokens": 512,
                "temperature": 0.7
            }
        )
        await conversation.insert()
        
        logger.info(
            "Created new conversation",
            conversation_id=str(conversation.id),
            user_id=str(user_id)
        )
        
        return conversation
    
    async def _get_conversation_context(
        self, 
        conversation: Conversation
    ) -> List[Dict[str, str]]:
        """Get conversation history formatted for the AI model."""
        messages = await conversation.get_messages(
            limit=conversation.context_window
        )
        
        # Reverse to get chronological order
        messages.reverse()
        
        context = []
        for message in messages:
            if message.status == MessageStatus.COMPLETED:
                role = "user" if message.message_type == MessageType.USER else "assistant"
                context.append({
                    "role": role,
                    "content": message.content
                })
        
        return context
    
    async def get_conversation_summary(
        self, 
        conversation_id: ObjectId
    ) -> Dict[str, Any]:
        """Get a summary of the conversation."""
        conversation = await Conversation.get(conversation_id)
        if not conversation:
            raise ValueError("Conversation not found")
        
        messages = await conversation.get_messages(limit=10)
        
        return {
            "conversation_id": str(conversation.id),
            "title": conversation.title,
            "status": conversation.status,
            "message_count": conversation.message_count,
            "created_at": conversation.created_at,
            "updated_at": conversation.updated_at,
            "recent_messages": [
                {
                    "id": str(msg.id),
                    "content": msg.content[:100] + "..." if len(msg.content) > 100 else msg.content,
                    "type": msg.message_type,
                    "timestamp": msg.timestamp
                }
                for msg in messages[:5]
            ]
        }
    
    async def update_conversation_title(
        self, 
        conversation_id: ObjectId, 
        title: str
    ) -> bool:
        """Update conversation title."""
        try:
            conversation = await Conversation.get(conversation_id)
            if conversation:
                conversation.title = title
                conversation.update_timestamp()
                await conversation.save()
                return True
            return False
        except Exception as e:
            logger.error("Failed to update conversation title", error=str(e))
            return False


# Global conversation manager instance
conversation_manager = ConversationManager()
