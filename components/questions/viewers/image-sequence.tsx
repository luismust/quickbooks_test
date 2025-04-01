"use client"

import { useState } from "react"
import { motion, Reorder } from "framer-motion"
import { Button } from "@/components/ui/button"

interface ImageSequenceProps {
  images: Array<{
    id: string
    url: string
    order: number
    description: string
  }>
  onAnswer: (sequence: string[]) => void
  isAnswered: boolean
}

export function ImageSequence({
  images,
  onAnswer,
  isAnswered
}: ImageSequenceProps) {
  const [items, setItems] = useState(images)
  const [showDescriptions, setShowDescriptions] = useState(false)

  const handleSubmit = () => {
    onAnswer(items.map(item => item.id))
  }

  return (
    <div className="space-y-4">
      <Reorder.Group 
        axis="y" 
        values={items} 
        onReorder={setItems}
        className="space-y-4"
      >
        {items.map(item => (
          <Reorder.Item
            key={item.id}
            value={item}
            className={`bg-card rounded-lg shadow-sm ${isAnswered ? 'cursor-default' : 'cursor-move'}`}
            disabled={isAnswered}
          >
            <div className="p-4 space-y-2">
              <div className="relative aspect-video">
                <img
                  src={item.url}
                  alt={item.description}
                  className="w-full h-full object-cover rounded"
                />
                {(showDescriptions || isAnswered) && (
                  <motion.div
                    className="absolute inset-0 bg-black/50 text-white p-4 flex items-center justify-center text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {item.description}
                  </motion.div>
                )}
              </div>
              <div className="text-sm text-muted-foreground text-center">
                Step {item.order}
              </div>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {!isAnswered && (
        <div className="flex justify-center gap-4">
          <Button onClick={() => setShowDescriptions(!showDescriptions)}>
            {showDescriptions ? "Hide Descriptions" : "Show Descriptions"}
          </Button>
          <Button onClick={handleSubmit}>
            Submit Sequence
          </Button>
        </div>
      )}
    </div>
  )
} 