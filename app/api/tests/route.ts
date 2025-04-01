import { NextResponse } from 'next/server'
import Airtable from 'airtable'
import type { Test, Question } from '@/lib/test-storage'

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

// Campos exactos de la tabla de tests en Airtable
const FIELDS = {
  ID: 'id',
  NAME: 'name',
  DESCRIPTION: 'description', // Campo en inglés
  QUESTIONS: 'questions',
  MAX_SCORE: 'max_score',
  MIN_SCORE: 'min_score',
  CREATED_AT: 'created_at', // Este es un campo computado, no lo enviamos
  IMAGES: 'images',
  PASSING_MESSAGE: 'passing_message',
  FAILING_MESSAGE: 'failing_message'
}

const base = new Airtable({ 
  apiKey: process.env.AIRTABLE_API_KEY,
  endpointUrl: 'https://api.airtable.com'  // Agregar endpoint explícito
}).base(process.env.AIRTABLE_BASE_ID || '')

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

    // Simplificar las preguntas para evitar problemas con Airtable
    const simplifiedQuestions = testToSave.questions.map(q => {
      // Crear una versión simplificada de la pregunta
      const simplifiedQuestion = {
        ...q,
        // Si la imagen es base64, guardar solo una referencia
        image: q.image?.startsWith('data:') 
          ? `image_reference_${q.id}`
          : q.image
      };
      
      // Eliminar propiedades que no son necesarias para almacenar
      if (simplifiedQuestion._localFile) {
        delete simplifiedQuestion._localFile;
      }
      
      return simplifiedQuestion;
    });

    console.log('Creating record in Airtable...')
    console.log('Using table:', process.env.AIRTABLE_TABLE_NAME)
    
    try {
      console.log('Attempting to create record in Airtable...')
      
      // Usar nombres de campos exactos de Airtable
      const recordData = {
        fields: {
          [FIELDS.NAME]: testToSave.name,
          [FIELDS.DESCRIPTION]: testToSave.description,
          [FIELDS.QUESTIONS]: JSON.stringify(simplifiedQuestions),
          [FIELDS.MAX_SCORE]: testToSave.maxScore,
          [FIELDS.MIN_SCORE]: testToSave.minScore,
          [FIELDS.PASSING_MESSAGE]: testToSave.passingMessage,
          [FIELDS.FAILING_MESSAGE]: testToSave.failingMessage
        }
      }
      
      // Asegurémonos de que las preguntas están formateadas correctamente
      try {
        // Verificar que todas las preguntas tengan una imagen válida
        const hasInvalidImages = simplifiedQuestions.some(q => !q.image || q.image === '');
        if (hasInvalidImages) {
          console.warn('Hay preguntas sin imágenes o con imágenes inválidas');
        }
        
        console.log('Sample question data:', JSON.stringify(simplifiedQuestions[0], null, 2).substring(0, 500) + '...');
      } catch (parseError) {
        console.error('Error al procesar las preguntas:', parseError);
      }
      
      console.log('Record data prepared:', recordData)

      const tableName = process.env.AIRTABLE_TABLE_NAME || '';
      const record = await base(tableName).create([recordData])
      console.log('Airtable response:', record)

      const createdRecord = record[0]
      console.log('Created record:', {
        id: createdRecord.id,
        fields: createdRecord.fields
      })

      // Crear un objeto de respuesta con el ID de Airtable y los datos del test
      // Devolvemos las preguntas originales, no las simplificadas
      const responseData = {
        ...testToSave,
        id: createdRecord.id // Reemplazar el ID original con el de Airtable
      }

      console.log('Returning response data with fields:', Object.keys(responseData))
      return NextResponse.json(responseData)

    } catch (airtableError: any) {
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
    const tableName = process.env.AIRTABLE_TABLE_NAME || '';
    const records = await base(tableName)
      .select()
      .all()

    const tests = records.map(record => {
      // Parsear las preguntas
      const questionsString = record.fields[FIELDS.QUESTIONS] as string;
      let questions = [];
      
      try {
        questions = JSON.parse(questionsString || '[]');
        
        // Procesar las referencias a imágenes
        questions = questions.map((question: Question) => {
          // Si la imagen es una referencia (image_reference_), reemplazarla con una URL completa de base64
          // Esto se hace temporalmente hasta que podamos cargar la imagen real
          if (question.image && question.image.startsWith('image_reference_')) {
            // Usar un pixel base64 transparente como placeholder
            const placeholderBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
            
            return {
              ...question,
              image: placeholderBase64, 
              isImageReference: true, // Marcar para saber que es una referencia
              imageReference: question.image // Guardar la referencia original
            };
          }
          
          return question;
        });
      } catch (error) {
        console.error('Error parsing questions:', error);
        questions = [];
      }

      return {
        id: record.id,
        name: record.fields[FIELDS.NAME],
        description: record.fields[FIELDS.DESCRIPTION],
        questions: questions,
        maxScore: record.fields[FIELDS.MAX_SCORE],
        minScore: record.fields[FIELDS.MIN_SCORE],
        passingMessage: record.fields[FIELDS.PASSING_MESSAGE],
        failingMessage: record.fields[FIELDS.FAILING_MESSAGE]
      };
    });

    return NextResponse.json({ tests })

  } catch (error) {
    console.error('Error fetching tests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tests' },
      { status: 500 }
    )
  }
} 