"use client"

import { useState, useEffect } from "react"
import { motion, Reorder } from "framer-motion"
import { Button } from "@/components/ui/button"
import { GripVertical, RefreshCcw } from "lucide-react"
import { toast } from "sonner"

interface SequenceImage {
  id: string
  url: string
  order: number
  description: string
}

interface ImageSequenceProps {
  question: string
  answer: SequenceImage[]
  onChange?: (question: string, answer: SequenceImage[]) => void
  isEditMode?: boolean
  onAnswerSubmit?: (isCorrect: boolean) => void
}

export function ImageSequence({
  question,
  answer,
  onChange,
  isEditMode = false,
  onAnswerSubmit
}: ImageSequenceProps) {
  const [userSequence, setUserSequence] = useState<SequenceImage[]>([])
  const [showDescriptions, setShowDescriptions] = useState(false)
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

  const handleReorder = (reorderedItems: SequenceImage[]) => {
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
      toast.success("Correct! The images are in the right order.")
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
        <p className="text-xs text-muted-foreground">Use the image sequence editor component for editing</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">{question}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Arrange the images in the correct order by dragging them.
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDescriptions(!showDescriptions)}
              className="flex items-center gap-1"
            >
              {showDescriptions ? "Hide Descriptions" : "Show Descriptions"}
            </Button>
          </div>

          <Reorder.Group
            axis="y"
            values={userSequence}
            onReorder={handleReorder}
            className="space-y-4"
          >
            {userSequence.map((item) => (
              <Reorder.Item
                key={item.id}
                value={item}
                className="bg-card rounded-lg shadow-sm cursor-grab active:cursor-grabbing border"
              >
                <div className="p-4 space-y-2">
                  <div className="relative aspect-video">
                    <img
                      src={item.url}
                      alt={item.description}
                      className="w-full h-full object-cover rounded"
                    />
                    {showDescriptions && (
                      <motion.div
                        className="absolute inset-0 bg-black/50 text-white p-4 flex items-center justify-center text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {item.description}
                      </motion.div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Step {item.order + 1}</span>
                  </div>
                </div>
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
          <div className="space-y-4">
            {answer.sort((a, b) => a.order - b.order).map((item, index) => (
              <div
                key={item.id}
                className="bg-card rounded-lg shadow-sm border"
              >
                <div className="p-4 space-y-2">
                  <div className="relative aspect-video">
                    <img
                      src={item.url}
                      alt={item.description}
                      className="w-full h-full object-cover rounded"
                    />
                    <motion.div
                      className="absolute inset-0 bg-black/50 text-white p-4 flex items-center justify-center text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {item.description}
                    </motion.div>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <span className="text-sm font-medium text-primary">Step {index + 1}</span>
                  </div>
                </div>
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
            No images to arrange.
          </p>
        </div>
      )}
    </div>
  )
} 