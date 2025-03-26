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

export interface Question {
  id: number
  title: string
  description: string
  question: string
  image: string
  originalImage?: string // URL original antes de procesar
  areas: Area[]
  scoring: {
    correct: number    // Points when correct
    incorrect: number  // Points lost when incorrect
    retain: number     // Points retained when incorrect
  }
}

export interface Test {
  id: string
  name: string
  description: string
  questions: Question[]
  maxScore: number     // Maximum test score
  minScore: number     // Minimum score to pass
  passingMessage?: string  // Message when passing
  failingMessage?: string  // Message when failing
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

    // Validate image URLs
    const hasValidImages = test.questions.every(question => {
      if (!question.image) return false
      if (question.image.includes('drive.google.com')) {
        return question.image.includes('/file/d/') && question.image.includes('/view')
      }
      return true
    })

    if (!hasValidImages) {
      console.error('Image URLs must be valid and public in Google Drive')
      return false
    }

    return true
  } catch {
    return false
  }
}

export const saveTest = (test: Test): boolean => {
  try {
    const tests = JSON.parse(localStorage.getItem('saved-tests') || '[]');
    const existingIndex = tests.findIndex((t: Test) => t.id === test.id);
    
    if (existingIndex >= 0) {
      tests[existingIndex] = test;
    } else {
      tests.push(test);
    }
    
    localStorage.setItem('saved-tests', JSON.stringify(tests));
    return true;
  } catch (error) {
    console.error('Error saving test:', error);
    return false;
  }
};

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
  // ... implementation
} 