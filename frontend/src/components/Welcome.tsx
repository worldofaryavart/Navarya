import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NewConversationModal from './NewConversationModal';
import { useAuth } from '@/hooks/useAuth';
import { createConversation } from '@/utils/topicService';
import { useConversations } from '@/hooks/useConversations';
import { Conversation } from '@/types/types';
import { useRouter } from 'next/navigation';
import { FiPlus, FiClock, FiCalendar, FiMessageSquare, FiStar, FiTrello } from 'react-icons/fi';

const WelcomeComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const { conversations, loading: conversationsLoading, error, setConversations } = useConversations(user);
  const router = useRouter();

  const handleNewConversation = async (topic: string, description: string) => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    try {
      const newConversation = await createConversation(user, description, topic);
      if (newConversation) {
        setConversations(prevConversations => [...prevConversations, newConversation]);
        router.push(`/topic/${newConversation.id}`);
      }
    } catch (error) {
      console.error("Failed to create conversation: ", error);
    }
  };

  const upcomingFeatures = [
    { title: "Voice Commands", description: "Control your AI assistant with voice" },
    { title: "File Analysis", description: "Advanced document understanding" },
    { title: "Multi-modal Support", description: "Interact with images and audio" },
  ];

  const DashboardCard = ({ children, className = "" }: { children: React.ReactNode; className?: string; }) => (
    <motion.div
      className={`bg-gray-800/50 p-6 rounded-xl backdrop-blur-lg border border-purple-500/30 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, borderColor: "rgba(147, 51, 234, 0.5)" }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Your AI Command Center
          </h1>
          <p className="text-gray-400 mt-2">All your AI-powered tools in one place</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tasks & Reminders Section */}
          <DashboardCard className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FiCalendar className="text-purple-400" />
                Tasks & Reminders
              </h2>
              <button
                onClick={() => router.push('/tasks')}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm transition-colors"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50">
                <FiClock className="text-purple-400" />
                <div>
                  <p className="text-white">Daily Review</p>
                  <p className="text-sm text-gray-400">Today at 6:00 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50">
                <FiTrello className="text-purple-400" />
                <div>
                  <p className="text-white">Project Planning</p>
                  <p className="text-sm text-gray-400">Tomorrow at 10:00 AM</p>
                </div>
              </div>
            </div>
          </DashboardCard>

          {/* Quick Actions */}
          <DashboardCard>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FiMessageSquare className="text-purple-400" />
              Quick Actions
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full p-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 transition-colors"
              >
                <FiPlus /> New Topic
              </button>
              <button
                onClick={() => router.push('/conversations')}
                className="w-full p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white flex items-center gap-2 transition-colors"
              >
                <FiMessageSquare /> Recent Chats
              </button>
            </div>
          </DashboardCard>

          {/* Recent Conversations */}
          <DashboardCard>
            <h2 className="text-xl font-semibold text-white mb-4">Recent Conversations</h2>
            {conversationsLoading ? (
              <div className="text-gray-400">Loading...</div>
            ) : (
              <div className="space-y-3">
                {conversations.slice(0, 3).map((conv: Conversation) => (
                  <div
                    key={conv.id}
                    onClick={() => router.push(`/topic/${conv.id}`)}
                    className="p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <p className="text-white font-medium">{conv.conversationTitle}</p>
                    <p className="text-sm text-gray-400 truncate">
                      {conv.conversationHistory[0]?.content.substring(0, 40)}...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>

          {/* Upcoming Features */}
          <DashboardCard className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FiStar className="text-purple-400" />
              Coming Soon
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-gray-700/50 border border-purple-500/20"
                >
                  <h3 className="text-white font-medium mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <NewConversationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onCreateConversation={handleNewConversation}
            onSubmit={handleNewConversation}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WelcomeComponent;