import { NextResponse } from 'next/server'
import axios from 'axios'

const elevenlabsClient = axios.create({
  baseURL: 'https://api.elevenlabs.io/v1',
  headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY }
})

// Replace 'VOICE_ID' with an actual voice ID from your ElevenLabs account
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    console.log('Received text:', text)

    const response = await elevenlabsClient.post(`/text-to-speech/${VOICE_ID}`, {
      text,
      model_id: 'eleven_multilingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    }, { responseType: 'arraybuffer' })

    console.log('ElevenLabs API response status:', response.status)

    const audioContent = Buffer.from(response.data)

    return new NextResponse(audioContent, {
      headers: { 'Content-Type': 'audio/mpeg' }
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Detailed error:', (error as any).response?.data || error.message)
      return NextResponse.json({ message: 'An error occurred', error: error.message }, { status: 500 })
    }
    console.error('Unknown error:', error)
    return NextResponse.json({ message: 'An unknown error occurred' }, { status: 500 })
  }
}