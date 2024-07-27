import { NextResponse } from 'next/server'
import Together from 'together-ai'

const together = new Together({ apiKey: process.env.TOGETHER_API_KEY })

export async function POST(request: Request) {
  try {
    const { message } = await request.json()

    const response = await together.chat.completions.create({
      model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      messages: [{ role: "user", content: message }],
      max_tokens: 512,
      temperature: 0.7,
      top_p: 0.7,
      top_k: 50,
      repetition_penalty: 1,
      stop: ["<|eot_id|>"],
      stream: false
    })

    // Check if the response has the expected structure
    if (response.choices && response.choices.length > 0 && response.choices[0].message?.content) {
      return NextResponse.json({ response: response.choices[0].message.content })
    } else {
      // If the response doesn't have the expected structure, return an error
      console.error('Unexpected API response structure:', response)
      return NextResponse.json({ message: 'Unexpected API response' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
  }
}