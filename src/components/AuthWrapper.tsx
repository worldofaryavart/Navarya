"use client";

import { useAuth } from "@/hooks/useAuth"; 
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Layout from "./Layout";

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true); 
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user && pathname !== '/login') {
      router.push("/login");
    } else {
      setLoading(false);
    }
  }, [user, router, pathname]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-blue-900 min-h-screen flex flex-col items-center justify-center">
        <div className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg shadow-2xl rounded-2xl p-8 max-w-md w-full mx-auto text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-blue-400 mb-2">Loading</h2>
          {/* <p className="text-gray-300">Preparing Your progress...</p> */}
        </div>
      </div>
    );
  }
  
  if (pathname === '/login' || !user) {
    return <main className="flex flex-col h-screen bg-gray-900 text-white">{children}</main>;
  }

  return <Layout>{children}</Layout>;
};

export default AuthWrapper;
