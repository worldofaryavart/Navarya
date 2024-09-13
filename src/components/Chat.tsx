"use client";

import React, { useState, useRef, useEffect } from "react";
import { FiSend, FiPlus, FiClock, FiUser } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { TypeAnimation } from 'react-type-animation';
import { FaUser, FaRobot } from 'react-icons/fa';

interface Message {
  role: "user" | "assistant";
  content: string;
  structuredContent?: {
    mainPoints: string[];
    followUpQuestion?: string;
  };
}

const Chat: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
      const assistantMessage = {
        role: "assistant" as const,
        content: data.response,
        structuredContent: data.structuredContent,
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
    "Latest developments in AI"
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="w-64 bg-gray-800 p-4">
        <button className="w-full mb-4 p-2 bg-gray-700 rounded-lg flex items-center justify-center">
          <FiPlus className="mr-2" /> New Chat
        </button>
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">History</h2>
          {/* Add history items here */}
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Profile</h2>
          {/* Add profile options here */}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <header className="bg-gray-800 shadow-sm p-4">
          <h1 className="text-2xl font-semibold">Aarya Chat</h1>
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
                  className={`flex items-start space-x-2 max-w-[70%] p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-blue-600"
                      : "bg-gray-700"
                  }`}
                >
                  {msg.role === "user" ? (
                    <FaUser className="mt-1" />
                  ) : (
                    <FaRobot className="mt-1" />
                  )}
                  <div>
                    {msg.role === "assistant" && msg.structuredContent ? (
                      <>
                        <ul className="list-disc list-inside">
                          {msg.structuredContent.mainPoints.map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                        {msg.structuredContent.followUpQuestion && (
                          <p className="mt-2 font-semibold">{msg.structuredContent.followUpQuestion}</p>
                        )}
                      </>
                    ) : (
                      <TypeAnimation
                        sequence={[msg.content]}
                        wrapper="div"
                        cursor={false}
                        speed={50}
                      />
                    )}
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
              <div className="flex items-center space-x-2 max-w-[70%] p-3 rounded-lg bg-gray-700">
                <FaRobot className="mt-1" />
                <div>Thinking...</div>
              </div>
            </motion.div>
          )}
          {messages.length === 0 && !input && (
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {suggestionPrompts.map((prompt, index) => (
                <button
                  key={index}
                  className="bg-gray-700 p-2 rounded-lg hover:bg-gray-600 transition-colors"
                  onClick={() => setInput(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center space-x-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-grow px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
