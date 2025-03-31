import { useState } from 'react'
import type { Question } from '@/types/questions'

export function useQuestion(initialQuestion: Question) {
  const [question, setQuestion] = useState(initialQuestion)
  const [answer, setAnswer] = useState<any>(null)
  const [isAnswered, setIsAnswered] = useState(false)

  const handleAnswer = (value: any) => {
    setAnswer(value)
    setIsAnswered(true)
  }

  const reset = () => {
    setAnswer(null)
    setIsAnswered(false)
  }

  return {
    question,
    answer,
    isAnswered,
    handleAnswer,
    reset
  }
} 