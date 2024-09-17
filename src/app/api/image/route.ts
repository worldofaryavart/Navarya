import { NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    console.log('Received prompt:', prompt)

    const output = await replicate.run(
        "bingbangboom-lab/flux-new-whimscape:2e8de10f217bc56da163a0204cf09f89995eaf643459014803fae79753183682",
        {
          input: {
            model: "dev",
            width: 856,
            height: 1156,
            prompt: prompt,
            lora_scale: 1,
            num_outputs: 1,
            aspect_ratio: "custom",
            output_format: "png",
            guidance_scale: 3.5,
            output_quality: 100,
            prompt_strength: 0.8,
            extra_lora_scale: 1,
            num_inference_steps: 25
          }
        }
      );
      console.log(output);

    if (Array.isArray(output) && output.length > 0) {
      return NextResponse.json({ imageUrl: output[0] })
    } else {
      throw new Error('Unexpected API response structure')
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Detailed error:', error.message)
      return NextResponse.json({ message: 'An error occurred', error: error.message }, { status: 500 })
    }
    console.error('Unknown error:', error)
    return NextResponse.json({ message: 'An unknown error occurred' }, { status: 500 })
  }
}