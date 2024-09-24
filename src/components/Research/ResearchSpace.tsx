import React, { useState, useRef, useEffect, useCallback } from "react";
import { FiSend, FiPlus, FiClock, FiUser, FiCopy, FiMenu, FiX, FiChevronLeft } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { FaUser, FaRobot } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import Sidebar from "@/components/Sidebar";
import Profile from "@/components/Profile";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';
import { v4 as uuid4 } from 'uuid';
import { storeConversation, updateConversation, getConversations } from "@/utils/conversationService"; // Import the functions
import { Conversation, Message } from "@/types/conversation"; // Import the interfaces

const auth = getAuth();

const ResearchSpace: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentView, setCurrentView] = useState<'chat' | 'profile' | 'about' | 'vision'>('chat');
  const [user, setUser] = useState(auth.currentUser);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadConversations(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadConversations = async (userId: string) => {
    const loadedConversations = await getConversations(userId);
    setConversations(loadedConversations);
    if (loadedConversations.length > 0) {
      setCurrentConversationId(loadedConversations[0].id);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const createNewConversation = useCallback(async () => {
    const newConversation: Conversation = {
      id: uuid4(),
      userId: user?.uid || '',
      title: `New Conversation ${conversations.length + 1}`,
      messages: [],
      createdAt: Date.now(),
    };
    setConversations(prev => [...prev, newConversation]);
    setCurrentConversationId(newConversation.id);
    await storeConversation(newConversation);
  }, [conversations.length, user?.uid]);

  useEffect(() => {
    if (conversations.length === 0) {
      createNewConversation();
    }
  }, [conversations, createNewConversation]);

  const switchConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  const getCurrentConversation = () => {
    return conversations.find(conv => conv.id === currentConversationId) || { id: '', userId: '', title: '', messages: [], createdAt: 0 };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const currentConversation = getCurrentConversation();
    const updatedMessages = [...currentConversation.messages, userMessage];

    setConversations(conversations.map(conv =>
      conv.id === currentConversation.id ? { ...conv, messages: updatedMessages } : conv
    ));
    setInput("");
    setIsLoading(true);

    try {
      console.log("Sending request to API...");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      console.log("API response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API response data:", data);

      if (!data.response) {
        throw new Error("No response content in API response");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        structuredContent: data.structuredContent,
        codeBlock: data.codeBlock,
      };

      const updatedConversation = {
        ...currentConversation,
        messages: [...updatedMessages, assistantMessage],
      };

      setConversations(conversations.map(conv =>
        conv.id === currentConversation.id ? updatedConversation : conv
      ));
      await updateConversation(updatedConversation);
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

  const suggestionPrompts = [
    "What is the capital of France?",
    "Explain quantum computing",
    "How to make a chocolate cake?",
    "Latest developments in AI",
  ];

  const copyToClipboard = (content: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        // alert("Copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  const renderMessageContent = (msg: Message) => {
    return (
      <ReactMarkdown
        components={{
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {msg.content}
      </ReactMarkdown>
    );
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        setCurrentView={setCurrentView}
        conversations={conversations}
        switchConversation={switchConversation}
        createNewConversation={createNewConversation}
        currentConversationId={currentConversationId}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-gray-800 shadow-lg p-4 flex justify-between items-center">
          {!isSidebarOpen && (
            <button
              className="text-2xl hover:text-blue-400 transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <FiMenu />
            </button>
          )}
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            {currentView === 'chat' ? 'AaryaI Research' : 'User Profile'}
          </h1>
          <div className="w-8"></div> {/* Placeholder for balance */}
        </header>

        <div className="flex-grow flex items-center justify-center">
          <h2 className="text-3xl font-bold">This ResearchSpace is experimental and a work in progress.</h2>
        </div>
      </div>
    </div>
  );
};

export default ResearchSpace;