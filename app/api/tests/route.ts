import { NextResponse } from 'next/server'
import Airtable from 'airtable'
import type { Test } from '@/lib/test-storage'

// Validar variables de entorno
if (!process.env.AIRTABLE_API_KEY) {
  throw new Error('AIRTABLE_API_KEY is not defined')
}

if (!process.env.AIRTABLE_BASE_ID) {
  throw new Error('AIRTABLE_BASE_ID is not defined')
}

if (!process.env.AIRTABLE_TABLE_NAME) {
  throw new Error('AIRTABLE_TABLE_NAME is not defined')
}

const base = new Airtable({ 
  apiKey: process.env.AIRTABLE_API_KEY,
  endpointUrl: 'https://api.airtable.com'  // Agregar endpoint explícito
}).base(process.env.AIRTABLE_BASE_ID)

export async function POST(request: Request) {
  try {
    console.log('=== Starting POST request ===')
    console.log('Environment variables:', {
      hasApiKey: Boolean(process.env.AIRTABLE_API_KEY),
      hasBaseId: Boolean(process.env.AIRTABLE_BASE_ID),
      hasTableName: Boolean(process.env.AIRTABLE_TABLE_NAME),
      tableName: process.env.AIRTABLE_TABLE_NAME
    })
    
    const test = await request.json() as Test
    console.log('Received test:', {
      id: test.id,
      name: test.name,
      description: test.description,
      questionsCount: test.questions?.length,
      maxScore: test.maxScore,
      minScore: test.minScore
    })

    // Validar datos requeridos
    if (!test.name || !Array.isArray(test.questions)) {
      console.log('Validation failed:', { 
        hasName: Boolean(test.name), 
        hasQuestions: Array.isArray(test.questions),
        questionsType: typeof test.questions
      })
      return NextResponse.json(
        { error: 'Test name and questions are required' },
        { status: 400 }
      )
    }

    // Asegurarnos de que los campos opcionales tengan valores por defecto
    const testToSave = {
      ...test,
      description: test.description || '',
      maxScore: test.maxScore || 100,
      minScore: test.minScore || 60,
      passingMessage: test.passingMessage || "Congratulations!",
      failingMessage: test.failingMessage || "Try again"
    }
    console.log('Test prepared for save:', {
      name: testToSave.name,
      description: testToSave.description,
      questionsCount: testToSave.questions.length
    })

    console.log('Creating record in Airtable...')
    console.log('Using table:', process.env.AIRTABLE_TABLE_NAME)
    
    try {
      console.log('Attempting to create record in Airtable...')
      
      // Usar nombres de campos en minúsculas para coincidir con Airtable
      const recordData = {
        fields: {
          name: testToSave.name,             // minúsculas
          description: testToSave.description, // minúsculas
          questions: JSON.stringify(testToSave.questions), // minúsculas
          max_score: testToSave.maxScore,      // snake_case
          min_score: testToSave.minScore,      // snake_case
          passing_message: testToSave.passingMessage, // snake_case
          failing_message: testToSave.failingMessage  // snake_case
        }
      }
      console.log('Record data prepared:', recordData)

      const record = await base(process.env.AIRTABLE_TABLE_NAME).create([recordData])
      console.log('Airtable response:', record)

      const createdRecord = record[0]
      console.log('Created record:', {
        id: createdRecord.id,
        fields: createdRecord.fields
      })

      const response = {
        id: createdRecord.id,
        ...testToSave
      }

      return NextResponse.json(response)

    } catch (airtableError) {
      console.error('Airtable error details:', {
        error: airtableError,
        message: airtableError instanceof Error ? airtableError.message : 'Unknown error',
        name: airtableError instanceof Error ? airtableError.name : 'Unknown',
        status: airtableError?.statusCode,
        type: airtableError?.error,
        details: airtableError?.message
      })
      throw airtableError
    }

  } catch (error) {
    console.error('=== Error in POST request ===')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : error)
    console.error('Error stack:', error instanceof Error ? error.stack : undefined)
    console.error('Full error object:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to save test', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const records = await base(process.env.AIRTABLE_TABLE_NAME)
      .select()
      .all()

    const tests = records.map(record => ({
      id: record.id,
      name: record.fields.name,           // minúsculas
      description: record.fields.description, // minúsculas
      questions: JSON.parse(record.fields.questions as string), // minúsculas
      maxScore: record.fields.max_score,    // snake_case
      minScore: record.fields.min_score,    // snake_case
      passingMessage: record.fields.passing_message, // snake_case
      failingMessage: record.fields.failing_message  // snake_case
    }))

    return NextResponse.json({ tests })

  } catch (error) {
    console.error('Error fetching tests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tests' },
      { status: 500 }
    )
  }
} 