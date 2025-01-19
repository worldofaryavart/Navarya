from typing import Dict, Any, Optional
from datetime import datetime
from firebase_admin import firestore
from pydantic import BaseModel

class ConversationContext(BaseModel):
    conversation_id: str
    context: Dict[str, Any]
    updated_at: datetime = datetime.utcnow()

class SimpleContextManager:
    def __init__(self, db: firestore.Client):
        self.db = db
        self.conversations_ref = db.collection('conversations')
        self._context_cache: Dict[str, ConversationContext] = {}
    
    async def get_context(self, conversation_id: str) -> Dict[str, Any]:
        """Get context for a specific conversation"""
        try:
            # Check cache first
            if conversation_id in self._context_cache:
                return self._context_cache[conversation_id].context
            
            doc_ref = self.conversations_ref.document(conversation_id)
            doc = doc_ref.get()
            if doc.exists:
                data = doc.to_dict()
                context_data = data.get('context', {})
                self._context_cache[conversation_id] = ConversationContext(
                    conversation_id=conversation_id,
                    context=context_data
                )
                return context_data
            else:
                # Initialize context if it doesn't exist
                context = {}
                doc_ref.set({'context': context})
                self._context_cache[conversation_id] = ConversationContext(
                    conversation_id=conversation_id,
                    context=context
                )
                return context
        except Exception as e:
            print(f"Error getting context: {str(e)}")
            return {}

    async def update_context(self, conversation_id: str, updates: Dict[str, Any]) -> bool:
        """Update context for a specific conversation"""
        try:
            doc_ref = self.conversations_ref.document(conversation_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                # Create document if it doesn't exist
                doc_ref.set({
                    'context': updates,
                    'createdAt': firestore.SERVER_TIMESTAMP,
                    'updatedAt': firestore.SERVER_TIMESTAMP
                })
            else:
                # Update existing context
                current_context = doc.to_dict().get('context', {})
                current_context.update(updates)
                doc_ref.update({
                    'context': current_context,
                    'updatedAt': firestore.SERVER_TIMESTAMP
                })
            
            # Update cache
            self._context_cache[conversation_id] = ConversationContext(
                conversation_id=conversation_id,
                context=current_context
            )
            
            return True
        except Exception as e:
            print(f"Error updating context: {str(e)}")
            return False

    async def clear_context(self, conversation_id: str) -> bool:
        """Clear context for a specific conversation"""
        try:
            doc_ref = self.conversations_ref.document(conversation_id)
            doc_ref.update({
                'context': {},
                'updatedAt': firestore.SERVER_TIMESTAMP
            })
            
            # Clear from cache
            if conversation_id in self._context_cache:
                del self._context_cache[conversation_id]
            
            return True
            
        except Exception as e:
            print(f"Error clearing context: {str(e)}")
            return False

    def _clear_cache(self):
        """Clear the entire context cache"""
        self._context_cache.clear()
