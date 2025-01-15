import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TaskProvider } from "@/context/TaskContext";
import { LayoutProvider } from "@/context/LayoutContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NavArya",
  description: "AI-powered task management and scheduling",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-900`}>
        <LayoutProvider>
          <TaskProvider>
            {children}
          </TaskProvider>
        </LayoutProvider>
      </body>
    </html>
  );
}
