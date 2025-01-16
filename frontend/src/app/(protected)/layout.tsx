'use client';

import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import Sidebar from '@/components/commonComp/Sidebar';
import Header from '@/components/commonComp/Header';
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/utils/config/firebase.config";
import { useRouter } from "next/navigation";
import Loader from "@/components/commonComp/Loader";
import AIControlButton from '@/components/AIController/AIControlButton';
import { LayoutProvider, useLayout } from '@/context/LayoutContext';
import { TaskProvider } from '@/context/TaskContext';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const { isAISidebarOpen } = useLayout();
  const { isSidebarOpen } = useSidebar();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user && pathname !== "/login") {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  if (loading) {
    return <Loader />;
  }

  return (
      <TaskProvider>
        <div className="flex min-h-screen">
        <Header />
          <Sidebar />
          <div
            className={`
              flex-1 flex flex-col min-h-screen
              transition-all duration-300
              ${isSidebarOpen ? 'pl-16' : ''}
              ${isAISidebarOpen ? 'pr-96' : ''}
            `}
          >
            <main className="flex-1">
              {children}
            </main>
            <AIControlButton />
          </div>
        </div>
      </TaskProvider>
    // <SidebarProvider>
    //   {({ isSidebarOpen }) => (
    //     <div className="flex min-h-screen ">
    //       <Header />
    //       <Sidebar />
    //       <div
    //         className={`
    //           flex-1 flex flex-col min-h-screen
    //           transition-all duration-300
    //           ${isSidebarOpen ? 'pl-16' : ''}
    //         `}
    //       >
    //         <main className="flex-1 overflow-auto">
    //           {children}
    //         </main>
    //       </div>
    //       <AIControlButton />

    //     </div>
    //   )}
    // </SidebarProvider>
  );
}
