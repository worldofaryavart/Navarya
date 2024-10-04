"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Login from "@/components/Login";
import { useAuth } from "@/hooks/useAuth";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { user, loading } = useAuth(); 

  const handleLogin = () => {
    router.push("/");
  };

  useEffect(() => {
    if (user && !loading) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-blue-900 min-h-screen flex flex-col items-center justify-center">
        <div className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg shadow-2xl rounded-2xl p-8 max-w-md w-full mx-auto text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-blue-400 mb-2">Loading</h2>
          <p className="text-gray-300">Preparing Your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container h-screen mx-auto bg-gray-900 text-white overflow-y-auto">
      <Login onLogin={handleLogin} />
    </div>
  );
};

export default LoginPage;
