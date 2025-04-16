"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Reorder } from "framer-motion"
import { GripVertical, RefreshCcw } from "lucide-react"
import { toast } from "sonner"

interface SequenceItem {
  id: string
  text: string
  order: number
}

interface SequenceProps {
  question: string
  answer: SequenceItem[]
  onChange?: (question: string, answer: SequenceItem[]) => void
  isEditMode?: boolean
  onAnswerSubmit?: (isCorrect: boolean) => void
}

export function Sequence({
  question,
  answer,
  onChange,
  isEditMode = false,
  onAnswerSubmit
}: SequenceProps) {
  const [userSequence, setUserSequence] = useState<SequenceItem[]>([])
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Initialize userSequence with shuffled items when not in edit mode
  useEffect(() => {
    if (!isEditMode && answer.length > 0) {
      resetSequence()
    }
  }, [answer, isEditMode])

  const resetSequence = () => {
    // Create a copy and shuffle it
    const shuffled = [...answer]
      .sort(() => Math.random() - 0.5)
      .map((item, index) => ({ ...item, order: index }))
    setUserSequence(shuffled)
    setHasSubmitted(false)
  }

  const handleReorder = (reorderedItems: SequenceItem[]) => {
    // Update order after reordering
    const updatedSequence = reorderedItems.map((item, index) => ({
      ...item,
      order: index
    }))
    setUserSequence(updatedSequence)
  }

  const checkAnswer = () => {
    // Check if user sequence matches the correct order
    const isCorrect = userSequence.every((item, index) => {
      const correctItem = answer.find(a => a.id === item.id)
      return correctItem?.order === index
    })

    setHasSubmitted(true)
    
    if (isCorrect) {
      toast.success("Correct! The sequence is in the right order.")
    } else {
      toast.error("Incorrect. Try again!")
    }

    if (onAnswerSubmit) {
      onAnswerSubmit(isCorrect)
    }
  }

  if (isEditMode) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">This component should not be used in edit mode</p>
        <p className="text-xs text-muted-foreground">Use the sequence editor component for editing</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">{question}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Arrange the items in the correct order by dragging them.
        </p>
      </div>

      {!hasSubmitted ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetSequence}
              className="flex items-center gap-1"
            >
              <RefreshCcw className="h-3 w-3" />
              Shuffle
            </Button>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <GripVertical className="h-4 w-4" />
              <span>Drag to reorder</span>
            </div>
          </div>

          <Reorder.Group
            axis="y"
            values={userSequence}
            onReorder={handleReorder}
            className="space-y-2"
          >
            {userSequence.map((item) => (
              <Reorder.Item
                key={item.id}
                value={item}
                className="flex items-center gap-2 bg-card p-3 rounded-lg border group cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center gap-2 bg-muted px-2 py-1 rounded text-sm">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono">{item.order + 1}</span>
                </div>
                <div className="flex-1">{item.text}</div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          <div className="flex justify-end mt-4">
            <Button onClick={checkAnswer}>
              Check Answer
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="font-medium">Correct sequence:</h4>
          <div className="space-y-2">
            {answer.sort((a, b) => a.order - b.order).map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-2 bg-card p-3 rounded-lg border"
              >
                <div className="flex items-center gap-2 bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                  <span className="font-mono">{index + 1}</span>
                </div>
                <div className="flex-1">{item.text}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={resetSequence}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      {userSequence.length === 0 && !hasSubmitted && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground">
            No items to arrange.
          </p>
        </div>
      )}
    </div>
  )
} 