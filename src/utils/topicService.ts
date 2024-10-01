import { db } from './firebase';
import { collection , addDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Conversation, Message, MessageType, SenderType } from '@/types/types';


async function createConversation(user: User, initialMessage: string): Promise<Conversation | null>{
    if (!db) throw new Error ('Firestore is not initialized');

    try {
        // Create a new conversation document 
        const conversationRef = await addDoc(collection(db, 'conversations'), {
            createdAt: serverTimestamp(),
            updateAt: serverTimestamp(),
            conversationHistory: [],
        });

        // Create the initial message 
        const messageRef = await addDoc(collection(db, 'messages'), {
            conversationId: conversationRef.id,
            messageType: MessageType.TEXT,
            content: initialMessage,
            sender: {
                type: SenderType.USER,
                id: user.uid,
                name: user.displayName || 'User',
            },
            timestamp: serverTimestamp(),
        });

        // Get the created message 
        const messageSnapshot = await getDoc(messageRef);
        const messageData = messageSnapshot.data() as Omit<Message, 'id'>;
        const message: Message = {
            ...messageData,
            id: messageRef.id,
            timestamp: messageData.timestamp || new Date(),
        }

        await updateDoc(conversationRef, {
            conversationHistory: [message.id],
            updateAt: serverTimestamp(),
        })

        // Get the created conversation 
        const conversationSnapshot = await getDoc(conversationRef);
        const conversationData = conversationSnapshot.data();

        if (!conversationData) {
            throw new Error('Failed to retrieve conversation data');
        }

        const conversation: Conversation = {
            id: conversationRef.id,
            conversationHistory: [message],
            createdAt: conversationData.createdAt?.toDate() || new Date(),
            updatedAt: conversationData.updatedAt?.toDate() || new Date(),
        };

        return conversation;
    } catch (error) {
        console.error("Error creating conversation:", error);
        throw error;
    }

    
}

export { createConversation };
