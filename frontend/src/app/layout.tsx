import type { Metadata } from "next";
import "./globals.css";
import { useState } from "react";
import Layout from "@/components/Layout";
import AuthWrapper from "@/components/AuthWrapper";

export const metadata: Metadata = {
  title: "AaryaI",
  description: "Empower Your Learning Journey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  );
}
