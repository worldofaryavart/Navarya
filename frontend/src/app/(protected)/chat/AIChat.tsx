"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Mic,
  Loader2,
  HelpCircle,
  List,
  CheckCircle,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AICommandHandler } from "@/services/ai_cmd_process/process_cmd";
import { auth } from "@/utils/config/firebase.config";
import FileModal from "./FileModal";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const AIChat: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsProcessing(true);
  };

  const handleSpeechRecognition = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    setIsListening(true);
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      setIsListening(false);
      // Optionally auto-submit: handleSubmit();
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const renderMessageContent = (message: Message) => {
    if (message.role === "user") {
      return (
        <p className="text-white whitespace-pre-wrap">{message.content}</p>
      );
    }

    if (
      message.content.includes("Found") &&
      (message.content.includes("tasks") ||
        message.content.includes("reminders"))
    ) {
      const lines = message.content
        .split("\n")
        .filter((line) => line.trim() !== "");
      const summary = lines[0];
      const items = lines.slice(1);

      return (
        <div className="space-y-3">
          <div className="flex items-center text-blue-400 mb-2">
            <List size={18} className="mr-2 flex-shrink-0" />
            <span className="font-semibold">{summary}</span>
          </div>
          <div className="space-y-2">
            {items.map((item, i) => {
              const taskInfo = item.startsWith("- ") ? item.substring(2) : item;
              const [title, ...detailsParts] = taskInfo.split(" - ");
              const details = detailsParts.join(" - ");
              return (
                <div
                  key={i}
                  className="bg-gray-800/50 p-3 rounded-lg space-y-1"
                >
                  <div className="font-medium text-white">{title}</div>
                  {details && (
                    <div className="text-sm text-gray-400">
                      {details.split(",").map((detailPart, j) => {
                        const trimmedDetail = detailPart.trim();
                        let badge = null;
                        if (trimmedDetail.includes("Status:")) {
                          const status = trimmedDetail.split(": ")[1];
                          badge = (
                            <span
                              key={j}
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${
                                status === "Completed"
                                  ? "bg-green-900/50 text-green-400"
                                  : status === "In Progress"
                                  ? "bg-blue-900/50 text-blue-400"
                                  : "bg-yellow-900/50 text-yellow-400"
                              }`}
                            >
                              {status}
                            </span>
                          );
                        } else if (trimmedDetail.includes("Priority:")) {
                          const priority = trimmedDetail.split(": ")[1];
                          badge = (
                            <span
                              key={j}
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${
                                priority === "High"
                                  ? "bg-red-900/50 text-red-400"
                                  : priority === "Medium"
                                  ? "bg-orange-900/50 text-orange-400"
                                  : "bg-green-900/50 text-green-400"
                              }`}
                            >
                              {priority}
                            </span>
                          );
                        }
                        return badge ? (
                          badge
                        ) : (
                          <span key={j} className="text-gray-500 mr-2">
                            {trimmedDetail}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (
      message.content.includes("Completed") &&
      message.content.includes("operations:")
    ) {
      const [summary, ...operations] = message.content
        .split("\n")
        .filter((line) => line.trim() !== "");
      return (
        <div className="space-y-3">
          <div className="flex items-center text-green-400 mb-2">
            <CheckCircle size={18} className="mr-2 flex-shrink-0" />
            <span className="font-semibold">{summary}</span>
          </div>
          <div className="space-y-2">
            {operations.map((op, i) => {
              if (!op.trim()) return null;
              const isSuccess = op.startsWith("✓");
              return (
                <div
                  key={i}
                  className={`flex items-center p-2 rounded-lg ${
                    isSuccess
                      ? "bg-green-900/30 text-green-400"
                      : "bg-red-900/30 text-red-400"
                  }`}
                >
                  <span className="mr-2">{isSuccess ? "✓" : "✗"}</span>
                  <span>
                    {op.substring(
                      op.startsWith("✓ ") || op.startsWith("✗ ") ? 2 : 1
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (message.content.includes("Available commands:")) {
      const lines = message.content.split("\n");
      const commandLines: string[] = [];
      const exampleLines: string[] = [];
      let isExampleSection = false;

      for (const line of lines) {
        if (line.toLowerCase().startsWith("example:")) {
          isExampleSection = true;
          if (line.substring(8).trim())
            exampleLines.push(line.substring(8).trim());
          continue;
        }
        if (isExampleSection) {
          if (line.trim()) exampleLines.push(line.trim());
        } else {
          if (
            line.trim() &&
            !line.toLowerCase().startsWith("available commands:")
          )
            commandLines.push(line);
        }
      }

      return (
        <div className="space-y-3">
          <div className="flex items-center text-purple-400 mb-2">
            <HelpCircle size={18} className="mr-2 flex-shrink-0" />
            <span className="font-semibold">Available Commands</span>
          </div>
          {commandLines.map((line, i) => {
            if (line.trim().startsWith("-")) return null;
            if (!line.trim()) return null;
            return (
              <div
                key={`cmd-${i}`}
                className="flex items-start bg-gray-800/50 p-3 rounded-lg"
              >
                <div className="w-5 h-5 text-xs rounded-full bg-purple-900/50 text-purple-400 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 text-gray-300">
                  {line.replace(/^\d+\.\s*/, "")}
                </div>
              </div>
            );
          })}
          {exampleLines.length > 0 && (
            <div className="mt-4">
              <div className="text-purple-400 font-semibold mb-2">
                Examples:
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <code className="text-sm">
                  {exampleLines.map((ex, j) => (
                    <div key={`ex-${j}`} className="text-gray-300">
                      {ex}
                    </div>
                  ))}
                </code>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (
      message.content.includes("Task ") &&
      (message.content.includes("created") ||
        message.content.includes("updated") ||
        message.content.includes("deleted"))
    ) {
      return (
        <div className="space-y-2">
          <div className="flex items-center text-green-400">
            <CheckCircle size={18} className="mr-2 flex-shrink-0" />
            <span className="font-medium">{message.content}</span>
          </div>
        </div>
      );
    }

    if (
      message.content.toLowerCase().includes("failed") ||
      message.content.toLowerCase().includes("error") ||
      message.content.startsWith("Sorry,")
    ) {
      return (
        <div className="space-y-2">
          <div className="flex items-center text-red-400">
            <X size={18} className="mr-2 flex-shrink-0" />
            <span className="font-medium">{message.content}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
        {message.content}
      </div>
    );
  };

  const handleFileModalOpen = () => {
    console.log("file modal is clicked");
    setIsFileModalOpen(true);
  };

  // Get current user from Firebase auth
  const user = auth.currentUser;
  if (!user) {
    router.push("/login");
    return null;
  }

  // Get the user's display name or email
  const userName = user.displayName || user.email?.split("@")[0] || "User";

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white w-full">
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {isLoadingConversation ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center space-y-3">
              <Loader2 size={32} className="animate-spin text-purple-500" />
              <p className="text-gray-400">Loading conversation...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-gray-800/30 p-6 rounded-xl shadow-lg max-w-md mx-auto">
              <h2 className="text-2xl font-semibold mb-2 text-white">
                Hello, {userName}!
              </h2>
              <p className="text-gray-300 mb-4">
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-500">
                  Navarya
                </span>{" "}
                welcomes you! How can I assist you today?
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex message-item ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[75%] p-3 rounded-xl shadow-md ${
                    message.role === "user"
                      ? "bg-purple-600 text-white ml-auto"
                      : "bg-gray-700/80 text-gray-200 mr-auto"
                  }`}
                >
                  {renderMessageContent(message)}
                  <div className="mt-1.5 flex items-center justify-end space-x-2">
                    <span
                      className={`text-xs ${
                        message.role === "user"
                          ? "text-purple-200/70"
                          : "text-gray-400/70"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
            {isProcessing && messages.length > 0 && (
              <div className="flex justify-start">
                <div className="max-w-[85%] md:max-w-[75%] p-3 rounded-xl shadow-md bg-gray-700/80 text-gray-200 mr-auto">
                  <div className="flex items-center space-x-1.5">
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse delay-75"></span>
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse delay-300"></span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Area - Gemini Style */}
      <div className="p-3 md:p-4 bg-gray-900 sticky bottom-0 flex justify-center">
        <div className="relative flex items-center w-full max-w-4xl">
          <div className="flex items-center w-full bg-gray-800 rounded-full border border-gray-700 pr-3">
            <button
              className="flex-shrink-0 p-3 text-gray-400 hover:text-gray-300 transition-colors ml-1"
              disabled={isProcessing || isLoadingConversation}
              onClick={handleFileModalOpen}
              type="button"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4V20M4 12H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <textarea
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                e.target.style.height = "inherit";
                e.target.style.height = `${Math.min(
                  e.target.scrollHeight,
                  120
                )}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                  e.currentTarget.style.height = "inherit";
                }
              }}
              placeholder="Ask Navarya"
              className="flex-1 bg-transparent text-white p-3 focus:outline-none resize-none overflow-y-auto min-h-[48px] placeholder-gray-500"
              rows={1}
              style={{ maxHeight: "120px" }}
              disabled={isProcessing || isLoadingConversation}
            />
            <div className="flex items-center space-x-1 ml-1">
              {inputValue.trim() && (
                <button
                  title="Send Message"
                  onClick={handleSubmit}
                  disabled={!inputValue.trim() || isProcessing || isListening || isLoadingConversation}
                  className="p-2 text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  {isProcessing && !isListening ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              )}
              {!inputValue.trim() && (
                <button
                  title="Use Microphone"
                  onClick={handleSpeechRecognition}
                  disabled={isProcessing || isListening || isLoadingConversation}
                  className={`p-2 transition-colors ${
                    isListening
                      ? "text-red-400 animate-pulse"
                      : "text-gray-400 hover:text-gray-300"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  type="button"
                >
                  <Mic size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .message-item {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        textarea {
          scrollbar-width: none; /* For Firefox */
        }
        textarea::-webkit-scrollbar {
          display: none;
        }
        .gemini-disclaimer {
          font-size: 12px;
          color: #888;
          text-align: center;
          padding: 10px 0;
        }
      `}</style>
      <div className="gemini-disclaimer">
        AI Assistant can make mistakes, so double-check it
      </div>

      {/* File Modal */}
      {isFileModalOpen && 
      <FileModal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
      />}
    </div>
  );
};

export default AIChat;