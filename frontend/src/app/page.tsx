"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 backdrop-blur-sm bg-black/30 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Navarya
          </div>
          <div className="hidden md:flex space-x-8 items-center">
            {/* <a
              href="#features"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Features
            </a> */}
            <a
              href="/about"
              className="text-gray-300 hover:text-white transition-colors"
            >
              About
            </a>
            <button
              onClick={() => router.push("/signup")}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 transition-all"
            >
              Sign Up
            </button>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm transition-all"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative">
        <div className="container mx-auto px-6 pt-32 pb-20">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-block mb-4 px-4 py-1 rounded-full bg-white/5 border border-white/10 text-sm">
              Persistent Memory AI
            </div>
            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
              AI{" "}
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                That Remembers Everything
              </span>
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push("/login")}
                className="group px-8 py-4 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 transition-all flex items-center justify-center gap-2 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <span className="relative z-10">Start Free Trial</span>
                <svg
                  className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
              <button className="px-8 py-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm transition-all flex items-center justify-center gap-2">
                <span>Watch Demo</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-500/20 rounded-full blur-[120px]"></div>
          <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/20 rounded-full blur-[120px]"></div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20 relative">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-400">
                Navarya by{" "}
                <a
                  href="https://webxro.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300"
                >
                  aryavart.xyz
                </a>
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <a
                href="https://webxro.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Visit aryavart.xyz 
              </a>
              <span className="hidden md:inline text-gray-600">•</span>
              <a
                href="mailto:contact@webxro.com"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                contact@webxro.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
