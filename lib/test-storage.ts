"use client"

import { uploadImageToAirtable, deleteTestImages } from './airtable-utils'

export interface Area {
  id: string
  shape: "rect" | "circle" | "poly"
  coords: number[]
  isCorrect: boolean
  x?: number
  y?: number
  width?: number
  height?: number
}

export interface DragItem {
  id: string
  text: string
  order: number
  correctZone: string
}

export interface SequenceItem {
  id: string
  text: string
  order: number
}

export interface Question {
  id: string
  title: string
  description: string
  question: string
  image?: string
  originalImage?: string
  _localFile?: File | string   // Puede ser un objeto File o una string base64
  _imageData?: string          // Para almacenar datos base64 de la imagen
  isImageReference?: boolean   // Indica si la imagen es una referencia
  imageReference?: string      // Guarda la referencia original a la imagen
  type: 'clickArea' |
  'multipleChoice' |
  'dragAndDrop' |
  'sequence' |
  'pointAPoint' |
  'openQuestion' |
  'identifyErrors' |
  'phraseComplete' |
  'trueOrFalse' |
  'imageDescription' |
  'imageComparison' |
  'imageError' |
  'imageHotspots' |
  'imageSequence'
  areas?: Area[]
  options?: {
    id: string
    text: string
    isCorrect: boolean
  }[]
  correctAnswer?: boolean
  items?: DragItem[]
  sequence?: SequenceItem[]
  points?: {
    id: string
    text: string
    type: 'left' | 'right'
    correctMatch?: string
  }[]
  scoring: {
    correct: number
    incorrect: number
    retain: number
  }
}

export interface Test {
  id: string
  name: string
  description: string
  questions: Question[]
  maxScore: number     // Puntuación máxima del test
  minScore: number     // Puntuación mínima para aprobar
  passingMessage: string  // Mensaje cuando aprueba
  failingMessage: string  // Mensaje cuando no aprueba
}

export const validateTest = (test: Test): boolean => {
  try {
    if (!test.name || typeof test.name !== 'string') return false
    if (!test.description || typeof test.description !== 'string') return false
    if (!Array.isArray(test.questions)) return false

    for (const question of test.questions) {
      if (!question.id || typeof question.id !== 'string') return false
      if (!question.title || typeof question.title !== 'string') return false
      if (!question.description || typeof question.description !== 'string') return false
      if (!question.question || typeof question.question !== 'string') return false
      if (!question.image || typeof question.image !== 'string') return false
      if (!Array.isArray(question.areas)) return false

      for (const area of question.areas) {
        if (!area.id || typeof area.id !== 'string') return false
        if (area.shape !== 'rect') return false
        if (!Array.isArray(area.coords) || area.coords.length !== 4) return false
        if (typeof area.isCorrect !== 'boolean') return false
      }
    }

    // Validar que las imágenes sean URLs
    const hasValidImages = test.questions.every(question => {
      return question.image ? true : false
    })

    if (!hasValidImages) {
      console.error('Todas las preguntas deben tener imágenes válidas')
      return false
    }

    return true
  } catch {
    return false
  }
}

