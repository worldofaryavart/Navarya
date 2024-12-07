"use client";
import { useTaskContext } from "@/context/TaskContext";
import { FiMenu } from "react-icons/fi";
import Sidebar from "./Sidebar";
import AIControlButton from "./AIControlButton";
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { tasks } = useTaskContext();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-grow overflow-hidden ml-16">
        <Header />
        <main className="flex-grow bg-gray-900 overflow-auto p-0">
          {children}
        </main>
        <AIControlButton />
      </div>
    </div>
  );
};

export default Layout;