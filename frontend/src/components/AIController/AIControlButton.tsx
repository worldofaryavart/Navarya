import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useTaskContext } from '@/context/TaskContext';
import { useLayout } from '@/context/LayoutContext';
import AIChatSidebar from './AIChatSidebar';
import { AICommandHandler } from "@/utils/ai/aiCommandHandler";
import { getTasks } from "@/utils/tasks/tasks";
import { saveMessage, getConversationHistory, startNewConversation, getAllConversations } from "@/utils/aicontext/conversationService";
import { auth } from '@/utils/config/firebase.config';
import { getApiUrl } from "@/utils/config/api.config";
import UICommandHandler from '@/utils/ai/uiCommandHandler';
import { useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ContextData {
  session?: any;
  persistent?: any;
  local?: any;
}

const AIControlButton: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contextData, setContextData] = useState<ContextData>({});
  const { tasks, setTasks } = useTaskContext();
  const { isSidebarOpen, setIsSidebarOpen } = useLayout();
  const router = useRouter();
  const uiCommandHandler = new UICommandHandler(router);
  const aiCommandHandler = new AICommandHandler(router);

  console.log("contextData is : ", contextData);

  // Function to fetch context from backend
  const fetchContext = async (contextType: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/context/${contextType}`), {
        headers: {
          'user-id': auth?.currentUser?.uid || 'anonymous'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setContextData(prev => ({ ...prev, [contextType]: data }));
        return data;
      }
    } catch (error) {
      console.error(`Error fetching ${contextType} context:`, error);
    }
    return null;
  };

  // Function to update context in backend
  const updateContext = async (contextType: string, data: any) => {
    try {
      await fetch(getApiUrl(`/api/context/${contextType}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': auth?.currentUser?.uid || 'anonymous'
        },
        body: JSON.stringify(data)
      });
      setContextData(prev => ({ ...prev, [contextType]: data }));
    } catch (error) {
      console.error(`Error updating ${contextType} context:`, error);
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      // Load conversation history
      const history = await getConversationHistory();
      if (history.length > 0) {
        setMessages(history.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'ai',
          content: msg.content,
          timestamp: msg.timestamp
        })));
      } else {
        await startNewConversation();
      }

      // Load context data
      await Promise.all([
        fetchContext('session'),
        fetchContext('persistent')
      ]);
    };
    loadHistory();
  }, []);

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Store user message
      await saveMessage(inputValue, 'user');

      setIsProcessing(true);
      try {
        // Update session context with current conversation
        const sessionContext = {
          ...contextData.session,
          currentTopic: inputValue,
          recentMessages: messages.slice(-5)
        };
        await updateContext('session', sessionContext);

        // Process command with context
        const result = await AICommandHandler.processCommand(inputValue, router, {
          sessionContext: contextData.session,
          persistentContext: contextData.persistent
        });

        console.log("result is : ", result);

        // Execute UI commands based on AI response
        if (result.success) {
          // Add AI response
          const aiMessage: Message = {
            role: 'ai',
            content: result.message,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);

          // Save AI response
          await saveMessage(result.message, 'assistant');

          // Update context based on the response
          const updatedSessionContext = {
            ...sessionContext,
            lastSuccessfulCommand: {
              command: inputValue,
              result: result.message,
              timestamp: new Date()
            }
          };
          await updateContext('session', updatedSessionContext);

          // If command was successful, refresh tasks
          await refreshTasks();
        }

        setInputValue("");
      } catch (error) {
        console.error("Processing error", error);
        const errorMessage: Message = {
          role: 'ai',
          content: 'Sorry, I encountered an error processing your request.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        await saveMessage('Sorry, I encountered an error processing your request.', 'assistant');
      } finally {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error processing command:', error);
    }
  };

  const refreshTasks = async () => {
    try {
      const updatedTasks = await getTasks();
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error refreshing tasks:', error);
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
        // You might want to add a notification here
      }
    } catch (error) {
      console.error('Error starting new conversation:', error);
    }
  };

  const handleHistoryClick = async () => {
    // This is now handled in the AIChatSidebar component
    console.log("Opening conversation history");
  };

  const handleConversationSelect = async (conversationId: string) => {
    try {
      // Get messages for the selected conversation
      const messages = await getConversationHistory(); // You might want to add a parameter for conversationId
      setMessages(messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'ai',
        content: msg.content,
        timestamp: msg.timestamp
      })));
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  return (
    <>
      {/* Floating AI Control Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`
          fixed bottom-6 right-6 z-50
          w-16 h-16 rounded-full shadow-2xl 
          ${isSidebarOpen ? "bg-purple-600" : "bg-purple-500 hover:bg-purple-600"}
          text-white flex items-center justify-center
          transition-all duration-300
        `}
      >
        <Sparkles size={24} />
      </button>

      {/* AI Chat Sidebar */}
      <AIChatSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
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
