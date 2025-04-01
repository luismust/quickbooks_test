import { NextResponse } from 'next/server'
import Airtable from 'airtable'
import { createHash } from 'crypto'

// Definir los campos exactos según las tablas de Airtable
const FIELDS = {
  // Campos para la tabla de imágenes
  NAME: 'Name',     // Nombre de la columna para el nombre de la imagen
  IMAGE: 'image'    // Nombre de la columna para la imagen (en minúsculas)
}

// Nombre de la tabla de imágenes en Airtable
const TABLE_NAME = process.env.AIRTABLE_TABLE_IMAGES || 'Images'  // Usar la variable de entorno

// Verificar que las variables de entorno están configuradas
if (!process.env.AIRTABLE_API_KEY) {
  console.error('⚠️ Variable de entorno AIRTABLE_API_KEY no está definida')
}

if (!process.env.AIRTABLE_BASE_ID) {
  console.error('⚠️ Variable de entorno AIRTABLE_BASE_ID no está definida')
}

if (!process.env.AIRTABLE_TABLE_IMAGES) {
  console.error('⚠️ Variable de entorno AIRTABLE_TABLE_IMAGES no está definida')
}

const base = new Airtable({ 
  apiKey: process.env.AIRTABLE_API_KEY || '', 
  endpointUrl: 'https://api.airtable.com' 
}).base(process.env.AIRTABLE_BASE_ID || '')

// Función para generar parámetros estáticos en build time
export function generateStaticParams() {
  return []
}

export async function POST(request: Request) {
  try {
    console.log('POST to /api/airtable')
    const body = await request.json()
    
    if (!body.file || typeof body.file !== 'string') {
      return NextResponse.json(
        { error: 'No file provided or invalid format' },
        { status: 400 }
      )
    }
    
    // En nuestra implementación actual, simplemente registramos que se recibió
    // una solicitud de carga y devolvemos una URL ficticia
    console.log('Received base64 image, length:', body.file.length)
    
    return NextResponse.json({
      success: true,
      url: `image_reference_${Date.now()}`, // URL ficticia que nuestro código entiende
      message: 'Image data received but stored inline, not separately in Airtable'
    })
  } catch (error) {
    console.error('Error in Airtable API:', error)
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    console.log('DELETE to /api/airtable')
    
    // Necesitamos leer el cuerpo de la solicitud como JSON
    const body = await request.json()
    
    if (!body.testId) {
      return NextResponse.json(
        { error: 'No testId provided' },
        { status: 400 }
      )
    }
    
    // En nuestra implementación actual, no eliminamos imágenes separadamente
    console.log('Request to delete images for test:', body.testId)
    
    return NextResponse.json({
      success: true,
      message: `No images to delete for test ${body.testId} as they are stored inline with test data`
    })
  } catch (error) {
    console.error('Error deleting images:', error)
    return NextResponse.json(
      { error: 'Failed to delete images' },
      { status: 500 }
    )
  }
} 