import React from 'react';
import { X, Send, Mic, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
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
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              <p>{message.content}</p>
              <span className="text-xs opacity-50 mt-1 block">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800">
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
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
