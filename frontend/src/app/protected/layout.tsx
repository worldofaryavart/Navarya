"use client";

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
      <div className="flex min-h-screen">
        <div
          className={`
              flex-1 flex flex-col min-h-screen
              transition-all duration-300
              `}
        >
          <main className="flex-1">{children}</main>
        </div>
      </div>
  );
}
