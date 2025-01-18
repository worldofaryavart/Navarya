from typing import List, Optional, Dict
from datetime import datetime
from firebase_admin import firestore
from pydantic import BaseModel

class Message(BaseModel):
    content: str
    timestamp: datetime
    sender: str

class ConversationInfo(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime
    active: bool
    first_message: Optional[str] = None

class ConversationsResponse(BaseModel):
    conversations: List[ConversationInfo]
    has_more: bool
    last_doc: Optional[Dict] = None

class ConversationHistoryService:
    def __init__(self, db: firestore.Client):
        self.db = db

    async def save_message(self, user_id: str, content: str, sender: str) -> bool:
        try:
            # Get the active conversation or create a new one
            active_conv_ref = self.db.collection('conversations')
            query = active_conv_ref.where('userId', '==', user_id)\
                                 .where('active', '==', True)\
                                 .order_by('updatedAt', direction=firestore.Query.DESCENDING)
            
            docs = query.get()
            
            if not docs:
                # Create new conversation
                new_conversation = active_conv_ref.add({
                    'userId': user_id,
                    'createdAt': firestore.SERVER_TIMESTAMP,
                    'updatedAt': firestore.SERVER_TIMESTAMP,
                    'active': True
                })[1]
                conversation_id = new_conversation.id
            else:
                conversation_id = docs[0].id

            # Add message to the messages subcollection
            messages_ref = active_conv_ref.document(conversation_id).collection('messages')
            messages_ref.add({
                'content': content,
                'sender': sender,
                'timestamp': firestore.SERVER_TIMESTAMP
            })

            return True
        except Exception as e:
            print('Error saving message:', str(e))
            return False

    async def get_conversation_history(self, user_id: str, conversation_id: Optional[str] = None) -> List[Message]:
        try:
            target_conversation_id = conversation_id
            
            if not target_conversation_id:
                # Get the active conversation
                active_conv_ref = self.db.collection('conversations')
                query = active_conv_ref.where('userId', '==', user_id)\
                                     .where('active', '==', True)\
                                     .order_by('updatedAt', direction=firestore.Query.DESCENDING)
                
                docs = query.get()
                if not docs:
                    return []
                target_conversation_id = docs[0].id

            # Get messages from the conversation
            messages_ref = self.db.collection(f'conversations/{target_conversation_id}/messages')
            messages = messages_ref.order_by('timestamp', direction=firestore.Query.ASCENDING).get()

            return [
                Message(
                    content=msg.get('content'),
                    sender=msg.get('sender'),
                    timestamp=msg.get('timestamp')
                )
                for msg in messages
            ]
        except Exception as e:
            print('Error getting conversation history:', str(e))
            return []

    async def start_new_conversation(self, user_id: str) -> bool:
        try:
            # Set all existing conversations to inactive
            active_conv_ref = self.db.collection('conversations')
            query = active_conv_ref.where('userId', '==', user_id).where('active', '==', True)
            
            docs = query.get()
            
            # Update all active conversations to inactive
            batch = self.db.batch()
            for doc in docs:
                doc_ref = active_conv_ref.document(doc.id)
                batch.update(doc_ref, {'active': False})
            batch.commit()

            # Create new conversation
            active_conv_ref.add({
                'userId': user_id,
                'createdAt': firestore.SERVER_TIMESTAMP,
                'updatedAt': firestore.SERVER_TIMESTAMP,
                'active': True
            })

            return True
        except Exception as e:
            print('Error starting new conversation:', str(e))
            return False

    async def get_all_conversations(self, user_id: str, page_size: int = 6, last_doc: Optional[Dict] = None) -> ConversationsResponse:
        try:
            conversations_ref = self.db.collection('conversations')
            query = conversations_ref.where('userId', '==', user_id)\
                                   .order_by('updatedAt', direction=firestore.Query.DESCENDING)\
                                   .limit(page_size + 1)

            if last_doc:
                query = query.start_after(last_doc)

            docs = query.get()
            conversations = []
            has_more = False
            last_visible = None

            # Process only page_size items
            if len(docs) > page_size:
                has_more = True
                docs = docs[:-1]

            for doc in docs:
                last_visible = doc
                data = doc.to_dict()
                
                # Get first message
                messages_ref = self.db.collection(f'conversations/{doc.id}/messages')
                first_message_query = messages_ref.order_by('timestamp').limit(1).get()
                first_message = first_message_query[0].get('content') if first_message_query else ''

                conversations.append(
                    ConversationInfo(
                        id=doc.id,
                        created_at=data.get('createdAt'),
                        updated_at=data.get('updatedAt'),
                        active=data.get('active'),
                        first_message=first_message
                    )
                )

            return ConversationsResponse(
                conversations=conversations,
                has_more=has_more,
                last_doc=last_visible.to_dict() if last_visible else None
            )
        except Exception as e:
            print('Error getting all conversations:', str(e))
            return ConversationsResponse(conversations=[], has_more=False)