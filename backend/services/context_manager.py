from typing import Dict, Any, Optional, List, Union
from datetime import datetime
import json
from enum import Enum
from firebase_admin import firestore
from pydantic import BaseModel

class ContextType(str, Enum):
    SESSION = "session"
    LOCAL = "local"
    PERSISTENT = "persistent"
    GLOBAL = "global"

class ContextPriority:
    PRIORITIES = {
        ContextType.SESSION: 4,
        ContextType.LOCAL: 3,
        ContextType.PERSISTENT: 2,
        ContextType.GLOBAL: 1
    }

class Context(BaseModel):
    type: ContextType
    data: Dict[str, Any]
    user_id: Optional[str]
    metadata: Dict[str, Any] = {}
    timestamp: datetime = datetime.utcnow()

class ContextManager:
    def __init__(self, db: firestore.Client):
        self.db = db
        self._session_context: Dict[str, Dict[str, Any]] = {}
        self._local_context: Dict[str, Dict[str, Any]] = {}
        self._global_context: Dict[str, Any] = {}
        self._context_cache: Dict[str, Dict[str, Any]] = {}
        self._cache_ttl = 300  # 5 minutes cache TTL

    async def store_context(
        self,
        user_id: str,
        context_type: Union[str, ContextType],
        data: Dict[str, Any],
        metadata: Dict[str, Any] = None
    ) -> bool:
        """Store context with enhanced metadata and caching"""
        try:
            if isinstance(context_type, str):
                context_type = ContextType(context_type)

            context = Context(
                type=context_type,
                data=data,
                user_id=user_id,
                metadata=metadata or {},
            )

            if context_type == ContextType.SESSION:
                self._session_context[user_id] = context.dict()
                doc_ref = self.db.collection('context').document(user_id)
                doc_ref.set({
                    'session_context': context.dict(),
                    'updated_at': firestore.SERVER_TIMESTAMP
                }, merge=True)
            
            elif context_type == ContextType.PERSISTENT:
                doc_ref = self.db.collection('context').document(user_id)
                doc_ref.set({
                    'persistent_context': context.dict(),
                    'updated_at': firestore.SERVER_TIMESTAMP
                }, merge=True)
                
            elif context_type == ContextType.LOCAL:
                self._local_context[user_id] = context.dict()
                
            elif context_type == ContextType.GLOBAL:
                self._global_context = context.dict()
                doc_ref = self.db.collection('context').document('global')
                doc_ref.set(context.dict(), merge=True)

            # Update cache
            cache_key = f"{user_id}:{context_type.value}"
            self._context_cache[cache_key] = {
                'data': context.dict(),
                'timestamp': datetime.utcnow()
            }
            
            return True
        except Exception as e:
            print(f"Error storing context: {str(e)}")
            return False

    async def get_context(
        self,
        user_id: str,
        context_type: Union[str, ContextType]
    ) -> Optional[Dict[str, Any]]:
        """Retrieve context with caching"""
        try:
            if isinstance(context_type, str):
                context_type = ContextType(context_type)

            cache_key = f"{user_id}:{context_type.value}"
            cached = self._context_cache.get(cache_key)
            
            if cached and (datetime.utcnow() - cached['timestamp']).seconds < self._cache_ttl:
                return cached['data']

            if context_type == ContextType.SESSION:
                return await self._get_session_context(user_id)
            elif context_type == ContextType.PERSISTENT:
                return await self._get_persistent_context(user_id)
            elif context_type == ContextType.LOCAL:
                return self._local_context.get(user_id, {})
            elif context_type == ContextType.GLOBAL:
                return await self._get_global_context()
            return None
        except Exception as e:
            print(f"Error retrieving context: {str(e)}")
            return None

    async def _get_session_context(self, user_id: str) -> Dict[str, Any]:
        """Get session context with improved caching"""
        if user_id in self._session_context:
            return self._session_context[user_id]
        
        doc_ref = self.db.collection('context').document(user_id)
        doc = doc_ref.get()
        if doc.exists:
            context_data = doc.to_dict().get('session_context', {})
            self._session_context[user_id] = context_data
            return context_data
        return {}

    async def _get_persistent_context(self, user_id: str) -> Dict[str, Any]:
        doc_ref = self.db.collection('context').document(user_id)
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict().get('persistent_context', {})
        return {}

    async def _get_global_context(self) -> Dict[str, Any]:
        """Get global context from Firestore"""
        doc_ref = self.db.collection('context').document('global')
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict()
        return {}

    async def merge_contexts(
        self,
        user_id: str,
        context_types: Optional[List[ContextType]] = None
    ) -> Dict[str, Any]:
        """Merge multiple context types with priority handling"""
        if context_types is None:
            context_types = list(ContextType)

        merged_data = {}
        contexts = []

        for ctx_type in sorted(context_types, key=lambda x: ContextPriority.PRIORITIES[x], reverse=True):
            context = await self.get_context(user_id, ctx_type)
            if context:
                contexts.append(context)

        for context in contexts:
            if isinstance(context.get('data'), dict):
                merged_data.update(context['data'])
            else:
                merged_data.update(context)

        return merged_data

    async def update_conversation_context(
        self,
        user_id: str,
        message: str,
        response: str,
        metadata: Dict[str, Any] = None
    ):
        """Enhanced conversation context with metadata"""
        session_context = await self.get_context(user_id, ContextType.SESSION)
        
        history = session_context.get('conversation_history', [])
        history.append({
            'message': message,
            'response': response,
            'timestamp': datetime.utcnow().isoformat(),
            'metadata': metadata or {}
        })
        
        if len(history) > 10:
            history = history[-10:]
        
        session_context['conversation_history'] = history
        await self.store_context(user_id, ContextType.SESSION, session_context)

    async def clear_context(
        self,
        user_id: str,
        context_type: Union[str, ContextType] = "all"
    ):
        """Clear context with enhanced type handling"""
        try:
            if isinstance(context_type, str) and context_type != "all":
                context_type = ContextType(context_type)

            if context_type in [ContextType.SESSION, "all"]:
                self._session_context.pop(user_id, None)
                doc_ref = self.db.collection('context').document(user_id)
                doc_ref.update({'session_context': firestore.DELETE_FIELD})

            if context_type in [ContextType.LOCAL, "all"]:
                self._local_context.pop(user_id, None)

            if context_type in [ContextType.PERSISTENT, "all"]:
                doc_ref = self.db.collection('context').document(user_id)
                doc_ref.update({'persistent_context': firestore.DELETE_FIELD})

            if context_type in [ContextType.GLOBAL, "all"]:
                self._global_context = {}
                doc_ref = self.db.collection('context').document('global')
                doc_ref.delete()

            # Clear cache
            cache_keys = [k for k in self._context_cache.keys() if k.startswith(f"{user_id}:")]
            for key in cache_keys:
                self._context_cache.pop(key, None)

        except Exception as e:
            print(f"Error clearing context: {str(e)}")

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics for monitoring"""
        return {
            'cache_size': len(self._context_cache),
            'session_contexts': len(self._session_context),
            'local_contexts': len(self._local_context)
        }
