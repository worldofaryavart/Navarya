"use client"

import { useState } from 'react'
import WelcomeComponent from '@/components/Welcome'

export default function Home() {  
  
  return (
    <main className="flex flex-col h-screen bg-gray-900 text-white">
        <WelcomeComponent/>
    </main>
  )
}