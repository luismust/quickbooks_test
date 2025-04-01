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
      };
      
      // Manejar las imágenes según su tipo
      if (q.image) {
        // Si es una imagen base64, guardar una referencia
        if (q.image.startsWith('data:')) {
          simplifiedQuestion.image = `image_reference_${q.id}`;
          // Aquí también podríamos guardar la imagen base64 en otro campo o tabla si fuera necesario
        } 
        // Si es una blob URL, tratar de usar el _localFile que es más persistente o una referencia
        else if (q.image.startsWith('blob:')) {
          console.log('Converting blob URL to reference for question:', q.id);
          
          // Si tenemos un _localFile disponible, usarlo (ya debería ser base64)
          if (q._localFile) {
            console.log('Using _localFile for blob URL');
            simplifiedQuestion.image = `image_reference_${q.id}`;
          } else {
            console.log('No _localFile available, using reference');
            simplifiedQuestion.image = `image_reference_${q.id}`;
          }
        }
        // Otros tipos de URL (http, https, etc.)
        else {
          simplifiedQuestion.image = q.image;
        }
      }
      
      // Almacenar el archivo base64 en un campo separado si existe
      if (q._localFile) {
        // Esto sería útil para reconstruir la imagen desde Airtable
        (simplifiedQuestion as any)._imageData = q._localFile;
      }
      
      // Eliminar propiedades temporales que no son necesarias para almacenar
      if ('_localFile' in simplifiedQuestion) {
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
    console.log('GET: Fetching records from table:', tableName);
    const records = await base(tableName)
      .select()
      .all()

    console.log('GET: Retrieved', records.length, 'records from Airtable');
    
    const tests = records.map(record => {
      // Parsear las preguntas
      const questionsString = record.fields[FIELDS.QUESTIONS] as string;
      let questions = [];
      
      try {
        console.log('GET: Parsing questions for test:', record.id);
        questions = JSON.parse(questionsString || '[]');
        
        // Procesar las referencias a imágenes
        questions = questions.map((question: Question) => {
          console.log('API GET: Processing question image:', 
                    question.image?.substring(0, 30) || 'no image');
          
          // Si no hay imagen, no hacer nada
          if (!question.image) {
            return question;
          }
          
          // Si tenemos datos de imagen almacenados, usarlos (para referencias y blobs)
          if ((question as any)._imageData) {
            console.log('API GET: Found image data, using it directly');
            return {
              ...question,
              image: (question as any)._imageData
            };
          }
          
          // Mantener las imágenes base64 tal como están
          if (question.image.startsWith('data:image/')) {
            console.log('API GET: Keeping base64 image as is');
            return question;
          }
          
          // Si la imagen es una referencia a Airtable, hacer las conversiones necesarias
          if (question.image.includes('api.airtable.com') || question.image.includes('airtable.com')) {
            // Si ya es una URL completa, mantenerla
            if (question.image.startsWith('http')) {
              return question;
            }
            
            // Convertir URLs relativas a absolutas
            console.log('API GET: Converting relative Airtable URL to absolute');
            return {
              ...question,
              image: `https://api.airtable.com/${question.image.replace(/^\/+/, '')}`
            };
          }
          
          // Si la imagen es una referencia interna pero no tenemos datos de imagen,
          // usaremos un placeholder o podríamos intentar buscar en otro lugar
          if (question.image.startsWith('image_reference_')) {
            console.log('API GET: No image data for reference, using placeholder');
            return {
              ...question,
              isImageReference: true,
              imageReference: question.image,
              // Aquí podríamos buscar la imagen en otro lugar si fuera necesario
              // Por ahora, usamos un placeholder base64 simple
              image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAMAAABHPGVmAAAA21BMVEUAAAD///+/v7+ZmZmqqqqZmZmfn5+dnZ2ampqcnJycnJybm5ubm5uampqampqampqampqbm5uampqampqbm5uampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqamp///+YmJiZmZmampqbm5ucnJydnZ2enp6fnp6fn5+gn5+gn6CgoKChoKChoaGioaGioqKjoqKjo6Ojo6SkpKSlpaWmpqanp6eoqKiqqqpTU1MAAAB8A5ZEAAAARnRSTlMAAQIEBQUGBwcLDBMUFRYaGxwdNjxRVVhdYGRnaWptcXV2eHp7fX5/gISGiImKjI2OkJKTlZebnKCio6Slqq+2uL6/xdDfsgWO3gAAAWhJREFUeNrt1sdSwzAUBVAlkRJaGi33il2CYNvpvZP//6OEBVmWM+PIGlbhncWTcbzwNNb1ZwC8mqDZMaENiXBJVGsCE5KUKbE1GZNURlvLjfUTjC17JNvbgYzUW3qpKxJllJYwKyIw0mSsCRlWBkLhDGTJGE3WEF3KEnGdJYRGlrqKtJEn1A0hWp4w1xBNnlA3kFg5wlzD2o0M4a4j0jJEXEciZQh3A9HkCHMD0fOEuI7IyhGxhojyhLiG6HlCXUdYOcLdRER5Qt1AJDnC3MQ6ZQhxHWvJEu4GIsoR6jrWljKEu4VlP9eMeS5wt5CWpV2WNKqUlPMdKo7oa4jEd2qoqM1DpwVGWp0jmqd+7JQYa/oqsnQ4EfWdSsea8O/yCTgc/3FMSLnUwA8xJhQq44HQB1zySOBCZx8Y3H4mJF8XOJTEBELr8IfzXECYf+fQJ0LO16JvRA5PCK92GMP/FIB3YUC2pHrS/6AAAAAASUVORK5CYII='
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

    console.log('API GET: Returning', tests.length, 'tests');
    return NextResponse.json({ tests })

  } catch (error) {
    console.error('Error fetching tests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tests' },
      { status: 500 }
    )
  }
} 