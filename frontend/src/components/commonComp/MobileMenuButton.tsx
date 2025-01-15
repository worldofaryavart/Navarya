'use client';

import React from 'react';
import { FiMenu } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useSidebar } from '@/context/SidebarContext';

const MobileMenuButton: React.FC = () => {
  const { toggleSidebar } = useSidebar();

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={toggleSidebar}
      className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
    >
      <FiMenu size={24} />
    </motion.button>
  );
};

export default MobileMenuButton;
