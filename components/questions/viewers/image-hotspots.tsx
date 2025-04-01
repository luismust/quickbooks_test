"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface ImageHotspotsProps {
  imageUrl: string
  question: string
  hotspots: Array<{
    id: string
    x: number
    y: number
    label: string
  }>
  onAnswer: (selectedHotspots: string[]) => void
  isAnswered: boolean
}

export function ImageHotspots({
  imageUrl,
  question,
  hotspots,
  onAnswer,
  isAnswered
}: ImageHotspotsProps) {
  const [selectedHotspots, setSelectedHotspots] = useState<string[]>([])
  const [showLabels, setShowLabels] = useState(false)

  const handleHotspotClick = (id: string) => {
    if (isAnswered) return

    setSelectedHotspots(prev => {
      const newSelection = prev.includes(id)
        ? prev.filter(spotId => spotId !== id)
        : [...prev, id]
      return newSelection
    })
  }

  const handleSubmit = () => {
    onAnswer(selectedHotspots)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={question}
          className="w-full h-auto"
        />
        {hotspots.map(hotspot => (
          <motion.div
            key={hotspot.id}
            className={`absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer
              ${isAnswered || showLabels ? 'bg-blue-500/50' : 'hover:bg-blue-500/30'}
              ${selectedHotspots.includes(hotspot.id) ? 'bg-green-500/50' : ''}
              rounded-full flex items-center justify-center`}
            style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
            onClick={() => handleHotspotClick(hotspot.id)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            {(isAnswered || showLabels) && (
              <motion.span
                className="absolute whitespace-nowrap bg-black/75 text-white px-2 py-1 rounded text-sm -translate-y-full -top-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {hotspot.label}
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>

      {!isAnswered && (
        <div className="flex justify-center gap-4">
          <Button onClick={() => setShowLabels(!showLabels)}>
            {showLabels ? "Hide Labels" : "Show Labels"}
          </Button>
          <Button onClick={handleSubmit}>
            Submit Selection
          </Button>
        </div>
      )}
    </div>
  )
} 