import React, { useEffect, useRef } from 'react';
import { X, Send, Mic, Loader2, HelpCircle, List, CheckCircle, Clock, Activity } from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  type?: 'help' | 'list' | 'success' | 'error';
}

interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  inputValue: string;
  setInputValue: (value: string) => void;
  isProcessing: boolean;
  isListening: boolean;
  onSubmit: () => void;
  onSpeechRecognition: () => void;
}

const AIChatSidebar: React.FC<AIChatSidebarProps> = ({
  isOpen,
  onClose,
  messages,
  inputValue,
  setInputValue,
  isProcessing,
  isListening,
  onSubmit,
  onSpeechRecognition,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Scroll when messages change

  const renderMessageContent = (message: Message) => {
    if (message.role === 'user') {
      return <p>{message.content}</p>;
    }

    // Help message
    if (message.content.includes('Available commands:')) {
      return (
        <div className="space-y-3">
          <div className="flex items-center text-purple-400 mb-2">
            <HelpCircle size={18} className="mr-2" />
            <span className="font-semibold">Available Commands</span>
          </div>
          {message.content.split('\n').map((line, i) => {
            if (line.startsWith('Available commands:')) return null;
            if (line.startsWith('Example:')) {
              return (
                <div key={i} className="mt-4">
                  <div className="text-purple-400 font-semibold mb-2">Examples:</div>
                  <div className="bg-gray-700 p-2 rounded">
                    <code className="text-sm">
                      {message.content
                        .split('Example:')[1]
                        .trim()
                        .split('\n')
                        .map((ex, j) => (
                          <div key={j} className="text-gray-300">{ex.trim()}</div>
                        ))}
                    </code>
                  </div>
                </div>
              );
            }
            if (line.trim().startsWith('-')) return null;
            if (!line.trim()) return null;
            return (
              <div key={i} className="flex items-start">
                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mr-2 mt-1">
                  {i + 1}
                </div>
                <div className="flex-1">
                  {line.replace(/^\d+\.\s*/, '')}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Task list
    if (message.content.includes('Current tasks:')) {
      return (
        <div className="space-y-3">
          <div className="flex items-center text-blue-400 mb-2">
            <List size={18} className="mr-2" />
            <span className="font-semibold">Task List</span>
          </div>
          <div className="space-y-2">
            {message.content
              .split('\n')
              .slice(1) // Skip the "Current tasks:" line
              .map((task, i) => {
                const match = task.match(/^• (.*?) \((.*?)\) \[ID: (.*?)\]$/);
                if (!match) return null;
                const [_, title, status, id] = match;
                return (
                  <div key={i} className="bg-gray-800 p-2 rounded flex items-center">
                    {status === 'Completed' && <CheckCircle size={16} className="text-green-500 mr-2" />}
                    {status === 'Pending' && <Clock size={16} className="text-yellow-500 mr-2" />}
                    {status === 'In Progress' && <Activity size={16} className="text-blue-500 mr-2" />}
                    <div className="flex-1">
                      <div className="text-sm">{title}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Status: {status} • ID: {id}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      );
    }

    // Default message
    return <p>{message.content}</p>;
  };

  return (
    <div 
      className={`
        fixed right-0 top-0 h-screen w-96 bg-gray-900 shadow-xl 
        flex flex-col border-l border-gray-800 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">AI Assistant</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <X size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[90%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              {renderMessageContent(message)}
              <span className="text-xs opacity-50 mt-2 block">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} /> {/* Anchor element for scrolling */}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800">
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (e.shiftKey) {
                  // Allow new line with Shift+Enter
                  return;
                }
                // Prevent default to avoid new line
                e.preventDefault();
                // Only submit if there's input and not processing
                if (inputValue.trim() && !isProcessing) {
                  onSubmit();
                }
              }
            }}
            placeholder="Type your message..."
            className="w-full bg-gray-800 text-white rounded-lg p-3 pr-24 min-h-[50px] max-h-[150px] resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={1}
          />
          <div className="absolute right-2 bottom-2 flex space-x-2">
            <button
              onClick={onSpeechRecognition}
              disabled={isListening}
              className={`p-2 rounded-full ${
                isListening ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Mic size={16} className="text-white" />
            </button>
            <button
              onClick={onSubmit}
              disabled={!inputValue.trim() || isProcessing}
              className={`p-2 rounded-full ${
                inputValue.trim() && !isProcessing
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-gray-700'
              }`}
            >
              {isProcessing ? (
                <Loader2 size={16} className="animate-spin text-white" />
              ) : (
                <Send size={16} className="text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatSidebar;
