import { NextResponse } from 'next/server'
import Together from 'together-ai'

const together = new Together({ apiKey: process.env.TOGETHER_API_KEY as string })

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    console.log("Received message:", message);

    const llamaResponse = await together.chat.completions.create({
      model: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
      messages: [
        { role: "system", content: "You are an educational assistant" },
        { role: "user", content: message }
      ],
      max_tokens: 1024,
      temperature: 0.7,
    })

    const response = llamaResponse.choices[0]?.message?.content || ''
    console.log("API response:", response);

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}