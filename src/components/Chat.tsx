import React, { useState, useRef, useEffect } from "react";
import { FiSend, FiPlus, FiClock, FiUser, FiCopy, FiMenu, FiX, FiChevronLeft } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { FaUser, FaRobot } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Message {
  role: "user" | "assistant";
  content: string;
  structuredContent?: {
    mainPoints: string[];
    followUpQuestion?: string;
  };
  codeBlock?: string;
}

const Chat: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: isSidebarOpen ? "16rem" : "0rem" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed md:relative inset-y-0 left-0 bg-gray-800 overflow-hidden z-20 shadow-lg"
      >
        <div className="w-64 h-full p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              AaryaI
            </h2>
            <button
              className="text-2xl hover:text-blue-400 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <FiChevronLeft />
            </button>
          </div>
          <button 
            className="w-full mb-4 p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
          >
            <FiPlus className="mr-2" /> New Chat
          </button>
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">History</h3>
            {/* Add history items here */}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Profile</h3>
            {/* Add profile options here */}
          </div>
        </div>
      </motion.div>

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
            AaryaI Chat
          </h1>
          <div className="w-8"></div> {/* Placeholder for balance */}
        </header>
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((msg, index) => (
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
                    <FaUser className="mt-1 hidden sm:block" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <FaRobot className="mt-1 hidden sm:block" />
                      <button
                        onClick={() => copyToClipboard(msg.content)}
                        className="mt-2 text-xs text-gray-400 hover:text-white transition-colors"
                        title="Copy response"
                      >
                        <FiCopy />
                      </button>
                    </div>
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
          {messages.length === 0 && !input && (
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
      </div>
    </div>
  );
};

export default Chat;