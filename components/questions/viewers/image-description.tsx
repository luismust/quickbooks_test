"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ImageDescriptionProps {
  imageUrl: string
  question: string
  onAnswer: (description: string) => void
  isAnswered: boolean
  correctDescription?: string
}

export function ImageDescription({
  imageUrl,
  question,
  onAnswer,
  isAnswered,
  correctDescription
}: ImageDescriptionProps) {
  const [description, setDescription] = useState("")

  const handleSubmit = () => {
    onAnswer(description)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={question}
          className="w-full h-auto rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Write your description here..."
          className="min-h-[150px]"
          disabled={isAnswered}
        />
      </div>

      {!isAnswered && (
        <Button 
          className="w-full"
          onClick={handleSubmit}
          disabled={!description.trim()}
        >
          Submit Description
        </Button>
      )}

      {isAnswered && correctDescription && (
        <motion.div 
          className="p-4 rounded-lg bg-muted"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h4 className="font-medium mb-2">Correct Description:</h4>
          <p>{correctDescription}</p>
        </motion.div>
      )}
    </div>
  )
} 