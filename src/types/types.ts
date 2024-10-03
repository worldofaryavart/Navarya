interface Conversation {
    id:string;
    userId: string;
    conversationTitle: string;
    conversationHistory: Message[];
    createdAt: Date;
    updatedAt: Date;
}

interface Message {
    id: string;
    conversationId: string;
    messageType: MessageType;
    content: string;
    sender: Sender;
    timestamp: Date;
}

export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    VIDEO = 'video',
}

interface Sender {
    type: SenderType;
    id: string;
    name: string;
}

export enum SenderType {
    USER = 'user',
    AI = 'ai',
}

interface ConversationState {
    currentConversation : Conversation | null;
    conversations: Conversation[];
    loading: boolean;
    error: string | null;
}

enum ConversationActionTypes {
    FETCH_CONVERSATIONS = 'FETCH_CONVERSATIONS',
    CREATE_CONVERSATION = 'CREATE_CONVERSATION',
    ADD_MESSAGE = 'ADD_MESSAGE',
    UPDATE_CONVERSATION = 'UPDATE_CONVERSATION',
    DELETE_CONVERSATION = 'DELETE_CONVERSATION',
}

interface ConversationAction {
    type: ConversationActionTypes;
    payload: any;
}

export type { Conversation, Message, Sender, ConversationActionTypes}