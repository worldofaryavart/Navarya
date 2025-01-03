"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Login from "@/components/Login";
import { useAuth } from "@/hooks/useAuth";
import Loader from "@/components/Loader";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { user, loading } = useAuth(); 

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
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-md">
        <Login onLogin={() => router.push("/")} />
      </div>
    </div>
  );
};

export default LoginPage;
