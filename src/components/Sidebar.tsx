import React from 'react';
import { FiPlus, FiChevronLeft, FiUser, FiLogOut } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '@/utils/firebase';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setCurrentView: (view: 'chat' | 'profile') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setIsSidebarOpen, setCurrentView }) => {
  const [user, setUser] = useState(auth?.currentUser || null);

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

  return (
    <motion.div
      initial={false}
      animate={{ width: isSidebarOpen ? '16rem' : '0rem' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed md:relative inset-y-0 left-0 bg-gray-800 overflow-hidden z-20 shadow-lg"
    >
      <div className="w-64 h-full p-4">
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
        <button 
          className="w-full mb-4 p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
          onClick={() => setCurrentView('chat')}
        >
          <FiPlus className="mr-2" /> New Chat
        </button>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">History</h3>
          {/* Add history items here */}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Profile</h3>
          <button 
            className="w-full p-2 text-left flex items-center hover:bg-gray-700 rounded transition-colors"
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