"use client";

import WelcomeComponent from "@/components/Welcome";

export default function HomePage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome to Aarya AI</h1>
      {/* Your home page content */}
      <WelcomeComponent/>
    </div>
  );
}
