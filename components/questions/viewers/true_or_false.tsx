"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface TrueOrFalseEditorProps {
  question: string
  answer: boolean
  onChange: (data: { question: string; answer: boolean }) => void
}

export function TrueOrFalseEditor({ question, answer, onChange }: TrueOrFalseEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Pregunta
        </label>
        <Input
          placeholder="Write the question..."
          value={question}
          onChange={(e) => onChange({ question: e.target.value, answer })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          Correct answer
        </label>
        <RadioGroup
          value={answer.toString()}
          onValueChange={(value) => onChange({ question, answer: value === "true" })}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true" id="true" />
            <Label htmlFor="true">True</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="false" id="false" />
            <Label htmlFor="false">False</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  )
}

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


