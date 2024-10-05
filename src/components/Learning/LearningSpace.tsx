"use client";

import React, { useState, useRef, useEffect } from "react";
import { FiSend, FiPlus, FiMenu } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { FaRobot } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  type: "user" | "ai";
  content: string;
}

const LearningSpace: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    setIsLoading(true);

    try {
      // Save user message
      setMessages((prev) => [...prev, { type: "user", content: input }]);

      // Make API call
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.response) {
        throw new Error("No response content in API response");
      }

      // Save AI response
      setMessages((prev) => [...prev, { type: "ai", content: data.response }]);

      setInput("");
    } catch (error) {
      console.error("Error:", error);
      // Handle error (e.g., display error message to user)
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

  const renderMessageContent = (content: string) => {
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
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <div className="flex h-[calc(100vh-63px)] bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
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
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-[85%] sm:max-w-[70%] p-3 rounded-lg ${
                    msg.type === "user" ? "bg-blue-600" : "bg-gray-700"
                  } shadow-md`}
                >
                  {msg.type === "user" ? (
                    <Image
                      src={user?.photoURL || "/default-profile.png"}
                      alt="User"
                      width={24}
                      height={24}
                      className="rounded-full mt-1 hidden sm:block"
                    />
                  ) : (
                    <FaRobot className="mt-1 hidden sm:block" />
                  )}
                  <div className="prose prose-invert max-w-none text-sm sm:text-base">
                    {renderMessageContent(msg.content)}
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

export default LearningSpace;
