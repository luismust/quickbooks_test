import { NextRequest, NextResponse } from 'next/server'
import { deleteTest } from '@/lib/test-storage'

interface Params {
  id: string;
}

export async function DELETE(
  request: NextRequest,
  context: { params: Params }
) {
  try {
    const { params } = context;
    const success = await deleteTest(params.id)
    
    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Failed to delete test' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error deleting test:', error)
    return NextResponse.json(
      { error: 'Failed to delete test' },
      { status: 500 }
    )
  }
} 