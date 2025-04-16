"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface OpenQuestionEditorProps {
  question: string
  answer: string
  onChange: (data: { question: string; answer: string }) => void
}

export function OpenQuestionEditor({ 
  question, 
  answer, 
  onChange 
}: OpenQuestionEditorProps) {

  const handleQuestionChange = (newQuestion: string) => {
    onChange({
      question: newQuestion,
      answer
    });
  };

  const handleAnswerChange = (newAnswer: string) => {
    onChange({
      question,
      answer: newAnswer
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-2">
            Question
          </Label>
          <Textarea
            placeholder="Write the question that requires a text-based answer..."
            value={question}
            onChange={(e) => handleQuestionChange(e.target.value)}
            className="min-h-[100px] mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            The student will provide a written answer to this question.
          </p>
        </div>

        <div className="mt-4">
          <Label className="text-sm font-medium mb-2">
            Correct answer (reference)
          </Label>
          <Textarea
            placeholder="Write a reference answer for this question..."
            value={answer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            className="min-h-[150px] mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            This answer will be used to compare with the student's response. The system will check for semantic similarity, not exact matching.
          </p>
        </div>
      </div>

      <Card className="p-4 bg-muted border-dashed mt-6">
        <h3 className="text-sm font-medium mb-2">About Open Questions</h3>
        <p className="text-sm text-muted-foreground">
          Open questions allow students to provide a text-based answer. The system will use basic semantic matching to evaluate correctness.
          For best results, provide a comprehensive reference answer that contains all key points that should be included.
        </p>
      </Card>
    </div>
  )
} 