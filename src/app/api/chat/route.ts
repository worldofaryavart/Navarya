import { NextResponse } from 'next/server'
import Together from 'together-ai'

const together = new Together({ apiKey: process.env.TOGETHER_API_KEY })

export async function POST(request: Request) {
  try {
    const { message } = await request.json()

    const response = await together.chat.completions.create({
      model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant. Provide concise, structured responses with main points as a numbered list. End with a follow-up question if appropriate." },
        { role: "user", content: message }
      ],
      max_tokens: 512,
      temperature: 0.7,
      top_p: 0.7,
      top_k: 50,
      repetition_penalty: 1,
      stop: ["<|eot_id|>"],
      stream: false
    })

    if (response.choices && response.choices.length > 0 && response.choices[0].message?.content) {
      const content = response.choices[0].message.content
      const structuredContent = processResponse(content)

      return NextResponse.json({
        response: content,
        structuredContent
      })
    } else {
      console.error('Unexpected API response structure:', response)
      return NextResponse.json({ message: 'Unexpected API response' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
  }
}

function processResponse(content: string): { mainPoints: string[], followUpQuestion?: string } {
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

  return { mainPoints, followUpQuestion }
}