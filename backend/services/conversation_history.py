from typing import List, Optional, Dict, Any
from datetime import datetime
from firebase_admin import firestore
from pydantic import BaseModel
from .context_manager import SimpleContextManager

class Message(BaseModel):
    id: Optional[str] = None
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
        self.context_manager = SimpleContextManager(db)

    async def save_message(self, user_id: str, content: str, sender: str) -> bool:
        try:
            # Get the active conversation or create a new one
            active_conv_ref = self.db.collection('conversations')
            query = active_conv_ref.where('userId', '==', user_id)\
                                 .where('active', '==', True)\
                                 .order_by('updatedAt', direction=firestore.Query.DESCENDING)
            
            docs = list(query.stream())
            
            if not docs:
                # Create new conversation
                new_conv_ref = active_conv_ref.document()
                new_conv_ref.set({
                    'userId': user_id,
                    'createdAt': firestore.SERVER_TIMESTAMP,
                    'updatedAt': firestore.SERVER_TIMESTAMP,
                    'active': True,
                    'context': {}  # Initialize empty context
                })
                conversation_id = new_conv_ref.id
            else:
                conversation_id = docs[0].id

            # Add message to the messages subcollection
            messages_ref = active_conv_ref.document(conversation_id).collection('messages')
            message_ref = messages_ref.document()
            message_ref.set({
                'content': content,
                'sender': sender,
                'timestamp': firestore.SERVER_TIMESTAMP
            })

            # Update context with the latest message for context awareness
            await self.context_manager.update_context(conversation_id, {
                'last_message': content,
                'last_sender': sender,
                'message_count': firestore.Increment(1)
            })

            return True
        except Exception as e:
            print('Error saving message:', str(e))
            return False

    async def get_conversation_history(self, user_id: str, conversation_id: Optional[str] = None) -> dict:
        try:
            conversation_data = None
            if conversation_id:
                # Get messages from the specific conversation
                print("conversation id is present")
                conv_ref = self.db.collection('conversations').document(conversation_id)
                conv_doc = conv_ref.get()
                
                if not conv_doc.exists:
                    print(f'Conversation {conversation_id} not found')
                    return {'conversation': None, 'messages': []}
                    
                # Verify user has access to this conversation
                conv_data = conv_doc.to_dict()
                if conv_data.get('userId') != user_id:
                    print(f'User {user_id} not authorized to access conversation {conversation_id}')
                    return {'conversation': None, 'messages': []}
                
                conversation_data = {
                    'id': conv_doc.id,
                    **conv_data
                }    
                messages_ref = conv_ref.collection('messages')
                messages = messages_ref.order_by('timestamp', direction=firestore.Query.ASCENDING).stream()
            else:
                # Get the active conversation
                active_conv_ref = self.db.collection('conversations')
                query = active_conv_ref.where('userId', '==', user_id)\
                                     .where('active', '==', True)\
                                     .order_by('updatedAt', direction=firestore.Query.DESCENDING)\
                                     .limit(1)
                docs = list(query.stream())
                if not docs:
                    print(f"No active conversations found for user {user_id}")
                    return {'conversation': None, 'messages': []}
                
                conv_doc = docs[0]
                conversation_data = {
                    'id': conv_doc.id,
                    **conv_doc.to_dict()
                }
                messages_ref = conv_doc.reference.collection('messages')
                messages = messages_ref.order_by('timestamp', direction=firestore.Query.ASCENDING).stream()
            # Convert messages to list
            message_list = []
            for msg in messages:
                msg_data = msg.to_dict()
                if not all(key in msg_data for key in ['content', 'sender', 'timestamp']):
                    print(f"Skipping message {msg.id} due to missing required fields")
                    continue
                    
                message_list.append(Message(
                    id=msg.id,
                    content=msg_data['content'],
                    sender=msg_data['sender'],
                    timestamp=msg_data['timestamp']
                ))
            
            return {
                'conversation': conversation_data,
                'messages': message_list
            }
            
        except Exception as e:
            print(f'Error getting conversation history: {str(e)}')
            return {'conversation': None, 'messages': []}

    async def start_new_conversation(self, user_id: str) -> bool:
        try:
            # Set all existing conversations to inactive
            print("starting conversation in conversation history")
            active_conv_ref = self.db.collection('conversations')
            print("check 1")
            query = active_conv_ref.where('userId', '==', user_id).where('active', '==', True)
            print("check 2")
            docs = list(query.stream())
            print("check 3")
            # Update all active conversations to inactive
            batch = self.db.batch()
            print("check 4")
            for doc in docs:
                doc_ref = active_conv_ref.document(doc.id)
                batch.update(doc_ref, {'active': False})
            print("check 5")
            batch.commit()
            print("check 6")
            # Create new conversation with empty context
            new_conv_ref = active_conv_ref.document()
            print("check 7")
            new_conv_ref.set({
                'userId': user_id,
                'createdAt': firestore.SERVER_TIMESTAMP,
                'updatedAt': firestore.SERVER_TIMESTAMP,
                'active': True,
                'context': {}  # Initialize empty context
            })
            print("check 8")

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

            docs = list(query.stream())
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
                messages_ref = doc.reference.collection('messages')
                first_message_query = messages_ref.order_by('timestamp').limit(1).stream()
                first_messages = list(first_message_query)
                first_message = first_messages[0].get('content') if first_messages else ''

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

    async def get_conversation_context(self, conversation_id: str) -> Dict[str, Any]:
        """Get the context for a specific conversation"""
        return await self.context_manager.get_context(conversation_id)

    async def update_conversation_context(self, conversation_id: str, context_updates: Dict[str, Any]) -> bool:
        """Update the context for a specific conversation"""
        return await self.context_manager.update_context(conversation_id, context_updates)