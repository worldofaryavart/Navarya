from typing import Dict, Any, Optional, List
from datetime import datetime
import json
from firebase_admin import firestore

class ContextManager:
    def __init__(self, db: firestore.Client):
        self.db = db
        self._session_context: Dict[str, Any] = {}
        self._local_context: Dict[str, Any] = {}

    async def store_context(self, user_id: str, context_type: str, data: Dict[str, Any]) -> bool:
        """Store context in Firestore based on context type"""
        try:
            if context_type == "session":
                # Store in memory for quick access
                self._session_context[user_id] = data
                # Store in Firestore
                doc_ref = self.db.collection('context').document(user_id)
                doc_ref.set({
                    'session_context': data,
                    'updated_at': firestore.SERVER_TIMESTAMP
                }, merge=True)
                return True
            elif context_type == "persistent":
                doc_ref = self.db.collection('context').document(user_id)
                doc_ref.set({
                    'persistent_context': data,
                    'updated_at': firestore.SERVER_TIMESTAMP
                }, merge=True)
                return True
            elif context_type == "local":
                self._local_context[user_id] = data
                return True
            return False
        except Exception as e:
            print(f"Error storing context: {str(e)}")
            return False

    async def get_context(self, user_id: str, context_type: str) -> Optional[Dict[str, Any]]:
        """Retrieve context based on type"""
        try:
            if context_type == "session":
                return await self._get_session_context(user_id)
            elif context_type == "persistent":
                return await self._get_persistent_context(user_id)
            elif context_type == "local":
                return self._local_context.get(user_id, {})
            return None
        except Exception as e:
            print(f"Error retrieving context: {str(e)}")
            return None

    async def _get_session_context(self, user_id: str) -> Dict[str, Any]:
        """Get session context from memory or Firestore"""
        if user_id in self._session_context:
            return self._session_context[user_id]
        
        doc_ref = self.db.collection('context').document(user_id)
        doc = doc_ref.get()  # Get document synchronously
        if doc.exists:
            context_data = doc.to_dict().get('session_context', {})
            self._session_context[user_id] = context_data
            return context_data
        return {}

    async def _get_persistent_context(self, user_id: str) -> Dict[str, Any]:
        """Get persistent context from Firestore"""
        doc_ref = self.db.collection('context').document(user_id)
        doc = doc_ref.get()  # Get document synchronously
        if doc.exists:
            return doc.to_dict().get('persistent_context', {})
        return {}

    async def update_conversation_context(self, user_id: str, message: str, response: str):
        """Update conversation history and extract entities"""
        session_context = await self.get_context(user_id, "session")
        
        # Update conversation history
        history = session_context.get('conversation_history', [])
        history.append({
            'message': message,
            'response': response,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Keep only last 10 messages for performance
        if len(history) > 10:
            history = history[-10:]
        
        session_context['conversation_history'] = history
        await self.store_context(user_id, "session", session_context)

    async def clear_context(self, user_id: str, context_type: str = "all"):
        """Clear specific or all context types"""
        try:
            if context_type in ["session", "all"]:
                self._session_context.pop(user_id, None)
            if context_type in ["local", "all"]:
                self._local_context.pop(user_id, None)
            if context_type in ["persistent", "all"]:
                doc_ref = self.db.collection('context').document(user_id)
                doc_ref.delete()
            return True
        except Exception as e:
            print(f"Error clearing context: {str(e)}")
            return False

    async def update_conversation_context(self, user_id: str, message: str, response: str):
        """Update conversation history and extract entities"""
        session_context = await self.get_context(user_id, "session")
        
        # Update conversation history
        history = session_context.get('conversation_history', [])
        history.append({
            'message': message,
            'response': response,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Keep only last 10 messages for performance
        if len(history) > 10:
            history = history[-10:]
        
        session_context['conversation_history'] = history
        await self.store_context(user_id, "session", session_context)

    def get_recent_context(self, user_id: str, message: str) -> Dict[str, Any]:
        """Get relevant context for the current message"""
        session_context = self._session_context.get(user_id, {})
        local_context = self._local_context.get(user_id, {})
        
        return {
            'session': session_context,
            'local': local_context,
            'current_message': message
        }
