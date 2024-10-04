import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import Sparkles from 'react-sparkle';
import confetti from 'canvas-confetti';
import NewConversationModal from './NewConversationModal';
import { useAuth } from '@/hooks/useAuth';
import { createConversation } from '@/utils/topicService';
import { useConversations } from '@/hooks/useConversations';
import { Conversation } from '@/types/types';

const WelcomeComponent = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const { conversations, loading: conversationsLoading, error,  setConversations } = useConversations(user);

  const learnerTypes = [
    "a child curious about space",
    "a teenager exploring AI",
    "a researcher pioneering cures",
    "a scientist making discovery",
    "a farmer innovating agriculture"
  ];

  const mockConversations = [
    { title: "AI Ethics", preview: "Discussing the implications of AI in society..." },
    { title: "Quantum Computing", preview: "Exploring the fundamentals of quantum bits..." },
    { title: "Climate Change Solutions", preview: "Analyzing innovative approaches to sustainability..." },
  ];


  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % learnerTypes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [learnerTypes.length]);

  const animatedGradient = useSpring({
    from: { backgroundPosition: '0% 50%' },
    to: { backgroundPosition: '100% 50%' },
    config: { duration: 7000 },
    loop: { reverse: true },
  });

  const launchConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF1493', '#00FFFF', '#FFD700', '#FF4500', '#7B68EE']
    });
  };

  const handleNewConversation = async (topic: string, description: string) => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    try {
      const newConversation = await createConversation(
        user, 
        description, 
        topic,
      );
      console.log("New conversation created:", newConversation);
      if (newConversation) {
        setConversations(prevConversations => [...prevConversations, newConversation]);
        // router.push(`/conversation/${newConversation.id}`);
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
    <animated.div 
      style={{
        ...animatedGradient,
        backgroundSize: '400% 400%',
        backgroundImage: 'linear-gradient(45deg, #000000, #1a0033, #000033, #1a0033, #000000)',
      }}
      className="min-h-screen flex flex-col items-center justify-center text-white p-4 relative overflow-hidden"
    >
      <Sparkles
        color="#00FFFF"
        count={30}
        minSize={7}
        maxSize={12}
        overflowPx={0}
        fadeOutSpeed={10}
        flicker={true}
      />

      <motion.h1 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-6xl md:text-8xl font-extrabold mb-8 text-center"
        style={{
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          backgroundImage: 'linear-gradient(45deg, #FF1493, #00FFFF, #FFD700)',
          textShadow: '0 0 20px rgba(255,20,147,0.5), 0 0 30px rgba(0,255,255,0.5), 0 0 40px rgba(255,215,0,0.5)',
        }}
      >
        Welcome to AaryaI
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="text-2xl md:text-3xl text-center mb-12 max-w-3xl font-light"
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

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="w-full max-w-4xl mb-12"
      >
        <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: '#00FFFF', textShadow: '0 0 10px rgba(0,255,255,0.5)' }}>Recent Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderConversations()}
        </div>
      </motion.div>

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
          launchConfetti
        }}
        className="px-8 py-3 bg-gradient-to-r from-pink-600 to-blue-400 rounded-full text-lg font-semibold transition-all duration-300 shadow-lg"
        style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}
      >
        Start a New Topic
      </motion.button>
      <NewConversationModal
      isOpen = {isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onCreateConversation={handleNewConversation}
      />
    </animated.div>
  );
};

export default WelcomeComponent;