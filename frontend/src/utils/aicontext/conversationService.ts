import { db,auth } from '../config/firebase.config';

import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, DocumentData, updateDoc, doc, limit, startAfter } from 'firebase/firestore';

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
    const user = auth?.currentUser;
    if (!user || !db) {
      throw new Error('User not authenticated or database not initialized');
    }

    // Get the active conversation or create a new one
    const activeConvRef = collection(db, 'conversations');
    const q = query(
      activeConvRef,
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc'),
      where('active', '==', true)
    );

    const querySnapshot = await getDocs(q);
    let conversationId;

    if (querySnapshot.empty) {
      // Create new conversation
      const newConversation = await addDoc(activeConvRef, {
        userId: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        active: true
      });
      conversationId = newConversation.id;
    } else {
      conversationId = querySnapshot.docs[0].id;
    }

    // Add message to the messages subcollection
    const messagesRef = collection(db, `conversations/${conversationId}/messages`);
    await addDoc(messagesRef, {
      content,
      sender,
      timestamp: Timestamp.now()
    });

    return true;
  } catch (error) {
    console.error('Error saving message:', error);
    return false;
  }
};

export const getConversationHistory = async (conversationId?: string): Promise<Message[]> => {
  try {
    const user = auth?.currentUser;
    if (!user || !db) {
      throw new Error('User not authenticated or database not initialized');
    }

    let targetConversationId = conversationId;

    if (!targetConversationId) {
      // If no specific conversation ID is provided, get the active conversation
      const activeConvRef = collection(db, 'conversations');
      const q = query(
        activeConvRef,
        where('userId', '==', user.uid),
        orderBy('updatedAt', 'desc'),
        where('active', '==', true)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return [];
      }
      targetConversationId = querySnapshot.docs[0].id;
    }

    const messagesRef = collection(db, `conversations/${targetConversationId}/messages`);
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'));
    const messagesSnapshot = await getDocs(messagesQuery);

    return messagesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        content: data.content,
        sender: data.sender,
        timestamp: data.timestamp.toDate()
      };
    }).reverse();
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }
};

export const startNewConversation = async (): Promise<boolean> => {
  try {
    const user = auth?.currentUser;
    if (!user || !db) {
      throw new Error('User not authenticated or database not initialized');
    }

    // Set all existing conversations to inactive
    const activeConvRef = collection(db, 'conversations');
    const q = query(
      activeConvRef,
      where('userId', '==', user.uid),
      where('active', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const updatePromises = querySnapshot.docs.map(async (document) => {
      const docRef = doc(db!, 'conversations', document.id);
      await updateDoc(docRef, { active: false });
    });
    await Promise.all(updatePromises);

    // Create new conversation
    await addDoc(activeConvRef, {
      userId: user.uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      active: true
    });

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
    const user = auth?.currentUser;
    console.log("user is : ", user);
    if (!user || !db) {
      throw new Error('User not authenticated or database not initialized');
    }

    const conversationsRef = collection(db, 'conversations');
    let q = query(
      conversationsRef,
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc'),
      limit(pageSize + 1) // Get one extra to check if there are more
    );

    // If lastDoc is provided, start after it
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    const conversations: ConversationInfo[] = [];
    let lastVisible = null;
    let hasMore = false;

    // Process only pageSize items, keep the extra one to check if there are more
    const docs = querySnapshot.docs;
    if (docs.length > pageSize) {
      hasMore = true;
      docs.pop(); // Remove the extra item
    }

    for (const doc of docs) {
      lastVisible = doc;
      const data = doc.data();
      // Get the first message of each conversation
      const messagesRef = collection(db, `conversations/${doc.id}/messages`);
      const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'), limit(1));
      const messagesSnapshot = await getDocs(messagesQuery);
      let firstMessage = '';
      
      if (!messagesSnapshot.empty) {
        firstMessage = messagesSnapshot.docs[0].data().content;
      }

      conversations.push({
        id: doc.id,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        active: data.active,
        firstMessage
      });
    }

    return {
      conversations,
      hasMore,
      lastDoc: lastVisible
    };
  } catch (error) {
    console.error('Error getting all conversations:', error);
    return {
      conversations: [],
      hasMore: false
    };
  }
};
