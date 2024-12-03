import React, { useEffect, useState } from "react";
import {
  FiPlus,
  FiChevronLeft,
  FiUser,
  FiLogOut,
  FiInfo,
  FiEye,
  FiMessageSquare,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/utils/firebase";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createConversation } from "@/utils/topicService";
import { useConversations } from "@/hooks/useConversations";
import NewConversationModal from "./NewConversationModal";

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const [user, setUser] = useState(auth!.currentUser);
  const { conversations, loading, error, setConversations } =
    useConversations(user);
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth!, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      console.log("User is: ", user.displayName);
    }
  }, [user]);

  useEffect(() => {
    if (conversations) {
      console.log("Conversations: ", conversations);
      if (conversations.length > 0) {
        console.log(
          "First conversation title: ",
          conversations[0]?.conversationTitle
        );
      } else {
        console.log("No conversations found");
      }
    }
  }, [conversations]);

  const handleLogout = async () => {
    try {
      await signOut(auth!);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
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
        topic
      );
      console.log("New conversation created:", newConversation);
      if (newConversation) {
        setConversations((prevConversations) => [
          ...prevConversations,
          newConversation,
        ]);
        router.push(`/topic/${newConversation.id}`);
      } else {
        console.log("Failed to create");
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    // In a real application, you would set the active conversation here
    console.log(`Selecting conversation: ${conversationId}`);
    router.push(`/topic/${conversationId}`);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  // if (loading) return <div>Loading conversations....</div>;
  // if (error) return <div>Error: {error}</div>;

  return (
    <>
      <motion.div
        initial={false}
        animate={{ width: isSidebarOpen ? "16rem" : "0rem" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed md:relative inset-y-0 left-0 bg-gray-800 overflow-hidden z-20 shadow-lg"
      >
        <div className="w-64 h-full p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              <Link href="/">
                <>AaryaI</>
              </Link>
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
            onClick={() => setIsModalOpen(true)}
          >
            <FiPlus className="mr-2" /> New Conversation
          </button>
          <h3 className="text-lg font-semibold mb-2">Conversations</h3>
          <div className="mb-4 flex-grow overflow-y-auto">
            {loading ? (
              <h1>Loading conversations....</h1>
            ) : conversations && conversations.length > 0 ? (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation.id)} // pass conversation id
                  className="w-full p-2 text-left flex items-start hover:bg-gray-700 rounded transition-colors mb-2"
                >
                  <FiMessageSquare className="mr-2 mt-1 flex-shrink-0" />
                  <div className="flex flex-col overflow-hidden">
                    <div className="font-semibold truncate">
                      {conversation.conversationTitle}
                    </div>
                    <div className="text-sm text-gray-400 truncate">
                      {conversation.conversationHistory[0].content}
                    </div>
                  </div>
                  <div className="ml-auto text-xs text-gray-500 flex-shrink-0">
                    {formatTimestamp(conversation.createdAt.getTime())}
                  </div>
                </button>
              ))
            ) : (
              <div>No Conversations found</div>
            )}
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
            <Link href="/tasks" passHref>
              <button
                className="w-full p-2 text-left flex items-center hover:bg-gray-700 rounded transition-colors"
                onClick={() => setIsSidebarOpen(false)}
              >
                <FiEye className="mr-2" /> Our Tasks
              </button>
            </Link>
          </div>
          <div className="mt-auto">
            <div className="border-t border-gray-600 my-2"></div>
            <h3 className="text-lg font-semibold mb-2">Profile</h3>
            <button
              className="w-full p-2 text-left flex items-center hover:bg-gray-700 rounded transition-colors mb-2"
              onClick={() => {
                // setCurrentView("profile");
                router.push("/profile");
                setIsSidebarOpen(false);
              }}
            >
              <Image
                src={user?.photoURL || "/default-profile.png"}
                alt="Profile"
                width={24}
                height={24}
                className="rounded-full mr-2"
              />
              {user?.displayName || "View Profile"}
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
      <NewConversationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateConversation={handleNewConversation}
      />
    </>
  );
};

export default Sidebar;
