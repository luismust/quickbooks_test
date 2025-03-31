import { NextResponse } from 'next/server'
import Airtable from 'airtable'

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!)

export async function POST(request: Request) {
  try {
    const { file, testId } = await request.json()

    // Validar que el archivo es base64
    if (!file.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image format' },
        { status: 400 }
      )
    }

    // Subir imagen a Airtable
    const record = await base('Images').create({
      image: [{
        url: file // Airtable acepta base64 directamente
      }],
      testId: testId || 'unassigned',
      createdAt: new Date().toISOString()
    })

    // Esperar a que Airtable procese la imagen
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Obtener el registro actualizado con las URLs
    const updatedRecord = await base('Images').find(record.id)
    const image = updatedRecord.fields.image[0]

    return NextResponse.json({
      id: record.id,
      url: image.url,
      thumbnails: {
        small: image.thumbnails?.small?.url,
        large: image.thumbnails?.large?.url,
        full: image.thumbnails?.full?.url
      }
    })

  } catch (error) {
    console.error('Error uploading to Airtable:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { testId } = await request.json()

    // Eliminar imágenes asociadas al test
    const records = await base('Images')
      .select({
        filterByFormula: `{testId} = '${testId}'`
      })
      .all()

    await Promise.all(
      records.map(record => base('Images').destroy(record.id))
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting images:', error)
    return NextResponse.json(
      { error: 'Failed to delete images' },
      { status: 500 }
    )
  }
} 