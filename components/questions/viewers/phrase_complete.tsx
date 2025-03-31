"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface PhraseCompleteProps {
  question: string
  answer: string
  onChange?: (data: { question: string; answer: string }) => void
  isEditMode?: boolean
}

export function PhraseComplete({ question, answer, onChange, isEditMode = true }: PhraseCompleteProps) {
  const [userAnswer, setUserAnswer] = useState("")
  const [showAnswer, setShowAnswer] = useState(false)

  return (
    <div className="space-y-4">
      {isEditMode ? (
        // Modo edición
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Frase incompleta
            </label>
            <Textarea
              placeholder="Escribe la frase con ___ para indicar los espacios a completar..."
              value={question}
              onChange={(e) => onChange?.({ question: e.target.value, answer })}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Usa ___ (tres guiones bajos) para indicar donde debe completarse la frase
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Palabra(s) correcta(s)
            </label>
            <Input
              placeholder="Escribe la palabra o frase que completa correctamente..."
              value={answer}
              onChange={(e) => onChange?.({ question, answer: e.target.value })}
            />
          </div>
        </div>
      ) : (
        // Modo vista/test
        <div className="space-y-4">
          <Card className="p-4">
            <p className="text-sm font-medium mb-4">{question}</p>
            <Input
              placeholder="Completa la frase..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
            />
          </Card>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowAnswer(!showAnswer)}
            >
              {showAnswer ? "Ocultar respuesta" : "Ver respuesta"}
            </Button>
          </div>

          {showAnswer && (
            <Card className="p-4 bg-muted">
              <h4 className="text-sm font-medium mb-2">Respuesta correcta:</h4>
              <p className="text-sm">{answer}</p>
              <p className="text-sm mt-2">
                {question.replace('___', `[${answer}]`)}
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
