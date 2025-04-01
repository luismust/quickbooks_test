"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface ImageComparisonProps {
  imageUrl1: string
  imageUrl2: string
  question: string
  differences: Array<{
    id: string
    description: string
    x1: number
    y1: number
    x2: number
    y2: number
  }>
  onAnswer: (foundDifferences: string[]) => void
  isAnswered: boolean
  correctAnswers?: string[]
}

export function ImageComparison({
  imageUrl1,
  imageUrl2,
  question,
  differences,
  onAnswer,
  isAnswered,
  correctAnswers
}: ImageComparisonProps) {
  const [selectedDifferences, setSelectedDifferences] = useState<string[]>([])
  const [showHints, setShowHints] = useState(false)

  const handleDifferenceClick = (id: string) => {
    if (isAnswered) return

    setSelectedDifferences(prev => {
      const newSelection = prev.includes(id)
        ? prev.filter(diffId => diffId !== id)
        : [...prev, id]
      return newSelection
    })
  }

  const handleSubmit = () => {
    onAnswer(selectedDifferences)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <img 
            src={imageUrl1} 
            alt="First image" 
            className="w-full h-auto"
          />
          {(isAnswered || showHints) && differences.map(diff => (
            <motion.div
              key={`${diff.id}-1`}
              className="absolute w-6 h-6 border-2 border-red-500 rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${diff.x1}%`, top: `${diff.y1}%` }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            />
          ))}
        </div>
        <div className="relative">
          <img 
            src={imageUrl2} 
            alt="Second image" 
            className="w-full h-auto"
          />
          {(isAnswered || showHints) && differences.map(diff => (
            <motion.div
              key={`${diff.id}-2`}
              className="absolute w-6 h-6 border-2 border-red-500 rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${diff.x2}%`, top: `${diff.y2}%` }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            />
          ))}
        </div>
      </div>

      {!isAnswered && (
        <div className="flex justify-center gap-4">
          <Button onClick={() => setShowHints(!showHints)}>
            {showHints ? "Hide Hints" : "Show Hints"}
          </Button>
          <Button onClick={handleSubmit}>
            Submit Differences
          </Button>
        </div>
      )}

      {isAnswered && correctAnswers && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">Differences found:</h3>
          <ul className="list-disc list-inside">
            {differences.map(diff => (
              <li 
                key={diff.id}
                className={selectedDifferences.includes(diff.id) ? "text-green-600" : "text-red-600"}
              >
                {diff.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
} 