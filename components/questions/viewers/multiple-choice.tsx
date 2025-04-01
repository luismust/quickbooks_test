"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Option {
  id: string
  text: string
  isCorrect: boolean
}

interface MultipleChoiceProps {
  options: Option[]
  onSelect: (optionId: string) => void
  isAnswered?: boolean
}

export function MultipleChoice({ options, onSelect, isAnswered = false }: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (optionId: string) => {
    if (isAnswered) return
    setSelected(optionId)
    onSelect(optionId)
  }

  return (
    <div className="space-y-4">
      {options.map((option) => (
        <Button
          key={option.id}
          variant={selected === option.id ? "default" : "outline"}
          onClick={() => handleSelect(option.id)}
          disabled={isAnswered}
          className={cn(
            "w-full justify-start text-left",
            isAnswered && option.isCorrect && "bg-green-100 hover:bg-green-100 text-green-700 border-green-200",
            isAnswered && selected === option.id && !option.isCorrect && "bg-red-100 hover:bg-red-100 text-red-700 border-red-200"
          )}
        >
          {option.text}
        </Button>
      ))}
    </div>
  )
} 