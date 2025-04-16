"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"

interface IdentifyErrorsProps {
  question: string
  answer: string
  code?: string
  onChange?: (data: { question?: string; answer?: string; code?: string }) => void
  isEditMode?: boolean
}

export function IdentifyErrors({ 
  question, 
  answer, 
  code = "", 
  onChange, 
  isEditMode = true 
}: IdentifyErrorsProps) {
  const [userAnswer, setUserAnswer] = useState("")
  const [showAnswer, setShowAnswer] = useState(false)

  return (
    <div className="space-y-4">
      {isEditMode ? (
        // Modo edición
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Question text
            </label>
            <Textarea
              placeholder="Enter the question..."
              value={question}
              onChange={(e) => onChange?.({ 
                question: e.target.value, 
                answer, 
                code 
              })}
              className="min-h-[100px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Code with errors
            </label>
            <Textarea
              placeholder="Paste here the code with errors..."
              value={code}
              onChange={(e) => onChange?.({ 
                question, 
                answer, 
                code: e.target.value 
              })}
              className="min-h-[200px] font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Corrected code
            </label>
            <Textarea
              placeholder="Paste here the corrected code..."
              value={answer}
              onChange={(e) => onChange?.({ 
                question, 
                answer: e.target.value, 
                code 
              })}
              className="min-h-[200px] font-mono"
            />
          </div>
        </div>
      ) : (
        // Modo vista/test
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="text-sm font-medium mb-4">{question || "Identify and correct the errors in the following code:"}</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code>{code}</code>
            </pre>
            <Textarea
              placeholder="Write the corrected code..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="mt-4 min-h-[200px] font-mono"
            />
          </Card>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowAnswer(!showAnswer)}
            >
              {showAnswer ? "Hide solution" : "Show solution"}
            </Button>
          </div>

          {showAnswer && (
            <Card className="p-4 bg-muted">
              <h4 className="text-sm font-medium mb-2">Solution:</h4>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                <code>{answer}</code>
              </pre>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
