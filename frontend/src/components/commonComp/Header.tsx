"use client";

import React, { useState } from "react";
import { FiMenu } from "react-icons/fi";
import { useSidebar } from "@/context/SidebarContext";
import { useRouter } from "next/navigation";
import {
  startNewConversation,
} from "@/services/conversation_service/conversation";
import { HistoryIcon, PlusIcon, X } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ConversationInfo {
  id: string;
  createdAt: string | Date;
  firstMessage?: string;
  active?: boolean;
  messageCount?: number;
}

const Header = () => {
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartNewConversation = async () => {
    router.push("/chat/new");
  };

  const navigateToHistory = () => {
    router.push("/history");
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-50">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors mr-4"
        >
          <FiMenu size={24} className="text-gray-400" />
        </button>
        <h1 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          NavArya
        </h1>

        <div className="ml-4 flex items-center">
          <div
            className={`w-2 h-2 rounded-full ${
              isProcessing ? "bg-yellow-500 animate-pulse" : "bg-green-500"
            }`}
          ></div>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          title="New Conversation"
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          onClick={handleStartNewConversation}
          disabled={isProcessing}
        >
          <PlusIcon size={20} className="text-gray-400" />
        </button>
        <button
          title="View History"
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          onClick={navigateToHistory}
          disabled={isProcessing}
        >
          <HistoryIcon size={20} className="text-gray-400" />
        </button>
      </div>
    </header>
  );
};

export default Header;
