"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Login from "@/components/auth/Login";
import { useAuth } from "@/hooks/useAuth";
import Loader from "@/components/commonComp/Loader";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { user, loading } = useAuth(); 

  useEffect(() => {
    if (user && !loading) {
      router.push("/chat/new");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center relative">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/20 rounded-full blur-[120px]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        <Login onLogin={() => router.push("/chat")} />
      </div>
    </div>
  );
};

export default LoginPage;