export async function saveTest(test: Test): Promise<Test> {
  try {
    console.log('Starting saveTest function')

    // Detectar si estamos en Vercel/producción (forzar a true en entorno desplegado)
    const isVercel = true; // Siempre usaremos la URL externa en la build de producción

    // URL base del API
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickbooks-backend.vercel.app/api';

    // Procesamos las preguntas para asegurar la persistencia de las imágenes
    const processedQuestions = test.questions.map(question => {
      // Crear una versión limpia de la pregunta
      const cleanQuestion = { ...question };

      // Manejar las imágenes según su formato
      if (question.image) {
        // Si es una URL blob y tenemos un _localFile que es string (base64), usarlo
        if (
          question.image.startsWith('blob:') &&
          question._localFile &&
          typeof question._localFile === 'string' &&
          question._localFile.startsWith('data:')
        ) {
          console.log('Found blob URL with string _localFile, using it');
          cleanQuestion.image = question._localFile;
        }

        // Si la imagen ya es base64, mantenerla
        if (question.image.startsWith('data:')) {
          console.log('Image is already base64, keeping it');
          // Asegurar que tenemos una copia en _imageData
          (cleanQuestion as any)._imageData = question.image;
        }
      }

      // Guardar específicamente el campo _imageData para recuperarlo más tarde
      // solo si _localFile es un string (base64)
      if (question._localFile && typeof question._localFile === 'string') {
        if (question._localFile.startsWith('data:')) {
          (cleanQuestion as any)._imageData = question._localFile;
        }
      }

      // Eliminar la referencia al archivo File que no podemos enviar a la API
      // o cualquier _localFile que no sea útil
      delete cleanQuestion._localFile;

      return cleanQuestion;
    });

    // Preparar datos para Airtable
    const testData = {
      id: test.id, // Incluir el ID si existe
      name: test.name,
      description: test.description,
      questions: processedQuestions, // Enviamos el objeto con las imágenes procesadas
      maxScore: test.maxScore,
      minScore: test.minScore,
      passingMessage: test.passingMessage,
      failingMessage: test.failingMessage
    }

    console.log('Sending test data to API:', {
      id: testData.id,
      name: testData.name,
      questionsCount: testData.questions.length
    })

    // URL del endpoint a usar
    //const apiUrl = isVercel 
    //  ? `${API_BASE_URL}/tests`  // La URL ya incluye /api/ en API_BASE_URL
    //  : '/api/tests';  // URL local en desarrollo

    // URL endpoint simple de prueba
    //const apiUrl = isVercel 
    //  ? `${API_BASE_URL}/tests-simple` 
    //  : '/api/tests-simple';  

    // URL endpoint de depuracion
    const apiUrl = isVercel
      ? `${API_BASE_URL}/debug-post`  // Usa el endpoint de depuración detallada
      : '/api/debug-post';

    // Guardar en Airtable a través del endpoint correspondiente
    const response = await fetch(apiUrl, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('API error response:', errorData)
      throw new Error(`Failed to save test: ${errorData.error || response.statusText}`)
    }

    // En la función saveTest, justo después de recibir la respuesta
    const savedTest = await response.json();

    // Verificar y arreglar el ID si es necesario
    if (!savedTest || typeof savedTest.id !== 'string' || !savedTest.id) {
      console.warn('API response missing valid ID, generating temporary ID');
      // Generar un ID temporal compatible con el formato esperado
      const tempId = '_temp_' + Date.now();
      savedTest.id = tempId;
    }

    // Asegúrate de que el ID tenga el formato correcto (empezando con _)
    if (!savedTest.id.startsWith('_')) {
      savedTest.id = '_' + savedTest.id;
    }

    console.log('Test saved successfully with ID:', savedTest.id);
    // También guardamos en localStorage para tener una copia local
    try {
      const savedTests = localStorage.getItem('quickbook_tests') || '[]'
      const localTests = JSON.parse(savedTests) as Test[]

      // Actualizar o añadir el test
      const existingIndex = localTests.findIndex(t => t.id === savedTest.id)
      if (existingIndex >= 0) {
        localTests[existingIndex] = savedTest
      } else {
        localTests.push(savedTest)
      }

      // Guardar de vuelta en localStorage
      localStorage.setItem('quickbook_tests', JSON.stringify(localTests))
    } catch (e) {
      console.error('Error saving local copy:', e)
    }

    return savedTest;
  } catch (error) {
    console.error('Error saving test:', error)
    throw error
  }
}

