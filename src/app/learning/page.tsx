"use client"

import dynamic from 'next/dynamic'

const Learning = dynamic(() => import('@/components/Learning/Learning'), { ssr: false })

export default function LearningPage() {
  return <Learning />
}