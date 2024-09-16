"use client"

import dynamic from 'next/dynamic'

const Research = dynamic(() => import('@/components/Research/Research'), { ssr: false })

export default function LearningPage() {
  return <Research />
}