export async function getTests(): Promise<Test[]> {
  try {
    console.log('Starting getTests function')

    // Detectar si estamos en Vercel/producción (forzar a true en entorno desplegado)
    const isVercel = true; // Siempre usaremos la URL externa en la build de producción

    // URL base del API
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickbooks-backend.vercel.app/api';

    // URL del endpoint a usar
    const apiUrl = isVercel
      ? `${API_BASE_URL}/tests`  // La URL ya incluye /api/ en API_BASE_URL
      : '/api/tests';  // URL local en desarrollo

    console.log('Fetching tests from API:', apiUrl)
    const response = await fetch(apiUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch tests')
    }

    const { tests } = await response.json()

    // Verificar la estructura de los datos recibidos
    console.log('Retrieved tests:', tests.length)
    if (tests.length > 0) {
      console.log('Sample test fields:', Object.keys(tests[0]))
    }

    // Procesar las imágenes en cada test
    const processedTests = tests.map((test: Test) => {
      // Procesar cada pregunta para verificar las imágenes
      const processedQuestions = test.questions.map((question: Question) => {
        // Crear un objeto limpio
        const cleanQuestion = { ...question };

        // Si tenemos _imageData, usarlo como imagen principal
        if (question._imageData && typeof question._imageData === 'string' &&
          question._imageData.startsWith('data:')) {
          console.log('Found _imageData, using it as main image');
          cleanQuestion.image = question._imageData;
        }

        // Si la imagen es una referencia y no tenemos _imageData, intentar con placeholder
        if (question.isImageReference &&
          (!question._imageData ||
            typeof question._imageData !== 'string' ||
            !question._imageData.startsWith('data:'))) {
          console.log('Reference image without _imageData, using placeholder');
          // Usar un placeholder o podríamos buscar la imagen en otro lugar
        }

        return cleanQuestion;
      });

      return {
        ...test,
        questions: processedQuestions
      };
    });

    // También guardamos en localStorage para tener una copia local
    try {
      localStorage.setItem('quickbook_tests', JSON.stringify(processedTests))
    } catch (e) {
      console.error('Error saving local copy:', e)
    }

    return processedTests;

  } catch (error) {
    console.error('Error in getTests:', error)

    // Si hay un error, intentar devolver los tests desde localStorage
    try {
      const savedTests = localStorage.getItem('quickbook_tests') || '[]'
      const localTests = JSON.parse(savedTests) as Test[]
      console.log('Returning tests from localStorage as fallback:', localTests.length)
      return localTests
    } catch (e) {
      console.error('Error reading from localStorage:', e)
      return []
    }
  }
}

export const loadTest = (testId: string): Test | null => {
  try {
    if (typeof window === "undefined") return null

    const tests = JSON.parse(localStorage.getItem('saved-tests') || '[]')
    const test = tests.find((t: Test) => t.id === testId)

    if (!test) {
      console.log('Test no encontrado:', testId)
      console.log('Tests disponibles:', tests)
      return null
    }

    return test
  } catch (error) {
    console.error('Error cargando test:', error)
    return null
  }
}

export const loadTests = (): Test[] => {
  if (typeof window === 'undefined') return []

  return JSON.parse(localStorage.getItem('saved-tests') || '[]')
}

export const exportTest = (test: Test): string => {
  return JSON.stringify(test, null, 2)
}

export const downloadExampleTemplate = () => {
  // ... implementación
}

export function generateId(prefix: string = ''): string {
  if (prefix) {
    return `${prefix}_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const deleteTest = async (testId: string): Promise<boolean> => {
  try {
    // Detectar si estamos en Vercel/producción (forzar a true en entorno desplegado)
    const isVercel = true; // Siempre usaremos la URL externa en la build de producción

    // URL base del API
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickbooks-backend.vercel.app/api';

    // Eliminar imágenes de Airtable
    if (!isVercel) {
      await deleteTestImages(testId)
    }

    // URL del endpoint a usar
    const apiUrl = isVercel
      ? `${API_BASE_URL}/tests/${testId}`  // La URL ya incluye /api/ en API_BASE_URL
      : `/api/tests/${testId}`;  // URL local en desarrollo

    const response = await fetch(apiUrl, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to delete test')
    }

    // También eliminamos de localStorage
    try {
      const savedTests = localStorage.getItem('quickbook_tests') || '[]'
      const localTests = JSON.parse(savedTests) as Test[]
      const filteredTests = localTests.filter(t => t.id !== testId)
      localStorage.setItem('quickbook_tests', JSON.stringify(filteredTests))
    } catch (e) {
      console.error('Error removing from localStorage:', e)
    }

    return true
  } catch (error) {
    console.error('Error deleting test:', error)
    return false
  }
} 