import { getApiUrl } from '@/utils/config/api.config';
import { auth } from '@/utils/config/firebase.config';

export interface Message {
  content: string;
  timestamp: Date;
  sender: 'user' | 'ai';
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

const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  return token;
};

export const getConversationHistory = async (conversationId?: string): Promise<Message[]> => {
  try {
    const token = await getAuthToken();
    const response = await fetch(getApiUrl(`/api/conversations/history${conversationId ? `/${conversationId}` : ''}`), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      // Token expired, try to refresh and retry once
      const newToken = await auth.currentUser?.getIdToken(true);
      if (newToken) {
        const retryResponse = await fetch(getApiUrl(`/api/conversations/history${conversationId ? `/${conversationId}` : ''}`), {
          headers: {
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json'
          }
        });
        if (retryResponse.ok) {
          const data = await retryResponse.json();
          console.log("data is : ", data)
          return data.messages.map((msg: any) => ({
            content: msg.content,
            sender: msg.sender,
            timestamp: new Date(msg.timestamp)
          }));
        }
      }
      throw new Error('Authentication failed');
    }

    if (!response.ok) {
      throw new Error('Failed to fetch conversation history');
    }

    const data = await response.json();
    return data.messages.map((msg: any) => ({
      content: msg.content,
      sender: msg.sender,
      timestamp: new Date(msg.timestamp)
    }));
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }
};

export const startNewConversation = async (): Promise<{ status: string; id?: string; message?: string }> => {
  try {
    const token = await getAuthToken();
    const response = await fetch(getApiUrl(`/api/conversations/new`), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to start new conversation');
    }

    // Parse response JSON
    const data = await response.json();

    // Return the response object with status and id
    return data;
  } catch (error: any) {
    console.error('Error starting new conversation:', error);
    return { status: 'error', message: error.message || 'Unknown error' };
  }
};


export const getAllConversations = async (
  pageSize: number = 6,
  lastDoc?: any
): Promise<ConversationsResponse> => {
  try {
    const token = await getAuthToken();
    const url = new URL(getApiUrl('/api/conversations'), window.location.origin);
    url.searchParams.append('page_size', pageSize.toString());
    if (lastDoc) {
      url.searchParams.append('last_doc', JSON.stringify(lastDoc));
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch conversations');
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
