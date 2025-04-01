import { NextResponse } from 'next/server'
import Airtable from 'airtable'

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!)

// Función para generar parámetros estáticos en build time
export function generateStaticParams() {
  return []
}

export async function DELETE(request: Request) {
  try {
    const { imageUrl } = await request.json()
    
    // Extraer el ID del registro de la URL de la imagen
    const recordId = imageUrl.split('/')[5] // Ajustar según el formato de URL de Airtable
    
    // Eliminar el registro de Airtable
    await base('Images').destroy(recordId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
} 