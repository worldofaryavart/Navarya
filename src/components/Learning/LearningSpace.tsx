import React, { useState, useRef, useEffect } from "react";
import { FiSend, FiPlus, FiClock, FiUser, FiCopy, FiMenu, FiX, FiChevronLeft, FiImage, FiVolume2 } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { FaUser, FaRobot, FaGlobeEurope, FaAtom, FaBirthdayCake, FaMicrochip } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import Sidebar from "@/components/Sidebar";
import Profile from "@/components/Profile";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';
import axios from 'axios';

const auth = getAuth();

interface Message {
  role: "user" | "assistant";
  content: string;
  structuredContent?: {
    mainPoints: string[];
    followUpQuestion?: string;
  };
  codeBlock?: string;
  imageUrl?: string;
  audioUrl?: string;
}

const LearningSpace: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentView, setCurrentView] = useState<'chat' | 'profile' | 'about' | 'vision'>('chat');
  const [user, setUser] = useState(auth.currentUser);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

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
      // Start all API calls in parallel
      const chatPromise = fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      }).then(res => res.json());

      const imagePromise = axios.post('/api/image', { 
        prompt: `An educational illustration representing ${input}, in the style of 3Blue1Brown` 
      });

      // Wait for chat response first
      const chatData = await chatPromise;
      const assistantMessage: Message = {
        role: "assistant",
        content: chatData.content,
        structuredContent: chatData.structuredContent,
        codeBlock: chatData.codeBlock,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);

      // Then handle image and audio
      try {
        setIsGeneratingImage(true);
        const imageResponse = await imagePromise;
        const imageUrl = imageResponse.data[0];
        setMessages((prev) => prev.map((msg, index) => 
          index === prev.length - 1 ? { ...msg, imageUrl: imageUrl } : msg
        ));
      } catch (imageError) {
        console.error("Image generation error:", imageError);
      } finally {
        setIsGeneratingImage(false);
      }

      try {
        setIsGeneratingAudio(true);
        const audioResponse = await axios.post('/api/voice', { 
          text: assistantMessage.content 
        }, { responseType: 'blob' });
        const audioUrl = URL.createObjectURL(audioResponse.data);
        setMessages((prev) => prev.map((msg, index) => 
          index === prev.length - 1 ? { ...msg, audioUrl: audioUrl } : msg
        ));
      } catch (audioError) {
        console.error("Audio generation error:", audioError);
      } finally {
        setIsGeneratingAudio(false);
      }

    } catch (error) {
      console.error("Main error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsGeneratingImage(false);
      setIsGeneratingAudio(false);
    }
  };

  const suggestionPrompts = [
    { text: "Describe France Revolution", icon: <FaGlobeEurope /> },
    { text: "Explain quantum computing", icon: <FaAtom /> },
    { text: "How to make a chocolate cake?", icon: <FaBirthdayCake /> },
    { text: "Latest developments in AI", icon: <FaMicrochip /> },
  ];

  const copyToClipboard = (content: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        // alert("Copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  const renderMessageContent = (msg: Message) => {
    return (
      <>
        <ReactMarkdown
          components={{
            code({ inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {msg.content}
        </ReactMarkdown>
        {msg.imageUrl && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Generated Image:</h3>
            <Image 
              src={msg.imageUrl} 
              alt="Generated visual aid" 
              width={500} 
              height={300} 
              layout="responsive"
              className="rounded-lg shadow-md" 
            />
          </div>
        )}
        {msg.audioUrl && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Audio Explanation:</h3>
            <audio controls src={msg.audioUrl} className="w-full" />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen}
        setCurrentView={setCurrentView}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        <header className="bg-gray-800 shadow-lg p-4 flex justify-between items-center">
          {!isSidebarOpen && (
            <button 
              className="text-2xl hover:text-blue-400 transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <FiMenu />
            </button>
          )}
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            {currentView === 'chat' ? 'AaryaI Learning' : 'User Profile'}
          </h1>
          <div className="w-8"></div> {/* Placeholder for balance */}
        </header>
        
        {currentView === 'chat' ? (
          <>
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
                      className={`flex items-start space-x-2 max-w-[85%] sm:max-w-[70%] p-3 rounded-lg ${
                        msg.role === "user" ? "bg-blue-600" : "bg-gray-700"
                      } shadow-md`}
                    >
                      {msg.role === "user" ? (
                        <Image 
                          src={user?.photoURL || '/default-profile.png'} 
                          alt="User" 
                          width={24}
                          height={24}
                          className="rounded-full mt-1 hidden sm:block" 
                        />
                      ) : (
                        <FaRobot className="mt-1 hidden sm:block" />
                      )}
                      <div className="prose prose-invert max-w-none text-sm sm:text-base">
                        {renderMessageContent(msg)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {(isLoading || isGeneratingImage || isGeneratingAudio) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-center space-x-2 max-w-[85%] sm:max-w-[70%] p-3 rounded-lg bg-gray-700 shadow-md">
                    <FaRobot className="mt-1 hidden sm:block" />
                    <div className="animate-pulse">
                      {isLoading ? "Thinking..." : isGeneratingImage ? "Generating image..." : "Generating audio..."}
                    </div>
                  </div>
                </motion.div>
              )}
              {messages.length === 0 && !input && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl transition-all duration-300">
                  <div className="bg-gray-800 bg-opacity-70 p-8 rounded-2xl border-2 border-blue-500 shadow-2xl backdrop-blur-sm">
                    <h2 className="text-2xl font-bold mb-6 text-center text-blue-400 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">Learn with AaryaI</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-center">
                      {suggestionPrompts.map((prompt, index) => (
                        <motion.button
                          key={index}
                          className="flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-sm shadow-lg w-full group"
                          onClick={() => setInput(prompt.text)}
                          whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(66, 153, 225, 0.5)" }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{prompt.icon}</span>
                          <span className="font-medium">{prompt.text}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-4 bg-gray-800 border-t border-gray-700 shadow-lg"
            >
              <div className="flex items-center space-x-2 max-w-4xl mx-auto">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-grow px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base shadow-inner"
                  placeholder="Type your message..."
                  disabled={isLoading || isGeneratingImage || isGeneratingAudio}
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300 shadow-md"
                  disabled={isLoading || isGeneratingImage || isGeneratingAudio || !input.trim()}
                >
                  <FiSend />
                </motion.button>
              </div>
            </form>
          </>
        ) : (
          <Profile />
        )}
      </div>
    </div>
  );
};

export default LearningSpace;