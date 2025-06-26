import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Loader2, Send, Mic } from 'lucide-react';

interface PDFData {
  name: string;
  size: number;
  type: string;
  url?: string; // The backend doesn't explicitly return a direct URL for display, so this might need adjustment based on how you view PDFs.
  // summary and keyPoints are not directly returned by your /api/upload.
  // You'll need a separate mechanism or API call to generate these.
  summary: string; // Keep for now, but will be empty unless handled.
  keyPoints: string[]; // Keep for now, but will be empty unless handled.
  fileId: string; // Add fileId to uniquely identify the uploaded document from backend
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChat2Props {
  pdfData: PDFData;
}

interface MessageWithTimestamp extends Message {
  timestamp: Date;
}

const AIChat: React.FC<AIChat2Props> = ({ pdfData }) => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<MessageWithTimestamp[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: MessageWithTimestamp = {
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsProcessing(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: MessageWithTimestamp = {
        role: "assistant",
        content: `Based on the document &quot;${pdfData.name}&quot;, I can help you understand the key concepts. Your question about &quot;${inputValue}&quot; relates to the AI and machine learning topics covered in the document. Would you like me to elaborate on any specific aspect?`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsProcessing(false);
    }, 1500);
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
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const renderMessageContent = (message: MessageWithTimestamp) => {
    if (message.role === "user") {
      return (
        <p className="text-white whitespace-pre-wrap break-words">{message.content}</p>
      );
    }

    return (
      <div className="text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
        {message.content}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Messages Container */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="bg-gray-800/30 p-8 rounded-2xl shadow-lg max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center">
                    <MessageSquare className="text-white" size={24} />
                  </div>
                  <h2 className="text-2xl font-semibold mb-3 text-white">
                    Ready to Chat!
                  </h2>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    Ask me anything about your document &quot;{pdfData.name}&quot;. I&apos;m here to help you understand the content better.
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
                      className={`max-w-[75%] lg:max-w-[65%] p-4 rounded-2xl shadow-lg ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-br-md"
                          : "bg-gray-800/80 text-gray-100 rounded-bl-md border border-gray-700/50"
                      }`}
                    >
                      {renderMessageContent(message)}
                      <div className="mt-2 flex items-center justify-end">
                        <span
                          className={`text-xs ${
                            message.role === "user"
                              ? "text-blue-100/70"
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
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="max-w-[75%] lg:max-w-[65%] p-4 rounded-2xl rounded-bl-md shadow-lg bg-gray-800/80 border border-gray-700/50">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-400">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-gray-900 border-t border-gray-700/50 p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end bg-gray-800 rounded-2xl border border-gray-700/50 shadow-lg">
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
              placeholder="Ask about your document..."
              className="flex-1 bg-transparent text-white py-3 px-4 focus:outline-none resize-none overflow-y-auto min-h-[48px] max-h-[120px] placeholder-gray-400"
              rows={1}
              disabled={isProcessing}
            />

            <div className="flex items-center pr-2">
              {inputValue.trim() ? (
                <button
                  title="Send Message"
                  onClick={handleSubmit}
                  disabled={!inputValue.trim() || isProcessing || isListening}
                  className="p-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-full hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  type="button"
                >
                  {isProcessing && !isListening ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              ) : (
                <button
                  title="Use Microphone"
                  onClick={handleSpeechRecognition}
                  disabled={isProcessing || isListening}
                  className={`p-2.5 rounded-full transition-all duration-200 ${
                    isListening
                      ? "bg-red-600 text-white animate-pulse"
                      : "text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  type="button"
                >
                  <Mic size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;