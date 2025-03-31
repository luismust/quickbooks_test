"use client"

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

    // Validar URLs de imágenes
    const hasValidImages = test.questions.every(question => {
      if (!question.image) return false
      if (question.image.includes('drive.google.com')) {
        return question.image.includes('/file/d/') && question.image.includes('/view')
      }
      return true
    })

    if (!hasValidImages) {
      console.error('Las URLs de las imágenes deben ser válidas y públicas en Google Drive')
      return false
    }

    return true
  } catch {
    return false
  }
}

export async function saveTest(test: Test): Promise<Test> {
  try {
    console.log('=== Client: Starting saveTest ===')
    console.log('Test data to save:', {
      id: test.id,
      name: test.name,
      description: test.description,
      questionsCount: test.questions?.length,
      maxScore: test.maxScore,
      minScore: test.minScore
    })

    // Limpiar los datos antes de enviar
    const cleanedTest = {
      ...test,
      questions: test.questions.map(q => {
        // Limpiar campos temporales o circulares
        const { _localFile, ...cleanQuestion } = q as any
        return {
          ...cleanQuestion,
          // Limpiar la imagen si es blob
          image: q.image?.startsWith('blob:') ? '' : q.image,
          // Asegurarnos de que las áreas sean serializables
          areas: (q.areas || []).map(area => ({
            id: area.id,
            shape: area.shape,
            coords: area.coords,
            isCorrect: area.isCorrect
          }))
        }
      })
    }

    console.log('Cleaned test data:', {
      id: cleanedTest.id,
      name: cleanedTest.name,
      description: cleanedTest.description,
      questionsCount: cleanedTest.questions.length
    })

    const response = await fetch('/api/tests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanedTest)
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Server error response:', errorData)
      throw new Error(errorData.error || 'Failed to save test')
    }

    const savedTest = await response.json()
    console.log('Test saved successfully:', {
      id: savedTest.id,
      name: savedTest.name,
      description: savedTest.description,
      questionsCount: savedTest.questions?.length
    })

    return savedTest

  } catch (error) {
    console.error('Error saving test:', error)
    throw error
  }
}

export async function getTests(): Promise<Test[]> {
  try {
    const response = await fetch('/api/tests')
    if (!response.ok) {
      throw new Error('Failed to fetch tests')
    }

    const { tests } = await response.json()
    return tests

  } catch (error) {
    console.error('Error in getTests:', error)
    return []
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
    if (typeof window === 'undefined') return false;
    
    const tests = JSON.parse(localStorage.getItem('saved-tests') || '[]');
    const filteredTests = tests.filter((t: Test) => t.id !== testId);
    
    localStorage.setItem('saved-tests', JSON.stringify(filteredTests));
    return true;
  } catch (error) {
    console.error('Error deleting test:', error);
    return false;
  }
}; 