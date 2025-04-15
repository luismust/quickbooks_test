import { NextResponse } from 'next/server'

let activeThreadId: string | null = null

export async function POST() {
  try {
    activeThreadId = null
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reset thread' },
      { status: 500 }
    )
  }
} 