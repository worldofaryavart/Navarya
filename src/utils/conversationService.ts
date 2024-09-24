import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    Timestamp,
  } from "firebase/firestore";
  import { db } from "./firebase";
  
  import { Conversation } from "../types/conversation";
  
  
  export async function storeConversation(conversation: Conversation) {
    try {
      const docRef = await addDoc(collection(db!, "conversations"), conversation);
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
  
  export async function updateConversation(conversation: Conversation) {
    try {
      const conversationRef = doc(db!, "conversations", conversation.id);
      const conversationData = { ...conversation };
      await updateDoc(conversationRef, conversationData);
      console.log("Document updated with ID: ", conversation.id);
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  }
  
  export async function getConversations(userId: string) {
      const q = query(collection(db!, "conversations"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const conversations: Conversation[] = [];
      querySnapshot.forEach((doc) => {
        conversations.push(doc.data() as Conversation);
      });
      return conversations;
    }
  