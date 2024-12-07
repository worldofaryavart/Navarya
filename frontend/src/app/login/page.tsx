"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Login from "@/components/Login";
import { useAuth } from "@/hooks/useAuth";
import Loader from "@/components/Loader";

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
      <Loader/>
    );
  }

  return (
    <div className="container h-screen mx-auto bg-gray-900 text-white overflow-y-auto">
      <Login onLogin={handleLogin} />
    </div>
  );
};

export default LoginPage;
