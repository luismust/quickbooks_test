"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"

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
              placeholder="Enter a question like 'Fix the errors in this code'"
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
        // Modo vista/test (no debería usarse en el editor)
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p>Este componente solo debe utilizarse en modo edición</p>
        </div>
      )}
    </div>
  )
} 