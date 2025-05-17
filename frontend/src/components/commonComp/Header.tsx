"use client";

import React, { useState } from "react";
import { FiMenu } from "react-icons/fi";
import { useSidebar } from "@/context/SidebarContext";
import Link from "next/link";
import {
  getAllConversations,
  getConversationHistory,
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
  const { toggleSidebar } = useSidebar();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [lastLoadedDoc, setLastLoadedDoc] = useState<ConversationInfo | null>(
    null
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleStartNewConversation = async () => {
    setIsProcessing(true);
    try {
      const success = await startNewConversation();
      if (success) {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error starting new conversation:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleHistoryView = () => {
    const newShowHistoryState = !showHistory;
    setShowHistory(newShowHistoryState);
    if (newShowHistoryState) {
      fetchConversations();
    }
  };

  const fetchConversations = async (loadMore = false) => {
    if (!loadMore) {
      setIsLoadingHistory(true);
      setConversations([]);
      setLastLoadedDoc(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await getAllConversations(
        6,
        loadMore ? lastLoadedDoc?.id : null
      );
      if (loadMore) {
        setConversations((prev) => [...prev, ...response.conversations]);
      } else {
        setConversations(response.conversations);
      }
      setHasMoreConversations(response.hasMore);
      setLastLoadedDoc(response.lastDoc);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoadingHistory(false);
      setIsLoadingMore(false);
    }
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
        <Link href={"/dashboard"}>
          <h1 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            NavArya
          </h1>
        </Link>
        
        <div className="ml-4 flex items-center">
          <div
            className={`w-2 h-2 rounded-full ${
              isProcessing ? "bg-yellow-500 animate-pulse" : "bg-green-500"
            }`}
          ></div>
          {showHistory && (
            <h2 className="ml-2 text-white">Conversation History</h2>
          )}
        </div>
      </div>

      <div className="flex space-x-2">
        {!showHistory && (
          <button
            title="New Conversation"
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            onClick={handleStartNewConversation}
            disabled={isProcessing}
          >
            <PlusIcon size={20} className="text-gray-400" />
          </button>
        )}
        <button
          title={showHistory ? "Back to Chat" : "View History"}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          onClick={handleToggleHistoryView}
          disabled={isProcessing && !showHistory}
        >
          {showHistory ? (
            <X size={20} className="text-gray-400" />
          ) : (
            <HistoryIcon size={20} className="text-gray-400" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;