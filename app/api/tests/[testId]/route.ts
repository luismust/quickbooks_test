import { NextResponse } from 'next/server'
import Airtable from 'airtable'

const base = new Airtable({ 
  apiKey: process.env.AIRTABLE_API_KEY || '',
  endpointUrl: 'https://api.airtable.com'
}).base(process.env.AIRTABLE_BASE_ID || '')

// Función para generar parámetros estáticos en build time
export function generateStaticParams() {
  return [
    { testId: 'sample-test' }
  ]
}

export async function DELETE(
  request: Request,
  { params }: { params: { testId: string } }
) {
  try {
    const testId = params.testId;
    console.log('Deleting test with ID:', testId);

    const tableName = process.env.AIRTABLE_TABLE_NAME || '';
    await base(tableName).destroy(testId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting test:', error)
    return NextResponse.json(
      { error: 'Failed to delete test' },
      { status: 500 }
    )
  }
} 