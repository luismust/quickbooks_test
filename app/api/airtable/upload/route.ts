import { NextResponse } from 'next/server'
import Airtable from 'airtable'

// Función para generar parámetros estáticos en build time
export function generateStaticParams() {
  return []
}

export async function POST(request: Request) {
  try {
    // Esta función se usaría para subir imágenes a Airtable
    // Sin embargo, en nuestra implementación guardamos imágenes como base64
    // directamente en el objeto de preguntas, por lo que este endpoint 
    // no es realmente necesario ahora.
    
    console.log('POST request to upload/route')
    
    // Validar las variables de entorno en tiempo de ejecución
    if (!process.env.AIRTABLE_API_KEY) {
      return NextResponse.json(
        { error: 'AIRTABLE_API_KEY is not defined' },
        { status: 500 }
      )
    }

    if (!process.env.AIRTABLE_BASE_ID) {
      return NextResponse.json(
        { error: 'AIRTABLE_BASE_ID is not defined' },
        { status: 500 }
      )
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Actualmente, no necesitamos subir archivos a Airtable
    // Solo lo registramos y devolvemos éxito
    console.log('File upload received:', file.name, 'Size:', file.size)
    
    // Devolver respuesta exitosa
    return NextResponse.json({ 
      success: true,
      message: 'File upload received but not stored in Airtable',
      filename: file.name
    })
  } catch (error) {
    console.error('Error handling upload:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
} 