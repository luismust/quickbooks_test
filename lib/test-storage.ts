"use client"

export interface Area {
  id: string
  shape: "rect" | "circle" | "poly"
  coords: number[]
  isCorrect: boolean
}

export interface Question {
  id: number
  title: string
  description: string
  question: string
  image: string
  areas: Area[]
  scoring: {
    correct: number    // Puntos al acertar
    incorrect: number  // Puntos que se pierden al fallar
    retain: number     // Puntos que se mantienen al fallar
  }
}

export interface Test {
  id: string
  name: string
  description: string
  questions: Question[]
  maxScore: number     // Puntuación máxima del test
  minScore: number     // Puntuación mínima para aprobar
  passingMessage?: string  // Mensaje cuando aprueba
  failingMessage?: string  // Mensaje cuando no aprueba
}

export const validateTest = (test: Test): boolean => {
  try {
    if (!test.name || typeof test.name !== 'string') return false
    if (!test.description || typeof test.description !== 'string') return false
    if (!Array.isArray(test.questions)) return false

    for (const question of test.questions) {
      if (!question.id || typeof question.id !== 'number') return false
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

export const saveTest = (test: Test) => {
  if (typeof window === 'undefined') return

  const tests = JSON.parse(localStorage.getItem('saved-tests') || '[]')
  
  // Si el test ya existe, actualizarlo
  const existingIndex = tests.findIndex((t: Test) => t.id === test.id)
  if (existingIndex >= 0) {
    tests[existingIndex] = test
  } else {
    tests.push(test)
  }
  
  localStorage.setItem('saved-tests', JSON.stringify(tests))
}

export const loadTest = (testId: string): Test | null => {
  if (typeof window === 'undefined') return null

  const tests = JSON.parse(localStorage.getItem('saved-tests') || '[]')
  return tests.find((t: Test) => t.id === testId) || null
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