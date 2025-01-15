'use client';

import { SidebarProvider } from '@/context/SidebarContext';
import Sidebar from '@/components/commonComp/Sidebar';
import Header from '@/components/commonComp/Header';
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/utils/config/firebase.config";
import { useRouter } from "next/navigation";
import Loader from "@/components/commonComp/Loader";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

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
    <SidebarProvider>
      {({ isSidebarOpen }) => (
        <div className="h-full">
          <Header />
          <Sidebar />
          <main 
            className={`
              pt-16 h-full transition-all duration-300
              ${isSidebarOpen ? 'pl-16' : ''}
            `}
          >
            {children}
          </main>
        </div>
      )}
    </SidebarProvider>
  );
}
