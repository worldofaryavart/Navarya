import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Image from 'next/image'

const LearningMode: React.FC = () => {
  const [topic, setTopic] = useState('')
  const [explanation, setExplanation] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const generateContent = async () => {
    setIsLoading(true)
    try {
      // Generate explanation
      const explanationResponse = await axios.post('/api/chat', { 
        message: `Explain ${topic} in the style of a 3Blue1Brown video script`, 
        model: 'gemini-pro' 
      })
      setExplanation(explanationResponse.data.content)

      // Generate audio
      const audioResponse = await axios.post('/api/voice', { 
        text: explanationResponse.data.content 
      }, { responseType: 'blob' })
      setAudioUrl(URL.createObjectURL(audioResponse.data))

      // Generate image
      const imageResponse = await axios.post('/api/image', { 
        prompt: `An educational illustration representing ${topic}, in the style of 3Blue1Brown` 
      })
      setImageUrl(imageResponse.data.imageUrl)
    } catch (error) {
      console.error('Error generating content:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">AI Learning Mode</h1>
      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Enter a topic to learn about"
        className="w-full p-2 mb-4 border rounded"
      />
      <button 
        onClick={generateContent} 
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
      >
        {isLoading ? 'Generating...' : 'Generate Explanation'}
      </button>
      
      {explanation && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">Explanation:</h2>
          <p>{explanation}</p>
        </div>
      )}
      
      {audioUrl && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">Audio Explanation:</h2>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}
      
      {imageUrl && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">Visual Aid:</h2>
          <Image src={imageUrl} alt="Generated visual aid" width={500} height={300} layout="responsive" />
        </div>
      )}
    </div>
  )
}

export default LearningMode