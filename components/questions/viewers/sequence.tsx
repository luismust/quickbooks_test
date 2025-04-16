"use client"

import React, { useState, useEffect } from 'react'
import { motion, Reorder } from "framer-motion"
import { GripVertical, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface SequenceItem {
  id: string
  text: string
  order: number
}

interface SequenceProps {
  question: string
  answer: SequenceItem[]
  isEditMode?: boolean
  onAnswerSubmit?: (isCorrect: boolean) => void
}

export function Sequence({ question, answer, isEditMode = false, onAnswerSubmit }: SequenceProps) {
  const [userSequence, setUserSequence] = useState<SequenceItem[]>([])
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  // Initialize user sequence with shuffled items on mount
  useEffect(() => {
    if (!isEditMode && answer) {
      const shuffled = [...answer]
        .sort(() => Math.random() - 0.5)
        .map((item, idx) => ({ ...item, order: idx }))
      setUserSequence(shuffled)
    }
  }, [answer, isEditMode])

  // Check if the user's sequence matches the correct sequence
  const checkAnswer = () => {
    if (!answer || !userSequence) return false
    
    const isCorrectSequence = userSequence.every((item, index) => {
      const correctItem = answer.find(a => a.id === item.id)
      return correctItem && correctItem.order === index
    })
    
    setIsCorrect(isCorrectSequence)
    setHasSubmitted(true)
    
    if (onAnswerSubmit) {
      onAnswerSubmit(isCorrectSequence)
    }
    
    if (isCorrectSequence) {
      toast.success("Correct! The sequence is in the right order.")
    } else {
      toast.error("Incorrect. Try rearranging the sequence.")
    }
    
    return isCorrectSequence
  }

  const handleReorder = (reorderedItems: SequenceItem[]) => {
    // Update the order after reordering
    const updatedSequence = reorderedItems.map((item, index) => ({
      ...item,
      order: index
    }))
    setUserSequence(updatedSequence)
  }

  // Reset the user's submission
  const handleReset = () => {
    const shuffled = [...answer]
      .sort(() => Math.random() - 0.5)
      .map((item, idx) => ({ ...item, order: idx }))
    setUserSequence(shuffled)
    setHasSubmitted(false)
    setIsCorrect(false)
  }

  if (isEditMode) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">This component should only be used in test mode</p>
        <p className="text-xs text-muted-foreground">Use the sequence editor component for editing</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-base font-medium">{question}</h3>
        
        <div className="text-sm text-muted-foreground mb-4">
          Arrange the items in the correct sequence by dragging them.
        </div>
        
        <Reorder.Group
          axis="y"
          values={userSequence}
          onReorder={handleReorder}
          className="space-y-2"
          disabled={hasSubmitted}
        >
          {userSequence.map((item) => (
            <Reorder.Item
              key={item.id}
              value={item}
              className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                hasSubmitted 
                  ? answer.find(a => a.id === item.id)?.order === item.order
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                  : "bg-card hover:bg-accent"
              }`}
            >
              <div className="flex items-center gap-2 bg-muted px-2 py-1 rounded text-sm">
                <GripVertical className={`h-4 w-4 text-muted-foreground ${hasSubmitted ? 'cursor-not-allowed' : 'cursor-move'}`} />
                <span className="font-mono">{item.order + 1}</span>
              </div>
              
              <span className="flex-1">{item.text}</span>
              
              {hasSubmitted && (
                answer.find(a => a.id === item.id)?.order === item.order
                  ? <Check className="h-4 w-4 text-green-500" />
                  : <X className="h-4 w-4 text-red-500" />
              )}
            </Reorder.Item>
          ))}
        </Reorder.Group>
        
        <div className="flex justify-end space-x-2 mt-4">
          {hasSubmitted ? (
            <Button onClick={handleReset} variant="outline">
              Try Again
            </Button>
          ) : (
            <Button onClick={checkAnswer} variant="default">
              Submit Answer
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 