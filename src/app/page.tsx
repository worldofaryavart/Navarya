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
    return <div>Loading...</div>
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