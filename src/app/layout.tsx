import type { Metadata } from "next";
import "./globals.css";
import { useState } from "react";
import Layout from "@/components/Layout";

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
      <Layout>
        {children}
      </Layout>
      </body>
    </html>
  );
}
