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

const auth = getAuth();

interface Message {
  role: "user" | "assistant";
  content: string;
  structuredContent?: {
    mainPoints: string[];
    followUpQuestion?: string;
  };
  codeBlock?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[]; // Change this line
  createdAt: number;
}

const LearningSpace: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentView, setCurrentView] = useState<'chat' | 'profile' | 'about' | 'vision'>('chat');
  const [user, setUser] = useState(auth.currentUser);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [ currentConversationId, setCurrentConversationId] = useState<string | null>(null);

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

  const createNewConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: uuid4(), 
      title:`New Conversation ${conversations.length + 1}`, 
      messages: [],
      createdAt: Date.now(), // Add this line
    };
    setConversations(prev => [...prev, newConversation]);
    setCurrentConversationId(newConversation.id);
  }, [conversations.length]);

  useEffect(() => {
    if (conversations.length === 0) {
      createNewConversation();
    }
  }, [conversations, createNewConversation]);

  const switchConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  const getCurrentConversation = () => {
    return conversations.find(conv => conv.id === currentConversationId) || { id: '', title: '', messages: [] as Message[] };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const currentConversation = getCurrentConversation();
    const updatedMessages = [...currentConversation.messages, userMessage];
    
    setConversations(conversations.map(conv => 
      conv.id === currentConversation.id ? {...conv, messages: updatedMessages} : conv
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
      
      setConversations(conversations.map(conv => 
        conv.id === currentConversation.id ? {...conv, messages: [...updatedMessages, assistantMessage]} : conv
      ));
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
            {currentView === 'chat' ? 'AaryaI Learning' : 'User Profile'}
          </h1>
          <div className="w-8"></div> {/* Placeholder for balance */}
        </header>
        
        {currentView === 'chat' ? (
          <>
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {getCurrentConversation().messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex items-start space-x-2 max-w-[85%] sm:max-w-[70%] p-3 rounded-lg ${
                        msg.role === "user" ? "bg-blue-600" : "bg-gray-700"
                      } shadow-md`}
                    >
                      {msg.role === "user" ? (
                        <Image 
                          src={user?.photoURL || '/default-profile.png'} 
                          alt="User" 
                          width={24}
                          height={24}
                          className="rounded-full mt-1 hidden sm:block" 
                        />
                      ) : (
                        <FaRobot className="mt-1 hidden sm:block" />
                      )}
                      <div className="prose prose-invert max-w-none text-sm sm:text-base">
                        {renderMessageContent(msg)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-center space-x-2 max-w-[85%] sm:max-w-[70%] p-3 rounded-lg bg-gray-700 shadow-md">
                    <FaRobot className="mt-1 hidden sm:block" />
                    <div className="animate-pulse">Thinking...</div>
                  </div>
                </motion.div>
              )}
              {getCurrentConversation().messages.length === 0 && !input && (
                <div className="flex flex-wrap justify-center gap-4 mt-8">
                  {suggestionPrompts.map((prompt, index) => (
                    <motion.button
                      key={index}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-sm shadow-md"
                      onClick={() => setInput(prompt)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {prompt}
                    </motion.button>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-4 bg-gray-800 border-t border-gray-700 shadow-lg"
            >
              <div className="flex items-center space-x-2 max-w-4xl mx-auto">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-grow px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base shadow-inner"
                  placeholder="Type your message..."
                  disabled={isLoading}
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300 shadow-md"
                  disabled={isLoading || !input.trim()}
                >
                  <FiSend />
                </motion.button>
              </div>
            </form>
          </>
        ) : (
          <Profile />
        )}
      </div>
    </div>
  );
};

export default LearningSpace;