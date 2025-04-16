"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface PhraseCompleteEditorProps {
  question: string
  answer: string
  onChange: (data: { question: string; answer: string }) => void
}

export function PhraseCompleteEditor({
  question,
  answer,
  onChange,
}: PhraseCompleteEditorProps) {
  const [preview, setPreview] = useState<string>("")
  const [showWarning, setShowWarning] = useState(false)

  // Format the question to show blank spaces more visibly in the preview
  useEffect(() => {
    if (question) {
      setPreview(question.replace(/___/g, '<span class="bg-yellow-100 px-1 rounded">___</span>'))
      
      // Validate if the question has at least one blank
      setShowWarning(!question.includes("___"))
    }
  }, [question])

  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ question: e.target.value, answer })
  }

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ question, answer: e.target.value })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Incomplete phrase
        </label>
        <Textarea
          placeholder="Write the phrase with ___ to indicate the spaces to complete..."
          value={question}
          onChange={handleQuestionChange}
          className="min-h-[100px]"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Use ___ (three underscores) to indicate where the phrase should be completed
        </p>
      </div>

      {showWarning && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your question doesn't contain any blanks. Please include at least one ___ in your question.
          </AlertDescription>
        </Alert>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">
          Preview
        </label>
        <div 
          className="p-3 border rounded-md bg-slate-50"
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Correct word(s)
        </label>
        <Input
          placeholder="Write the word or phrase that completes correctly..."
          value={answer}
          onChange={handleAnswerChange}
        />
      </div>
    </div>
  )
} 