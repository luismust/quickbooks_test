"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TrueOrFalseProps {
  question: string
  answer: (value: boolean) => void
  isAnswered?: boolean
}

export function TrueOrFalse({ question, answer, isAnswered = false }: TrueOrFalseProps) {
  const [selected, setSelected] = useState<boolean | null>(null)

  const handleSelect = (value: boolean) => {
    if (isAnswered) return
    setSelected(value)
    answer(value)
  }

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium">{question}</p>
      <div className="flex gap-4">
        <Button
          variant={selected === true ? "default" : "outline"}
          onClick={() => handleSelect(true)}
          disabled={isAnswered}
          className={cn(
            "w-full",
            isAnswered && selected === true && "bg-green-500 hover:bg-green-500"
          )}
        >
          True
        </Button>
        <Button
          variant={selected === false ? "default" : "outline"}
          onClick={() => handleSelect(false)}
          disabled={isAnswered}
          className={cn(
            "w-full",
            isAnswered && selected === false && "bg-red-500 hover:bg-red-500"
          )}
        >
          False
        </Button>
      </div>
    </div>
  )
}


