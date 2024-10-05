import LearningSpace from '@/components/Learning/LearningSpace'
import { notFound } from 'next/navigation'

interface TopicPageProps {
  params: { id: string }
}

// async function getTopicData(id: string) {
//   // This is where you'd fetch the topic data
//   // For now, we'll return dummy data
//   return { id, title: `Topic ${id}`, content: 'This is the topic content.' }
// }

export default async function TopicPage({ params }: TopicPageProps) {
//   const topicData = await getTopicData(params.id)

//   if (!topicData) {
//     notFound()
//   }

  return (
    <div>
      {/* <h1>{topicData.title}</h1>
      <p>{topicData.content}</p> */}

      <LearningSpace/>
    </div>
  )
}