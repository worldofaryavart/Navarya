"use client"

import { useState, useEffect } from 'react'
import Chat from '../components/Chat'
import Login from '../components/Login'

export default function Home() {
  const [userExists, setUserExists] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if user exists
    const checkUserExists = async () => {
      try {
        // Replace this with your actual API call to check if the user exists
        const response = await fetch('/api/check-user')
        const data = await response.json()
        setUserExists(data.exists)
      } catch (error) {
        console.error('Error checking user:', error)
        setUserExists(false)
      }
    }
    checkUserExists()
  }, [])

  if (userExists === null) {
    // Loading state while checking user existence
    return <div>Loading...</div>
  }

  return (
    <main className="flex flex-col h-screen bg-gray-900 text-white">
      {userExists ? (
        <Chat />
      ) : (
        <Login />
      )}
    </main>
  )
}