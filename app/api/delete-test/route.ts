import { NextResponse } from 'next/server'
import { deleteTest } from '@/lib/test-storage'

export async function POST(request: Request) {
  const body = await request.json()
  const { id } = body
  
  if (!id) {
    return NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 })
  }

  try {
    await deleteTest(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 })
  }
} 