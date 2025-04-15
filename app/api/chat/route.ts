import OpenAI from 'openai'
import { NextResponse } from 'next/server'

// Almacenar el ID del thread activo (en el servidor)
let activeThreadId: string | null = null

// Crear la instancia de OpenAI en el servidor
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Crear un thread nuevo solo si no existe uno
    if (!activeThreadId) {
      const thread = await openai.beta.threads.create()
      activeThreadId = thread.id
    }

    // Usar el thread existente
    await openai.beta.threads.messages.create(activeThreadId, {
      role: "user",
      content: message
    })

    const run = await openai.beta.threads.runs.create(activeThreadId, {
      assistant_id: ASSISTANT_ID as string
    })

    let runStatus = await openai.beta.threads.runs.retrieve(activeThreadId, run.id)
    
    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      runStatus = await openai.beta.threads.runs.retrieve(activeThreadId, run.id)
    }

    const messages = await openai.beta.threads.messages.list(activeThreadId)
    
    const lastMessage = messages.data[0]

    if (!lastMessage || !lastMessage.content[0] || !('text' in lastMessage.content[0])) {
      throw new Error('Invalid response format')
    }

    const responseText = lastMessage.content[0].text.value
    const formattedText = responseText.replace(
      /Historia:/g, 
      '**Historia:**'
    )

    return NextResponse.json({ response: formattedText })

  } catch (error) {
    console.error('Error getting assistant response:', error)
    // Si hay un error con el thread, lo limpiamos para crear uno nuevo
    activeThreadId = null
    return NextResponse.json(
      { error: 'Failed to get response from assistant' },
      { status: 500 }
    )
  }
} 