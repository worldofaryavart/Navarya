"use client"

import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {  
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          NavArya
        </h1>
        <button 
          onClick={() => router.push('/login')}
          className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-all"
        >
          Login
        </button>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Your All-in-One AI Assistant for Startups
        </h2>
        <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
          Empower your startup with NavArya - the intelligent assistant that helps you streamline operations, 
          boost productivity, and make data-driven decisions.
        </p>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => router.push('/login')}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-all font-semibold"
          >
            Get Started
          </button>
          <a 
            href="#features"
            className="px-8 py-3 rounded-full border border-blue-500 hover:bg-blue-500/10 transition-all font-semibold"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-gray-800/50 backdrop-blur-sm">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Automation</h3>
            <p className="text-gray-400">Automate repetitive tasks and workflows with our intelligent AI system.</p>
          </div>
          <div className="p-6 rounded-xl bg-gray-800/50 backdrop-blur-sm">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Data Analytics</h3>
            <p className="text-gray-400">Get powerful insights from your data with advanced analytics capabilities.</p>
          </div>
          <div className="p-6 rounded-xl bg-gray-800/50 backdrop-blur-sm">
            <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">24/7 Assistant</h3>
            <p className="text-gray-400">Get instant support and answers with our always-available AI assistant.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-400">
                NavArya by <a href="https://webxro.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Webxro</a>
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <a href="https://webxro.com" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white">
                Visit webxro.com
              </a>
              <a href="mailto:contact@webxro.com" className="text-sm text-gray-400 hover:text-white">
                contact@webxro.com
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-gray-400">
            {new Date().getFullYear()} NavArya. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}