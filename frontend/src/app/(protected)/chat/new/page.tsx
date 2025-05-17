"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { startNewConversation } from "@/services/conversation_service/conversation";

export default function NewChatPage() {
  const router = useRouter();

  useEffect(() => {
    const createNewChat = async () => {
      try {
        // If your startNewConversation returns a new ID, use it
        const result = await startNewConversation();
        console.log("New conversation created:", result);
        if (result.status === "success" && result.id) {
          router.push(`/chat/${result.id}`);
        } else {
          // Otherwise, just redirect to a generic chat page that will create a new conversation
          router.push('/chat/new');
        }
      } catch (error) {
        console.error("Error creating new conversation:", error);
        // Fallback to a generic chat page
        router.push('/chat/new');
      }
    };

    createNewChat();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-gray-400">Creating new conversation...</p>
      </div>
    </div>
  );
}