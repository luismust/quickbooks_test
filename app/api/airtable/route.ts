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

export async function POST(request: Request) {
  try {
    console.log('POST /api/airtable - Starting image upload')
    console.log('Using table from env:', process.env.AIRTABLE_TABLE_IMAGES)
    console.log('TABLE_NAME constant:', TABLE_NAME)
    
    // Obtener datos de la solicitud
    const { file, testId } = await request.json()
    
    console.log('Environment variables:', {
      apiKey: !!process.env.AIRTABLE_API_KEY,
      baseId: !!process.env.AIRTABLE_BASE_ID,
      tableImages: process.env.AIRTABLE_TABLE_IMAGES,
      usingTable: TABLE_NAME
    })

    // Validar que el archivo es base64
    if (!file || typeof file !== 'string' || !file.startsWith('data:image/')) {
      console.error('Invalid image format or missing image data')
      return NextResponse.json(
        { error: 'Invalid image format' },
        { status: 400 }
      )
    }

    try {
      // Crear un nombre único para la imagen basado en un hash y el timestamp
      const hash = createHash('md5').update(file.substring(0, 100) + Date.now()).digest('hex').substring(0, 8)
      const imageName = `test_image_${testId || 'unknown'}_${hash}`
      console.log('Creating image record with name:', imageName)
      
      // Extraer el tipo MIME y la extensión
      const mimeMatch = file.match(/^data:([^;]+);/)
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'
      const extension = mimeType.split('/')[1] || 'jpg'
      
      // En lugar de intentar subir directamente el base64, creamos un registro
      // sin imagen y luego retornamos el base64 como URL temporal
      
      // Preparar los campos para Airtable - solo incluimos el nombre
      const fields = {} as Record<string, any>
      fields[FIELDS.NAME] = imageName
      
      console.log('Creating record in table:', TABLE_NAME)
      
      try {
        // Crear el registro sin la imagen
        const records = await base(TABLE_NAME).create([{ fields }])
        
        if (!records || records.length === 0) {
          console.error('No record was created in Airtable')
          return NextResponse.json(
            { error: 'Failed to create image record' },
            { status: 500 }
          )
        }
        
        const record = records[0]
        console.log('Record created successfully with ID:', record.id)
        
        // Retornar la información con el base64 como URL temporal
        return NextResponse.json({
          id: record.id,
          url: file, // Retornar el base64 como URL para uso temporal
          isBase64: true,
          name: imageName,
          thumbnails: {
            small: file,
            large: file,
            full: file
          }
        })
        
      } catch (airtableError: any) {
        console.error('Airtable API error creating record:', airtableError)
        return NextResponse.json(
          { 
            error: 'Airtable API error', 
            message: airtableError.message || 'Unknown error',
            details: airtableError
          },
          { status: 500 }
        )
      }
    } catch (error) {
      console.error('Error processing image upload:', error)
      return NextResponse.json(
        { error: 'Failed to process image', message: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error processing image upload request:', error)
    return NextResponse.json(
      { error: 'Failed to upload image', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { testId } = await request.json()

    console.log(`Attempting to delete images for test ID: ${testId}`)
    
    // En la tabla de imágenes, buscamos por el nombre que contiene el testId
    const nameFilter = `SEARCH("${testId}", {${FIELDS.NAME}})`
    
    try {
      const records = await base(TABLE_NAME)
        .select({
          filterByFormula: nameFilter
        })
        .all()
      
      console.log(`Found ${records.length} image records to delete`)
      
      if (records.length > 0) {
        const deleteResult = await Promise.all(
          records.map(record => base(TABLE_NAME).destroy(record.id))
        )
        console.log(`Successfully deleted ${deleteResult.length} records`)
      } else {
        console.log('No image records found to delete')
      }
      
      return NextResponse.json({ 
        success: true,
        deletedCount: records.length
      })
      
    } catch (error: any) {
      console.error('Error during delete operation:', error)
      if (error.error === 'NOT_FOUND') {
        console.error(`Table "${TABLE_NAME}" not found.`)
      }
      throw error
    }

  } catch (error) {
    console.error('Error deleting images:', error)
    return NextResponse.json(
      { error: 'Failed to delete images' },
      { status: 500 }
    )
  }
} 