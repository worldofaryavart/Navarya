import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NewConversationModal from './NewConversationModal';
import { useAuth } from '@/hooks/useAuth';
import { createConversation } from '@/utils/topicService';
import { useConversations } from '@/hooks/useConversations';
import { Conversation } from '@/types/types';
import { useRouter } from 'next/navigation';

const WelcomeComponent = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const { conversations, loading: conversationsLoading, error, setConversations } = useConversations(user);
  const router = useRouter();

  const learnerTypes = [
    "a child curious about space",
    "a teenager exploring AI",
    "a researcher pioneering cures",
    "a scientist making discovery",
    "a farmer innovating agriculture"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % learnerTypes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [learnerTypes.length]);

  const handleNewConversation = async (topic: string, description: string) => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    try {
      const newConversation = await createConversation(user, description, topic);
      if (newConversation) {
        setConversations(prevConversations => [...prevConversations, newConversation]);
        console.log("conversations is created: ", newConversation);
        router.push(`/topic/${newConversation.id}`);
        console.log("yes conversation created and opening topic page");
      } else {
        console.log("Failed to create conversation");
      }
    } catch (error) {
      console.error("Failed to create conversation: ", error);
    }
  };

 

  const renderConversations = () => {
    if (conversationsLoading) {
      return <div className="text-white text-center">Loading conversations...</div>;
    }
  
    if (error) {
      return <div className="text-red-500 text-center">Error loading conversations: {error}</div>;
    }
  
    const recentConversations = conversations.slice(0, 3);
  
    if (!conversationsLoading && recentConversations.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="bg-gray-900 bg-opacity-50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-filter backdrop-blur-sm border border-purple-500">
            No conversations yet. Start a new one!
          </div>
        </div>
      );
    }

    const handleConversationClick = (conversationId: string) => {
      // In a real application, you would set the active conversation here
      console.log(`Selecting conversation: ${conversationId}`);
      router.push(`/topic/${conversationId}`);
    };
  
    return (
      <>
        {recentConversations.map((conv: Conversation, index: number) => (
          <motion.div
            key={conv.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 + index * 0.2 }}
            className="bg-gray-900 bg-opacity-50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-filter backdrop-blur-sm border border-purple-500"
            whileHover={{ 
              scale: 1.05, 
              boxShadow: '0 0 20px rgba(255,20,147,0.5), 0 0 30px rgba(0,255,255,0.5)'
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleConversationClick(conv.id)} 
          >
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#FFD700' }}>
              {conv.conversationTitle}
            </h3>
            <p className="text-gray-300">
              {conv.conversationHistory[0]?.content.substring(0, 50)}...
            </p>
          </motion.div>
        ))}
      </>
    );
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-blue-900 min-h-[100dvh] w-full">
      <div className="w-full h-full px-4 pb-16 md:pb-24">
        <div className="flex flex-col items-center justify-start w-full max-w-7xl mx-auto gap-8 pt-8 md:pt-12">
          <motion.h1 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-4xl md:text-6xl lg:text-8xl font-extrabold text-center"
            style={{
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              backgroundImage: 'linear-gradient(45deg, #FF1493, #00FFFF, #FFD700)',
              // textShadow: '0 0 20px rgba(255,20,147,0.5), 0 0 30px rgba(0,255,255,0.5), 0 0 40px rgba(255,215,0,0.5)',
            }}
          >
            Welcome to AaryaI
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-xl md:text-2xl lg:text-3xl text-center max-w-3xl font-light"
            style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}
          >
            Empowering curiosity for{' '}
            <AnimatePresence mode="wait">
              <motion.span
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="font-semibold"
                style={{
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  backgroundImage: 'linear-gradient(45deg, #FF1493, #00FFFF)',
                }}
              >
                {learnerTypes[currentIndex]}
              </motion.span>
            </AnimatePresence>
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 1 }}
            whileHover={{ 
              scale: 1.05, 
              boxShadow: '0 0 20px rgba(255,20,147,0.8), 0 0 30px rgba(0,255,255,0.8)'
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsModalOpen(true);
            }}
            className="px-6 md:px-8 py-3 bg-gradient-to-r from-pink-600 to-blue-400 rounded-full text-base md:text-lg font-semibold transition-all duration-300 shadow-lg mt-4"
            style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}
          >
            Start a New Topic
          </motion.button>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="w-full max-w-4xl"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center" 
                style={{ color: '#00FFFF', textShadow: '0 0 10px rgba(0,255,255,0.5)' }}>
              Recent Topics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {renderConversations()}
            </div>
          </motion.div>

        </div>
      </div>

      <NewConversationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateConversation={handleNewConversation}
      />
    </div>
  );
};

export default WelcomeComponent;