import { NextResponse } from 'next/server'
import Together from 'together-ai'

const together = new Together({ apiKey: process.env.TOGETHER_API_KEY })

export async function POST(request: Request) {
  try {
    const { message } = await request.json()

    const response = await together.chat.completions.create({
      model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant specialized in coding. When asked for code, provide the full code directly without explanations. For non-code questions, provide concise, structured responses with main points as a numbered list. End with a follow-up question if appropriate." },
        { role: "user", content: message }
      ],
      max_tokens: 1024,
      temperature: 0.7,
      top_p: 0.7,
      top_k: 50,
      repetition_penalty: 1,
      stop: ["<|eot_id|>"],
      stream: false
    })

    if (response.choices && response.choices.length > 0 && response.choices[0].message?.content) {
      const content = response.choices[0].message.content
      const processedContent = processResponse(content, message)

      return NextResponse.json(processedContent)
    } else {
      console.error('Unexpected API response structure:', response)
      return NextResponse.json({ message: 'Unexpected API response' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
  }
}

function processResponse(content: string, userMessage: string): { response: string, structuredContent?: { mainPoints: string[], followUpQuestion?: string }, codeBlock?: string } {
  if (userMessage.toLowerCase().includes('code') || content.includes('```')) {
    const codeMatch = content.match(/```(?:\w+)?\n([\s\S]*?)```/)
    if (codeMatch) {
      return {
        response: content,
        codeBlock: codeMatch[1].trim()
      }
    }
  }

  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  const mainPoints: string[] = []
  let followUpQuestion: string | undefined

  for (const line of lines) {
    if (line.match(/^\d+\./)) {
      mainPoints.push(line.replace(/^\d+\.\s*/, ''))
    } else if (line.endsWith('?')) {
      followUpQuestion = line
      break
    }
  }

  return {
    response: content,
    structuredContent: { mainPoints, followUpQuestion }
  }
}