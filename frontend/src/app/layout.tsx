import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutProvider } from "@/context/LayoutContext";
import { SidebarProvider } from "@/context/SidebarContext";

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
    <html lang="en">
      <body className={`${inter.className}`}>
        <div className="min-h-screen">
          <LayoutProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </LayoutProvider> 
        </div>
      </body>
    </html>
  );
}
