import { auth } from '@/utils/config/firebase.config';

export interface Message {
  content: string;
  timestamp: Date;
  sender: 'user' | 'assistant';
}

export interface Conversation {
  id: string;
  userId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationInfo {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
  firstMessage?: string;
}

export interface ConversationsResponse {
  conversations: ConversationInfo[];
  hasMore: boolean;
  lastDoc?: any;
}

export const saveMessage = async (content: string, sender: 'user' | 'assistant') => {
  try {
    const response = await fetch('/api/conversations/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth?.currentUser?.getIdToken()}`
      },
      body: JSON.stringify({ content, sender })
    });

    if (!response.ok) {
      throw new Error('Failed to save message');
    }

    return true;
  } catch (error) {
    console.error('Error saving message:', error);
    return false;
  }
};

export const getConversationHistory = async (conversationId?: string): Promise<Message[]> => {
  try {
    const url = new URL('/api/conversations/history', window.location.origin);
    if (conversationId) {
      url.searchParams.append('conversation_id', conversationId);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${await auth?.currentUser?.getIdToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get conversation history');
    }

    const data = await response.json();
    return data.map((msg: any) => ({
      content: msg.content,
      sender: msg.sender,
      timestamp: new Date(msg.timestamp)
    }));
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }
};

export const startNewConversation = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/conversations/new', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await auth?.currentUser?.getIdToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to start new conversation');
    }

    return true;
  } catch (error) {
    console.error('Error starting new conversation:', error);
    return false;
  }
};

export const getAllConversations = async (
  pageSize: number = 6,
  lastDoc?: any
): Promise<ConversationsResponse> => {
  try {
    const url = new URL('/api/conversations', window.location.origin);
    url.searchParams.append('page_size', pageSize.toString());
    if (lastDoc) {
      url.searchParams.append('last_doc', JSON.stringify(lastDoc));
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${await auth?.currentUser?.getIdToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get conversations');
    }

    const data = await response.json();
    return {
      conversations: data.conversations.map((conv: any) => ({
        id: conv.id,
        createdAt: new Date(conv.created_at),
        updatedAt: new Date(conv.updated_at),
        active: conv.active,
        firstMessage: conv.first_message
      })),
      hasMore: data.has_more,
      lastDoc: data.last_doc
    };
  } catch (error) {
    console.error('Error getting all conversations:', error);
    return {
      conversations: [],
      hasMore: false
    };
  }
};
