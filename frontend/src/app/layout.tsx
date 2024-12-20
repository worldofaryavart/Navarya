import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthWrapper from "@/components/AuthWrapper";
import Layout from "@/components/Layout";
import { TaskProvider } from "@/context/TaskContext";
import { LayoutProvider } from "@/context/LayoutContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aarya AI",
  description: "Your AI Assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LayoutProvider>
          <AuthWrapper>
            <TaskProvider>
              <Layout>{children}</Layout>
            </TaskProvider>
          </AuthWrapper>
        </LayoutProvider>
      </body>
    </html>
  );
}
