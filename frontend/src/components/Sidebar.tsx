import React, { useState } from 'react';
import { FaTasks } from 'react-icons/fa';
import { FiUser, FiLogOut, FiInfo, FiEye, FiSettings } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'firebase/auth';
import { auth } from '@/utils/firebase';
import { useRouter } from 'next/navigation';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const Sidebar: React.FC = () => {
  const router = useRouter();
  const user = auth?.currentUser;

  const sidebarItems: SidebarItem[] = [
    {
      label: "Task Schedule",
      href: "/tasks",
      icon: <FaTasks />,
    },
    {
      label: "About Us",
      href: "/about",
      icon: <FiInfo />,
    },
    {
      label: "Our Vision",
      href: "/vision",
      icon: <FiEye />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <FiSettings />,
    }
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth!);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="fixed left-0 top-0 bottom-0 w-16 bg-gray-800 flex flex-col items-center py-4 shadow-lg z-50">
      <Link href="/" className="mb-8">
        <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          A
        </div>
      </Link>

      <nav className="flex flex-col space-y-4 flex-grow">
        {sidebarItems.map((item, index) => (
          <SidebarIconButton key={index} {...item} />
        ))}
      </nav>

      <div className="flex flex-col items-center space-y-4">
        <Link href="/profile">
          <Image
            src={user?.photoURL || "/default-profile.png"}
            alt="Profile"
            width={36}
            height={36}
            className="rounded-full hover:ring-2 hover:ring-blue-500 transition-all"
          />
        </Link>
        <button 
          onClick={handleLogout}
          className="text-red-400 hover:text-red-500 transition-colors"
        >
          <FiLogOut size={20} />
        </button>
      </div>
    </div>
  );
};

// Tooltip-like Sidebar Icon Button
const SidebarIconButton: React.FC<SidebarItem> = ({ label, href, icon }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative group">
      <Link href={href}>
        <motion.div
          className="text-gray-300 hover:text-white transition-colors p-2 rounded-lg"
          whileHover={{ scale: 1.1 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {React.cloneElement(icon as React.ReactElement, { size: 20 })}
        </motion.div>
      </Link>
      
      {isHovered && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 
                     bg-gray-800 text-white text-xs px-2 py-1 rounded-md 
                     shadow-lg whitespace-nowrap z-10"
        >
          {label}
        </motion.div>
      )}
    </div>
  );
};

export default Sidebar;