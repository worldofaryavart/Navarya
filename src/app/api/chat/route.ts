import { NextResponse } from 'next/server'
import Together from 'together-ai'
import { GoogleGenerativeAI } from '@google/generative-ai'

const together = new Together({ apiKey: process.env.TOGETHER_API_KEY as string })
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY as string)

export async function POST(request: Request) {
  try {
    const { message, model } = await request.json()

    let response

    switch (model) {
      case 'gemini-pro':
        const geminiPro = genAI.getGenerativeModel({ model: 'gemini-pro' })
        const geminiProResult = await geminiPro.generateContent(message)
        response = geminiProResult.response.text()
        break
      case 'gemini-flash':
        const geminiFlash = genAI.getGenerativeModel({ model: 'gemini-flash' })
        const geminiFlashResult = await geminiFlash.generateContent(message)
        response = geminiFlashResult.response.text()
        break
      case 'llama':
      default:
        const llamaResponse = await together.chat.completions.create({
          model: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
          messages: [
            { role: "system", content: "You are an educational assistant" },
            { role: "user", content: message }
          ],
          max_tokens: 1024,
          temperature: 0.7,
        })
        response = llamaResponse.choices[0]?.message?.content || ''
    }

    return NextResponse.json({ content: response })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
  }
}