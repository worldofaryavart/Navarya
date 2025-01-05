import React from 'react';
import { FaMailBulk, FaTasks } from 'react-icons/fa';
import { FiUser, FiLogOut, FiInfo, FiEye, FiSettings } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'firebase/auth';
import { auth } from '@/utils/firebase';
import { useRouter, usePathname } from 'next/navigation';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  tasks: any[];
}

interface Task {
  // Add task properties here if needed
}

const Sidebar: React.FC<SidebarProps> = ({ tasks }) => {
  const router = useRouter();
  const pathname = usePathname();
  const user = auth?.currentUser;

  const sidebarItems: SidebarItem[] = [
    {
      label: "Task Schedule",
      href: "/tasks",
      icon: <FaTasks />,
    },
    {
      label: "Mail Agent",
      href: "/mailagent",
      icon: <FaMailBulk />,
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
    <div className="fixed left-0 top-0 bottom-0 w-16 bg-gray-900 flex flex-col items-center py-4 shadow-lg z-50">
      <Link href="/dashboard" className="mb-8">
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600"
        >
          A
        </motion.div>
      </Link>

      <nav className="flex flex-col space-y-4 flex-grow">
        {sidebarItems.map((item, index) => (
          <SidebarIconButton 
            key={index} 
            {...item} 
            isActive={pathname === item.href}
          />
        ))}
      </nav>

      <div className="flex flex-col items-center space-y-4">
        <Link href="/profile">
          <motion.div whileHover={{ scale: 1.1 }}>
            <Image
              src={user?.photoURL || "/default-profile.png"}
              alt="Profile"
              width={32}
              height={32}
              className="rounded-full ring-2 ring-gray-700 hover:ring-blue-500 transition-all"
            />
          </motion.div>
        </Link>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="text-red-400 hover:text-red-300 transition-colors p-2"
        >
          <FiLogOut size={20} />
        </motion.button>
      </div>
    </div>
  );
};

const SidebarIconButton: React.FC<SidebarItem & { isActive: boolean }> = ({ 
  label, 
  href, 
  icon,
  isActive
}) => {
  return (
    <div className="relative group">
      <Link href={href}>
        <motion.div
          whileHover={{ scale: 1.1 }}
          className={`relative p-3 rounded-lg transition-all duration-200 ${
            isActive 
              ? 'text-white bg-gray-800' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          {React.cloneElement(icon as React.ReactElement, { size: 20 })}
          {isActive && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-r"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
        </motion.div>
      </Link>
      
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded 
                    opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
        {label}
      </div>
    </div>
  );
};

export default Sidebar;