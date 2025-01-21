import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useLayout } from '@/context/LayoutContext';
import AIChatSidebar from './AIChatSidebar';
import { AICommandHandler } from "@/services/ai_cmd_process/process_cmd";
import {  getConversationHistory, startNewConversation } from "@/services/conversation_service/conversation";
import { useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIControlButton: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { isAISidebarOpen, setIsAISidebarOpen } = useLayout();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      try {
        // Load conversation history only if none exists
        if (messages.length === 0) {
          const history = await getConversationHistory();
          if (mounted && history.length > 0) {
            setMessages(history.map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.content,
              timestamp: msg.timestamp
            })));
          } else if (mounted) {
            console.log("mounted")
            // await startNewConversation();
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadHistory();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      setIsProcessing(true);

      const result = await AICommandHandler.processCommand(userMessage, router);

      if (result.success) {
        const aiMessage: Message = {
          role: 'assistant',
          content: result.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      }

      setInputValue("");
    } catch (error) {
      console.error('Error processing command:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSpeechRecognition = () => {
    if ("webkitSpeechRecognition" in window) {
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

      recognition.start();
    } else {
      alert("Speech recognition not supported in this browser");
    }
  };

  const handleAddClick = async () => {
    try {
      const success = await startNewConversation();
      if (success) {
        setMessages([]);
        
      }
    } catch (error) {
      console.error('Error starting new conversation:', error);
    }
  };

  const handleHistoryClick = async () => {
    console.log("Opening conversation history");
  };

  const handleConversationSelect = async (conversationId: string) => {
    try {
      // Get messages for the selected conversation
      const history = await getConversationHistory(conversationId);
      if (history.length > 0) {
        setMessages(history.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: msg.timestamp
        })));
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  return (
    <>
      {/* Floating AI Control Button */}
      <button
        onClick={() => setIsAISidebarOpen(!isAISidebarOpen)}
        className={`
          fixed bottom-6 right-6 z-50
          w-16 h-16 rounded-full shadow-2xl 
          ${isAISidebarOpen ? "bg-purple-600" : "bg-purple-500 hover:bg-purple-600"}
          text-white flex items-center justify-center
          transition-all duration-300
        `}
      >
        <Sparkles size={24} />
      </button>

      {/* AI Chat Sidebar */}
      <AIChatSidebar
        isOpen={isAISidebarOpen}
        onClose={() => setIsAISidebarOpen(false)}
        messages={messages}
        inputValue={inputValue}
        setInputValue={setInputValue}
        isProcessing={isProcessing}
        isListening={isListening}
        onSubmit={handleSubmit}
        onSpeechRecognition={handleSpeechRecognition}
        onAddClick={handleAddClick}
        onHistoryClick={handleHistoryClick}
        onConversationSelect={handleConversationSelect}
      />
    </>
  );
};

export default AIControlButton;
