import { db,auth } from '../config/firebase.config';

import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, DocumentData, updateDoc, doc } from 'firebase/firestore';

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

export const getConversationHistory = async (limit: number = 50): Promise<Message[]> => {
  try {
    const user = auth?.currentUser;
    if (!user || !db) {
      throw new Error('User not authenticated or database not initialized');
    }

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

    const conversationId = querySnapshot.docs[0].id;
    const messagesRef = collection(db, `conversations/${conversationId}/messages`);
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
