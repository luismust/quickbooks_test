"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface PhraseCompleteProps {
  question: string
  answer: string
  onAnswerSubmit?: (isCorrect: boolean) => void
  isAnswered?: boolean
  userAnswer?: string
}

export function PhraseComplete({
  question,
  answer,
  onAnswerSubmit,
  isAnswered = false,
  userAnswer = "",
}: PhraseCompleteProps) {
  const [userInput, setUserInput] = useState(userAnswer || "")
  const [showResult, setShowResult] = useState(isAnswered)
  const [isCorrect, setIsCorrect] = useState(false)
  const [formattedQuestion, setFormattedQuestion] = useState("")
  
  useEffect(() => {
    if (isAnswered) {
      setShowResult(true)
      checkAnswer(userAnswer)
    }
  }, [isAnswered, userAnswer])

  useEffect(() => {
    if (question) {
      setFormattedQuestion(question.replace(/___(.*?)___/g, '___'));
    }
  }, [question]);

  // Format question for display, replacing blanks with input or correct answer
  const formatQuestion = () => {
    if (!question) return <p>No question provided</p>

    // For display purposes only
    const parts = question.split("___")
    
    if (parts.length === 1) {
      return <p>{question}</p>
    }

    if (showResult) {
      return (
        <p>
          {parts[0]}
          <span className={cn(
            "px-2 py-0.5 rounded font-medium",
            isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          )}>
            {isCorrect ? answer : userInput}
            {!isCorrect && (
              <span className="text-xs ml-1 text-muted-foreground"> 
                (correct: {answer})
              </span>
            )}
          </span>
          {parts[1]}
        </p>
      )
    }

    return (
      <p>
        {parts[0]}
        <Input
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="inline-block w-auto min-w-[150px] mx-1"
          placeholder="Type your answer"
        />
        {parts[1]}
      </p>
    )
  }

  // Check if the user's answer matches the correct answer
  const checkAnswer = (inputToCheck = userInput) => {
    const userClean = inputToCheck.trim().toLowerCase()
    const answerClean = answer.trim().toLowerCase()
    
    // Check for exact match
    const exactMatch = userClean === answerClean
    
    // Check for close match (ignoring punctuation and case)
    const closeMatch = userClean.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") === 
                      answerClean.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    
    const isCorrect = exactMatch || closeMatch
    setIsCorrect(isCorrect)
    return isCorrect
  }

  const handleSubmit = () => {
    if (!userInput.trim()) {
      toast.warning("Please enter an answer")
      return
    }

    const result = checkAnswer()
    setShowResult(true)
    
    if (result) {
      toast.success("Correct answer!")
    } else {
      toast.error("Not quite right. Try again!")
    }

    if (onAnswerSubmit) {
      onAnswerSubmit(result)
    }
  }

  const handleReset = () => {
    setUserInput("")
    setShowResult(false)
    setIsCorrect(false)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {formatQuestion()}
      </div>

      {!showResult ? (
        <Button onClick={handleSubmit}>Submit Answer</Button>
      ) : (
        <div className="flex items-center space-x-2">
          {isCorrect ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="mr-1 h-5 w-5" />
              <span>Correct!</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600">
              <XCircle className="mr-1 h-5 w-5" />
              <span>Incorrect</span>
            </div>
          )}
          
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="ml-auto"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  )
}
