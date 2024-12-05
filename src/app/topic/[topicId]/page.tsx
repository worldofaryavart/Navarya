import LearningSpace from '@/components/Learning/LearningSpace'
import { notFound } from 'next/navigation'

interface TopicPageProps {
  params: { topicId: string }
}


export default async function TopicPage({ params }: TopicPageProps) {
  const {topicId } = params;
  
  if (!topicId) {
    notFound()
  }

  return (
    <div>
      <LearningSpace currentConversationId = {topicId}/>
    </div>
  )
}