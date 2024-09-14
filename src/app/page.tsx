"use client"

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { checkAuthState } from '@/utils/auth'

const Login = dynamic(() => import('../components/Login'), { ssr: false })
const Chat = dynamic(() => import('../components/Chat'), { ssr: false })

export default function Home() {
  const [userExists, setUserExists] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const unsubscribe = checkAuthState((user) => {
      setUserExists(!!user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleLogin = () => {
    setUserExists(true)
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-blue-900 min-h-screen flex flex-col items-center justify-center">
        <div className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg shadow-2xl rounded-2xl p-8 max-w-md w-full mx-auto text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-blue-400 mb-2">Loading</h2>
          <p className="text-gray-300">Preparing your AaryaI experience...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex flex-col h-screen bg-gray-900 text-white">
      {userExists ? (
        <Chat />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </main>
  )
}