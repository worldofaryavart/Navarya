import React, { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles } from "lucide-react";
import { useTaskContext } from '@/context/TaskContext';
import { useLayout } from '@/context/LayoutContext';
import AIChatSidebar from './AIChatSidebar';
import { AICommandHandler } from "@/services/ai_cmd_process/process_cmd";
// import { getTasks } from "@/services/task_services/tasks";
import {  getConversationHistory, startNewConversation } from "@/services/context_services/context";
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

const CONTEXT_CACHE_DURATION = 60000; // 1 minute cache

const AIControlButton: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contextData, setContextData] = useState<ContextData>({});
  const { tasks, setTasks } = useTaskContext();
  const { isAISidebarOpen, setIsAISidebarOpen } = useLayout();
  const router = useRouter();
  const uiCommandHandler = new UICommandHandler(router);
  const aiCommandHandler = new AICommandHandler(router);

  // Cache management
  const contextCache = useRef<{ [key: string]: { data: any, timestamp: number } }>({});
  const lastContextFetch = useRef<{ [key: string]: number }>({});

  // Optimized context fetching with caching
  // const fetchContext = useCallback(async (contextType: string) => {
  //   const now = Date.now();
  //   const lastFetch = lastContextFetch.current[contextType] || 0;

  //   // Return cached data if within cache duration
  //   if (now - lastFetch < CONTEXT_CACHE_DURATION && contextCache.current[contextType]) {
  //     console.log(`Using cached ${contextType} context`);
  //     return contextCache.current[contextType].data;
  //   }

  //   try {
  //     console.log(`Fetching fresh ${contextType} context`);
  //     const response = await fetch(getApiUrl(`/api/context/${contextType}`), {
  //       headers: {
  //         'user-id': auth?.currentUser?.uid || 'anonymous'
  //       }
  //     });

  //     if (response.ok) {
  //       const data = await response.json();
  //       // Update cache
  //       contextCache.current[contextType] = { data, timestamp: now };
  //       lastContextFetch.current[contextType] = now;
  //       setContextData(prev => ({ ...prev, [contextType]: data }));
  //       return data;
  //     }
  //   } catch (error) {
  //     console.error(`Error fetching ${contextType} context:`, error);
  //   }
  //   return null;
  // }, []);

  // Optimized context updating with cache invalidation
  // const updateContext = useCallback(async (contextType: string, data: any) => {
  //   try {
  //     await fetch(getApiUrl(`/api/context/${contextType}`), {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'user-id': auth?.currentUser?.uid || 'anonymous'
  //       },
  //       body: JSON.stringify(data)
  //     });

  //     // Update cache
  //     const now = Date.now();
  //     contextCache.current[contextType] = { data, timestamp: now };
  //     lastContextFetch.current[contextType] = now;
  //     setContextData(prev => ({ ...prev, [contextType]: data }));
  //   } catch (error) {
  //     console.error(`Error updating ${contextType} context:`, error);
  //   }
  // }, []);

  // Load initial data
  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      try {
        // Load conversation history only if none exists
        if (messages.length === 0) {
          const history = await getConversationHistory();
          if (mounted && history.length > 0) {
            setMessages(history.map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'ai',
              content: msg.content,
              timestamp: msg.timestamp
            })));
          } else if (mounted) {
            await startNewConversation();
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

      // const sessionContext = {
      //   ...contextData.session,
      //   currentTopic: inputValue,
      //   recentMessages: messages.slice(-5)
      // };
      // await updateContext('session', sessionContext);

      // const result = await AICommandHandler.processCommand(userMessage:Message, router,
        // {
        //   sessionContext: contextData.session,
        //   persistentContext: contextData.persistent
        // }
      // );

      const result = await AICommandHandler.processCommand(userMessage, router);

      if (result.success) {
        const aiMessage: Message = {
          role: 'ai',
          content: result.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        // await saveMessage(result.message, 'assistant');

        // const updatedSessionContext = {
        //   ...sessionContext,
        //   lastSuccessfulCommand: {
        //     command: inputValue,
        //     result: result.message,
        //     timestamp: new Date()
        //   }
        // };
        // await updateContext('session', updatedSessionContext);

        // Only refresh tasks if the command was successful and involved task operations
        // if (result.success && result.data?.tasksModified) {
        //   await refreshTasks();
        // }
      }

      setInputValue("");
    } catch (error) {
      console.error('Error processing command:', error);
      const errorMessage: Message = {
        role: 'ai',
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
        // Reset session context
        // const emptySessionContext = {
        //   currentTopic: '',
        //   recentMessages: [],
        //   lastSuccessfulCommand: null
        // };
        // await updateContext('session', emptySessionContext);
        // setContextData(prev => ({ ...prev, session: emptySessionContext }));
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
      const history = await getConversationHistory(conversationId);
      if (history.length > 0) {
        setMessages(history.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'ai',
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
