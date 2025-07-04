"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Loader from "../commonComp/Loader";

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user && pathname !== "/login") {
      router.push("/login");
    } else {
      setLoading(false);
    }
  }, [user, router, pathname]);

  if (loading) {
    return <Loader />;
  }

  if (pathname === "/login" || !user) {
    return (
      <main className="flex flex-col h-screen bg-gray-900 text-white">
        {children}
      </main>
    );
  }

  return children;
};

export default AuthWrapper;
