import { NextResponse } from 'next/server'
import { deleteTest } from '@/lib/test-storage'

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!params.id) {
    return NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 })
  }

  try {
    await deleteTest(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 })
  }
} 