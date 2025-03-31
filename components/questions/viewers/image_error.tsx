"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageErrorProps {
  imageUrl: string
  question: string
  errors: string[]
  onAnswer: (foundErrors: string[]) => void
  isAnswered?: boolean
  correctAnswers?: string[]
}

export function ImageError({ 
  imageUrl, 
  question, 
  errors, 
  onAnswer, 
  isAnswered = false,
  correctAnswers = []
}: ImageErrorProps) {
  const [foundErrors, setFoundErrors] = useState<string[]>([])
  const [currentError, setCurrentError] = useState("")

  const handleAddError = () => {
    if (currentError.trim() && !isAnswered) {
      setFoundErrors([...foundErrors, currentError.trim()])
      setCurrentError("")
      onAnswer([...foundErrors, currentError.trim()])
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium">{question}</p>
      
      <div className="relative aspect-video rounded-lg overflow-hidden">
        <img
          src={imageUrl}
          alt="Question image"
          className="object-cover w-full h-full"
        />
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type an error you found..."
            value={currentError}
            onChange={(e) => setCurrentError(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddError()}
            disabled={isAnswered}
          />
          <Button
            onClick={handleAddError}
            disabled={isAnswered || !currentError.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {foundErrors.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium">Found errors:</p>
            {foundErrors.map((error, index) => (
              <div 
                key={index}
                className={cn(
                  "p-2 rounded-lg border",
                  isAnswered && correctAnswers.includes(error) && "bg-green-100 border-green-500",
                  isAnswered && !correctAnswers.includes(error) && "bg-red-100 border-red-500"
                )}
              >
                {error}
              </div>
            ))}
          </div>
        )}

        {isAnswered && (
          <div className="space-y-2">
            <p className="font-medium text-green-600">Correct errors:</p>
            {correctAnswers.map((error, index) => (
              <div 
                key={index}
                className="p-2 rounded-lg border border-green-500 bg-green-100"
              >
                {error}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 