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
          placeholder="Escribe la pregunta..."
          value={question}
          onChange={(e) => onChange({ question: e.target.value, answer })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          Respuesta correcta
        </label>
        <RadioGroup
          value={answer.toString()}
          onValueChange={(value) => onChange({ question, answer: value === "true" })}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true" id="true" />
            <Label htmlFor="true">Verdadero</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="false" id="false" />
            <Label htmlFor="false">Falso</Label>
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
  selectedAnswer?: boolean
  correctAnswer?: boolean
}

export function TrueOrFalse({ 
  question, 
  answer, 
  isAnswered = false,
  selectedAnswer,
  correctAnswer
}: TrueOrFalseProps) {
  const [selected, setSelected] = useState<boolean | null>(selectedAnswer ?? null)

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
            isAnswered && selected === true && (
              selected === correctAnswer 
                ? "bg-green-500 hover:bg-green-500" 
                : "bg-red-500 hover:bg-red-500"
            )
          )}
        >
          Verdadero
        </Button>
        <Button
          variant={selected === false ? "default" : "outline"}
          onClick={() => handleSelect(false)}
          disabled={isAnswered}
          className={cn(
            "w-full",
            isAnswered && selected === false && (
              selected === correctAnswer 
                ? "bg-green-500 hover:bg-green-500" 
                : "bg-red-500 hover:bg-red-500"
            )
          )}
        >
          Falso
        </Button>
      </div>
      {isAnswered && (
        <div className={cn(
          "mt-4 p-4 rounded-lg text-center",
          selected === correctAnswer 
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        )}>
          {selected === correctAnswer ? "¡Correcto!" : "Incorrecto"}
        </div>
      )}
    </div>
  )
}


