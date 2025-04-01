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
  if (!params.testId) {
    return NextResponse.json(
      { error: 'TestId is required' },
      { status: 400 }
    )
  }

  try {
    // Intentar eliminar del registro de Airtable
    await base(process.env.AIRTABLE_TABLE_NAME || 'Tests').destroy(params.testId)
    
    // Devolver respuesta exitosa
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting test:', error)
    return NextResponse.json(
      { error: 'Failed to delete test' },
      { status: 500 }
    )
  }
} 