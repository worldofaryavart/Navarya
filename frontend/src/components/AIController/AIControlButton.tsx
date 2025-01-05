import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useTaskContext } from '@/context/TaskContext';
import { useLayout } from '@/context/LayoutContext';
import AIChatSidebar from './AIChatSidebar';
import { AICommandHandler } from "@/utils/ai/aiCommandHandler";
import { getTasks } from "@/utils/tasks/tasks";
import { saveMessage, getConversationHistory, startNewConversation } from "@/utils/topic/conversationService";

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const AIControlButton: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { tasks, setTasks } = useTaskContext();
  const { isSidebarOpen, setIsSidebarOpen } = useLayout();

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

  useEffect(() => {
    const loadHistory = async () => {
      const history = await getConversationHistory();
      if (history.length > 0) {
        setMessages(history.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'ai',
          content: msg.content,
          timestamp: msg.timestamp
        })));
      } else {
        // Start a new conversation if there's no history
        await startNewConversation();
      }
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

    // Save user message to Firebase
    await saveMessage(inputValue, 'user');

    setIsProcessing(true);
    try {
      // Process the command
      const result = await AICommandHandler.processCommand(inputValue);
      console.log("result is : ", result);

      // Add AI response
      const aiMessage: Message = {
        role: 'ai',
        content: result.message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);

      // Save AI message to Firebase
      await saveMessage(result.message, 'assistant');

      // If command was successful, refresh tasks
      if (result.success) {
        await refreshTasks();
      }

      // Reset input
      setInputValue("");
    } catch (error) {
      console.error("Processing error", error);
      // Add error message
      const errorMessage: Message = {
        role: 'ai',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Save error message to Firebase
      await saveMessage('Sorry, I encountered an error processing your request.', 'assistant');
    } finally {
      setIsProcessing(false);
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
      />
    </>
  );
};

export default AIControlButton;
