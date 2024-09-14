"use client"

import { useState, useEffect } from 'react'
import Chat from '../components/Chat'
import Login from '../components/Login'
import { checkAuthState } from '@/utils/auth'


export default function Home() {
  const [userExists, setUserExists] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const unsubscribe = checkAuthState((user) => {
      setUserExists(!!user)
      setLoading(false)
    })

    return () => unsubscribe()
  },[])

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