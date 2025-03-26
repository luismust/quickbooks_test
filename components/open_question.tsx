"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"

interface OpenQuestionProps {
  question: string
  answer: string
  onChange?: (data: { question: string; answer: string }) => void
  isEditMode?: boolean
}

export function OpenQuestion({ question, answer, onChange, isEditMode = true }: OpenQuestionProps) {
  const [userAnswer, setUserAnswer] = useState("")
  const [showAnswer, setShowAnswer] = useState(false)

  return (
    <div className="space-y-4">
      {isEditMode ? (
        // Modo edición
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Question
            </label>
            <Textarea
              placeholder="Write the question..."
              value={question}
              onChange={(e) => onChange?.({ question: e.target.value, answer })}
              className="min-h-[100px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Correct answer
            </label>
            <Textarea
              placeholder="Write the correct answer..."
              value={answer}
              onChange={(e) => onChange?.({ question, answer: e.target.value })}
              className="min-h-[100px]"
            />
          </div>
        </div>
      ) : (
        // Modo vista/test
        <div className="space-y-4">
          <Card className="p-4">
            <p className="text-sm font-medium mb-4">{question}</p>
            <Textarea
              placeholder="Write your answer..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="min-h-[100px]"
            />
          </Card>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowAnswer(!showAnswer)}
            >
              {showAnswer ? "Hide answer" : "Show answer"}
            </Button>
          </div>

          {showAnswer && (
            <Card className="p-4 bg-muted">
              <h4 className="text-sm font-medium mb-2">Correct answer:</h4>
              <p className="text-sm">{answer}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
