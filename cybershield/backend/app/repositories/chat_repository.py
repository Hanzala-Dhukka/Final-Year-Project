"""
Chat repository for MongoDB operations.
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
from app.core.database import get_collection


class ChatRepository:
    """Repository for chat database operations."""
    
    def __init__(self):
        self.collection_name = "ai_conversations"
    
    async def create_conversation(self, conversation_data: Dict[str, Any]) -> Optional[str]:
        """
        Create a new conversation.
        
        Args:
            conversation_data: Conversation data dictionary
            
        Returns:
            Conversation ID if successful, None otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            # Add timestamps
            conversation_data["created_at"] = datetime.now(timezone.utc)
            conversation_data["updated_at"] = datetime.now(timezone.utc)
            conversation_data["last_message_at"] = datetime.now(timezone.utc)
            
            result = await collection.insert_one(conversation_data)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error creating conversation: {e}")
            return None
    
    async def get_conversation_by_id(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """
        Get conversation by ID.
        
        Args:
            conversation_id: Conversation's MongoDB ObjectId as string
            
        Returns:
            Conversation document if found, None otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            conversation = await collection.find_one({"_id": ObjectId(conversation_id)})
            return conversation
        except Exception as e:
            print(f"Error getting conversation by ID: {e}")
            return None
    
    async def get_conversation_by_conversation_id(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """
        Get conversation by conversation_id field.
        
        Args:
            conversation_id: Unique conversation identifier
            
        Returns:
            Conversation document if found, None otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            conversation = await collection.find_one({"conversation_id": conversation_id})
            return conversation
        except Exception as e:
            print(f"Error getting conversation by conversation_id: {e}")
            return None
    
    async def get_user_conversations(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get all conversations for a user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            limit: Maximum number of conversations to return
            
        Returns:
            List of conversation documents
        """
        try:
            collection = get_collection(self.collection_name)
            conversations = []
            
            cursor = collection.find({"user_id": user_id}).sort("last_message_at", -1).limit(limit)
            async for conversation in cursor:
                conversations.append(conversation)
            
            return conversations
        except Exception as e:
            print(f"Error getting user conversations: {e}")
            return []
    
    async def add_message_to_conversation(self, conversation_id: str, message: Dict[str, Any]) -> bool:
        """
        Add a message to a conversation.
        
        Args:
            conversation_id: Conversation's MongoDB ObjectId as string
            message: Message data dictionary
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            # Add message to messages array
            result = await collection.update_one(
                {"_id": ObjectId(conversation_id)},
                {
                    "$push": {"messages": message},
                    "$set": {
                        "updated_at": datetime.now(timezone.utc),
                        "last_message_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error adding message to conversation: {e}")
            return False
    
    async def update_conversation(self, conversation_id: str, update_data: Dict[str, Any]) -> bool:
        """
        Update conversation data.
        
        Args:
            conversation_id: Conversation's MongoDB ObjectId as string
            update_data: Data to update
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            # Add updated timestamp
            update_data["updated_at"] = datetime.now(timezone.utc)
            
            result = await collection.update_one(
                {"_id": ObjectId(conversation_id)},
                {"$set": update_data}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating conversation: {e}")
            return False
    
    async def delete_conversation(self, conversation_id: str) -> bool:
        """
        Delete conversation.
        
        Args:
            conversation_id: Conversation's MongoDB ObjectId as string
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            result = await collection.delete_one({"_id": ObjectId(conversation_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting conversation: {e}")
            return False
    
    async def close_conversation(self, conversation_id: str) -> bool:
        """
        Close a conversation.
        
        Args:
            conversation_id: Conversation's MongoDB ObjectId as string
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            result = await collection.update_one(
                {"_id": ObjectId(conversation_id)},
                {
                    "$set": {
                        "status": "closed",
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error closing conversation: {e}")
            return False
    
    async def get_recent_conversations(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get recent conversations across all users.
        
        Args:
            limit: Maximum number of conversations to return
            
        Returns:
            List of recent conversation documents
        """
        try:
            collection = get_collection(self.collection_name)
            conversations = []
            
            cursor = collection.find({}).sort("last_message_at", -1).limit(limit)
            async for conversation in cursor:
                conversations.append(conversation)
            
            return conversations
        except Exception as e:
            print(f"Error getting recent conversations: {e}")
            return []


    async def get_chats_by_user(self, user_id: str, limit: int = 50):
        """Async alias for get_user_conversations, used by dashboard routes."""
        return await self.get_user_conversations(user_id, limit)


# Create singleton instance
chat_repository = ChatRepository()