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
      return <p className="text-white">{message.content}</p>;
    }

    // Parse task list messages
    if (message.content.includes('Found') && (
      message.content.includes('tasks') || message.content.includes('reminders')
    )) {
      const [summary, ...items] = message.content.split('\n');
      return (
        <div className="space-y-3">
          <div className="flex items-center text-blue-400 mb-2">
            <List size={18} className="mr-2" />
            <span className="font-semibold">{summary}</span>
          </div>
          <div className="space-y-2">
            {items.map((item, i) => {
              if (!item.trim()) return null;
              const taskInfo = item.substring(2); // Remove "- " prefix
              const [title, ...details] = taskInfo.split(' - ');
              return (
                <div key={i} className="bg-gray-800/50 p-3 rounded-lg space-y-1">
                  <div className="font-medium text-white">{title}</div>
                  <div className="text-sm text-gray-400">
                    {details.map((detail, j) => (
                      <span key={j} className="inline-flex items-center">
                        {detail.includes('Status:') && (
                          <span className={`
                            inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-2
                            ${detail.includes('Completed') ? 'bg-green-900/50 text-green-400' : 
                              detail.includes('In Progress') ? 'bg-blue-900/50 text-blue-400' : 
                              'bg-yellow-900/50 text-yellow-400'}
                          `}>
                            {detail.split(': ')[1]}
                          </span>
                        )}
                        {detail.includes('Priority:') && (
                          <span className={`
                            inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-2
                            ${detail.includes('High') ? 'bg-red-900/50 text-red-400' : 
                              detail.includes('Medium') ? 'bg-orange-900/50 text-orange-400' : 
                              'bg-green-900/50 text-green-400'}
                          `}>
                            {detail.split(': ')[1]}
                          </span>
                        )}
                        {!detail.includes('Status:') && !detail.includes('Priority:') && (
                          <span className="text-gray-500 mr-2">{detail}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Batch operation results
    if (message.content.includes('Completed') && message.content.includes('operations:')) {
      const [summary, ...operations] = message.content.split('\n');
      return (
        <div className="space-y-3">
          <div className="flex items-center text-green-400 mb-2">
            <CheckCircle size={18} className="mr-2" />
            <span className="font-semibold">{summary}</span>
          </div>
          <div className="space-y-2">
            {operations.map((op, i) => {
              if (!op.trim()) return null;
              const isSuccess = op.startsWith('✓');
              return (
                <div key={i} className={`
                  flex items-center p-2 rounded-lg
                  ${isSuccess ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}
                `}>
                  <span className="mr-2">{isSuccess ? '✓' : '✗'}</span>
                  <span>{op.substring(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
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
                  <div className="bg-gray-800/50 p-3 rounded-lg">
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
              <div key={i} className="flex items-start bg-gray-800/50 p-3 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-purple-900/50 text-purple-400 flex items-center justify-center mr-2 mt-1">
                  {i + 1}
                </div>
                <div className="flex-1 text-gray-300">
                  {line.replace(/^\d+\.\s*/, '')}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Default message (conversation)
    return (
      <div className="text-gray-300 leading-relaxed">
        {message.content}
      </div>
    );
  };

  return (
    <div 
      className={`
        fixed right-0 top-0 h-screen w-[400px] bg-gray-900 shadow-xl 
        flex flex-col border-l border-gray-800 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/95 backdrop-blur-sm sticky top-0">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <h2 className="text-xl font-semibold text-white">AI Assistant</h2>
        </div>
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
            } animate-fadeIn`}
          >
            <div
              className={`
                max-w-[90%] p-3 rounded-lg
                ${message.role === 'user'
                  ? 'bg-purple-600 text-white ml-12'
                  : 'bg-gray-800/75 text-gray-200 mr-12'}
                shadow-lg backdrop-blur-sm
              `}
            >
              {renderMessageContent(message)}
              <div className="mt-2 flex items-center justify-end space-x-2">
                <span className="text-xs opacity-50">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
                {message.role === 'user' && (
                  <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                    <span className="text-[10px]">U</span>
                  </div>
                )}
                {message.role === 'ai' && (
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-[10px]">A</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/95 backdrop-blur-sm">
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (inputValue.trim() && !isProcessing) {
                  onSubmit();
                }
              }
            }}
            placeholder="Type your message..."
            className="w-full bg-gray-800/75 text-white rounded-lg p-3 pr-24 min-h-[50px] max-h-[150px] resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
            rows={1}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            <button
              onClick={onSpeechRecognition}
              disabled={isProcessing || isListening}
              className={`
                p-2 rounded-full transition-colors
                ${isListening ? 'bg-red-600 text-white' : 'hover:bg-gray-700 text-gray-400'}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <Mic size={20} />
            </button>
            <button
              onClick={onSubmit}
              disabled={!inputValue.trim() || isProcessing}
              className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatSidebar;
