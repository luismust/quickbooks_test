import { NextResponse } from 'next/server'
import { deleteTest } from '@/lib/test-storage'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteTest(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting test:', error)
    return NextResponse.json(
      { error: 'Failed to delete test' },
      { status: 500 }
    )
  }
} 