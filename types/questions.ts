export interface SequenceImage {
  id: string
  url: string
  order: number
  description: string
}

export interface Question {
  id: string
  type: 'clickArea' | 'multipleChoice' | 'dragAndDrop' | 'sequence' | 'pointAPoint' | 'identifyErrors' | 'trueOrFalse' | 'imageSequence'
  title: string
  description: string
  question: string
  image?: string
  images?: SequenceImage[] // Para el tipo imageSequence
  scoring?: {
    correct: number
    incorrect: number
    retain: number
  }
  // ... otros campos específicos por tipo
}

export interface Test {
  id: string
  name: string
  description: string
  questions: Question[]
  maxScore: number
  minScore: number
  passingMessage: string
  failingMessage: string
} 