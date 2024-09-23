import React from 'react';
import { FiPlus, FiChevronLeft, FiUser, FiLogOut, FiInfo, FiEye, FiBook, FiSearch, FiMessageSquare } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '@/utils/firebase';
import { useEffect, useState, useMemo } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Conversation } from "@/types/conversation"; // Import the interface

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setCurrentView: (view: 'chat' | 'profile' | 'about' | 'vision') => void;
  conversations: Conversation[];
  switchConversation: (id: string) => void;
  createNewConversation: () => void;
  currentConversationId: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  setCurrentView,
  conversations,
  switchConversation,
  createNewConversation,
  currentConversationId,
}) => {
  const [user, setUser] = useState(auth?.currentUser || null);
  const router = useRouter();
  const pathname = usePathname();
  const isLearningMode = pathname === '/learning';

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
      });
      return () => unsubscribe();
    }
  }, []);

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      } else {
        console.error('Auth is not initialized');
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMode = () => {
    router.push(isLearningMode ? '/research' : '/learning');
  };

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => b.createdAt - a.createdAt);
  }, [conversations]);

  const getConversationTitle = (conversation: Conversation) => {
    const firstUserMessage = conversation.messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      const words = firstUserMessage.content.split(' ').slice(0, 5).join(' ');
      return words.length < firstUserMessage.content.length ? `${words}...` : words;
    }
    return 'New Conversation';
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: isSidebarOpen ? '16rem' : '0rem' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed md:relative inset-y-0 left-0 bg-gray-800 overflow-hidden z-20 shadow-lg"
    >
      <div className="w-64 h-full p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            AaryaI
          </h2>
          <button
            className="text-2xl hover:text-blue-400 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FiChevronLeft />
          </button>
        </div>
        <div className="mb-4 relative">
          <div className="w-full h-12 bg-gray-700 rounded-full p-1 flex items-center">
            <motion.div
              className="w-1/2 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full absolute"
              animate={{ x: isLearningMode ? 0 : '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
            <button
              onClick={toggleMode}
              className={`w-1/2 h-10 rounded-full z-10 font-bold text-sm transition-colors ${
                isLearningMode ? 'text-white' : 'text-gray-300'
              }`}
            >
              Learning
            </button>
            <button
              onClick={toggleMode}
              className={`w-1/2 h-10 rounded-full z-10 font-bold text-sm transition-colors ${
                !isLearningMode ? 'text-white' : 'text-gray-300'
              }`}
            >
              Research
            </button>
          </div>
        </div>
        <button 
          className="w-full mb-4 p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
          onClick={() => {
            createNewConversation();
            setCurrentView('chat');
          }}
        >
          <FiPlus className="mr-2" /> New Conversation
        </button>
        <div className="mb-4 flex-grow overflow-y-auto">
          <h3 className="text-lg font-semibold mb-2">Conversations</h3>
          {sortedConversations.map((conversation) => (
            <button
              key={conversation.id}
              className={`w-full p-2 text-left flex items-center hover:bg-gray-700 rounded transition-colors mb-2 ${
                conversation.id === currentConversationId ? 'bg-gray-700' : ''
              }`}
              onClick={() => {
                switchConversation(conversation.id);
                setCurrentView('chat');
              }}
            >
              <FiMessageSquare className="mr-2" /> {getConversationTitle(conversation)}
            </button>
          ))}
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Know Us</h3>
          <Link href="/about" passHref>
            <button 
              className="w-full p-2 text-left flex items-center hover:bg-gray-700 rounded transition-colors mb-2"
              onClick={() => setIsSidebarOpen(false)}
            >
              <FiInfo className="mr-2" /> About Us
            </button>
          </Link>
          <Link href="/vision" passHref>
            <button 
              className="w-full p-2 text-left flex items-center hover:bg-gray-700 rounded transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <FiEye className="mr-2" /> Our Vision
            </button>
          </Link>
        </div>
        <div className="mt-auto">
          <div className="border-t border-gray-600 my-2"></div>
          <h3 className="text-lg font-semibold mb-2">Profile</h3>
          <button 
            className="w-full p-2 text-left flex items-center hover:bg-gray-700 rounded transition-colors mb-2"
            onClick={() => setCurrentView('profile')}
          >
            <Image 
              src={user?.photoURL || '/default-profile.png'} 
              alt="Profile" 
              width={24}
              height={24}
              className="rounded-full mr-2" 
            />
            {user?.displayName || 'View Profile'}
          </button>
          <button 
            className="w-full p-2 text-left flex items-center hover:bg-gray-700 rounded transition-colors text-red-400"
            onClick={handleLogout}
          >
            <FiLogOut className="mr-2" /> Logout
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;