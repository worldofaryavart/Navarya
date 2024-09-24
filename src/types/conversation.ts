import { Timestamp } from "firebase/firestore";

export interface Message {
  role: "user" | "assistant";
  content: string;
  structuredContent?: {
    mainPoints: string[];
    followUpQuestion?: string;
  };
  codeBlock?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: number;
}