import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import Sidebar from "@/components/Sidebar";
import Profile from "@/components/Profile";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import ChatInput from "./ChatInput";
import MessageList from "./MessageList";

const auth = getAuth();

interface Message {
  role: "user" | "assistant";
  content: string;
  structuredContent?: {
    mainPoints: string[];
    followUpQuestion?: string;
  };
  codeBlock?: string;
  imageUrl?: string;
  audioUrl?: string;
}

const LearningSpace: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentView, setCurrentView] = useState<'chat' | 'profile' | 'about' | 'vision'>('chat');
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        structuredContent: data.structuredContent,
        codeBlock: data.codeBlock,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        // Optionally, you can add a notification here
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        setCurrentView={setCurrentView}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {currentView === 'chat' && (
            <MessageList messages={messages} copyToClipboard={copyToClipboard} />
          )}
          {currentView === 'profile' && <Profile />}
          {/* Add other views here */}
        </div>
        <div className="p-4 border-t">
          <ChatInput
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  );
};

export default LearningSpace;