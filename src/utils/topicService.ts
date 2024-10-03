import { db } from './firebase';
import { collection , addDoc, updateDoc, serverTimestamp, getDoc, orderBy, query, where, limit, getDocs, doc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Conversation, Message, MessageType, SenderType } from '@/types/types';


async function createConversation(user: User, initialMessage: string, convTitle: string): Promise<Conversation | null>{
    if (!db) throw new Error ('Firestore is not initialized');

    try {
        // Create a new conversation document 
        const conversationRef = await addDoc(collection(db, 'conversations'), {
            userId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            conversationTitle: convTitle,
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
            updatedAt: serverTimestamp(),
        })

        // Get the created conversation 
        const conversationSnapshot = await getDoc(conversationRef);
        const conversationData = conversationSnapshot.data();

        if (!conversationData) {
            throw new Error('Failed to retrieve conversation data');
        }

        const conversation: Conversation = {
            id: conversationRef.id,
            userId: conversationData.userId,
            conversationTitle:conversationData.conversationTitle,
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

async function fetchConversations(user: User, limitCount: number = 10): Promise<Conversation[]> {
    if (!db) throw Error('Firestore is not initialied');
    if (!user.uid) throw new Error('User is not fully authenticated');

    console.log(`Fetching conversations for user: ${user.uid}`);
    
    try {
        const conversationsRef = collection(db, 'conversations');
        const q = query(
            conversationsRef, 
            where('userId', '==', user.uid),
            orderBy('updatedAt', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        console.log(`Found ${querySnapshot.size} conversations`);

        const conversations: Conversation[] = [];

        for (const docSnapshot of querySnapshot.docs) {
            const conversationData = docSnapshot.data();
            console.log(`Processing conversation: ${docSnapshot.id}`, conversationData);

            if (!conversationData.conversationHistory){
                console.warn(`Conversation ${docSnapshot.id} has no conversationHistory`);
                continue;
            }
            
            const messagePromises = conversationData.conversationHistory.map(async (messageId: string) => {
              const messageDoc = doc(db!, 'messages', messageId);
              const messageSnapshot = await getDoc(messageDoc);
              if (!messageSnapshot.exists()) {
                console.warn(`Message ${messageId} not found`);
                return null;
              }

              const messageData = messageSnapshot.data() as Message;
              return { ...messageData, id: messageSnapshot.id};
            });

            const messages = (await Promise.all(messagePromises)).filter(message => message !== null);

            conversations.push({
                id: docSnapshot.id,
                userId: conversationData.userId,
                conversationTitle: conversationData.conversationTitle,
                conversationHistory: messages, 
                createdAt: conversationData.createdAt.toDate(), 
                updatedAt: conversationData.updatedAt.toDate(),
            });
        }

        console.log(`Returning ${conversations.length } conversations`)
        return conversations;

    } catch (error) {
        console.error("Error fetching conversations:", error);
        throw error;
    }
}

export { createConversation, fetchConversations };