"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface ImageDescriptionProps {
  imageUrl: string
  question: string
  onAnswer: (description: string) => void
  isAnswered?: boolean
  correctDescription?: string
  keywords?: string[]
}

export function ImageDescription({ 
  imageUrl, 
  question, 
  onAnswer, 
  isAnswered = false,
  correctDescription = "",
  keywords = []
}: ImageDescriptionProps) {
  const [description, setDescription] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (description.trim() && !isAnswered) {
      setSubmitted(true)
      onAnswer(description.trim())
    }
  }

  const getFoundKeywords = () => {
    return keywords.filter(keyword => 
      description.toLowerCase().includes(keyword.toLowerCase())
    )
  }

  const foundKeywords = getFoundKeywords()
  const missingKeywords = keywords.filter(keyword => 
    !description.toLowerCase().includes(keyword.toLowerCase())
  )

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
        <Textarea
          placeholder="Write your description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isAnswered}
          className={cn(
            isAnswered && "opacity-50"
          )}
        />

        {description && !isAnswered && (
          <div className="space-y-2">
            <p className="font-medium">Found keywords:</p>
            <div className="flex flex-wrap gap-2">
              {foundKeywords.map((keyword, index) => (
                <Badge key={index} variant="success">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isAnswered || !description.trim()}
          className="w-full"
        >
          Submit Description
        </Button>

        {isAnswered && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium text-green-600">Keywords Found:</p>
              <div className="flex flex-wrap gap-2">
                {foundKeywords.map((keyword, index) => (
                  <Badge key={index} variant="success">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            {missingKeywords.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-red-600">Missing Keywords:</p>
                <div className="flex flex-wrap gap-2">
                  {missingKeywords.map((keyword, index) => (
                    <Badge key={index} variant="destructive">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="font-medium text-green-600">Sample Description:</p>
              <div className="p-4 rounded-lg border border-green-500 bg-green-100">
                {correctDescription}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 