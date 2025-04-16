"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { IdentifyErrors as IdentifyErrorsEditor } from "@/components/questions/editors/Identify_errors"

interface IdentifyErrorsProps {
  question: string
  answer: string
  code?: string
  onChange?: (data: { question?: string; answer?: string; code?: string }) => void
  isEditMode?: boolean
  onAnswerSubmit?: (isCorrect: boolean) => void
}

export function IdentifyErrors({ 
  question, 
  answer, 
  code = "", 
  onChange, 
  isEditMode = true,
  onAnswerSubmit
}: IdentifyErrorsProps) {
  const [userAnswer, setUserAnswer] = useState("")
  const [showAnswer, setShowAnswer] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  // Función para comparar la respuesta del usuario con la respuesta correcta
  const checkAnswer = () => {
    // Normalizar respuestas (eliminar espacios en blanco adicionales)
    const normalizedUserAnswer = userAnswer.trim().replace(/\s+/g, ' ');
    const normalizedCorrectAnswer = answer.trim().replace(/\s+/g, ' ');
    
    // Comparar las respuestas normalizadas
    const correct = normalizedUserAnswer === normalizedCorrectAnswer;
    
    setIsCorrect(correct);
    setHasSubmitted(true);
    
    // Notificar al componente padre si existe el callback
    if (onAnswerSubmit) {
      onAnswerSubmit(correct);
    }
    
    // Mostrar toast con feedback
    if (correct) {
      toast.success("Correct! Your answer is correct.");
    } else {
      toast.error("Incorrect. Review your solution.");
    }
    
    // Mostrar la respuesta correcta si es incorrecta
    if (!correct) {
      setShowAnswer(true);
    }
  };

  return (
    <div className="space-y-4">
      {isEditMode ? (
        // Modo edición - Usamos el componente IdentifyErrorsEditor
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Question
            </label>
            <Textarea
              placeholder="Enter a question like 'Fix the errors in this code'"
              value={question}
              onChange={(e) => onChange?.({ 
                question: e.target.value, 
                answer, 
                code 
              })}
              className="min-h-[100px]"
            />
          </div>
          <IdentifyErrorsEditor
            question={question}
            answer={answer}
            code={code}
            onChange={onChange}
            isEditMode={true}
          />
        </div>
      ) : (
        // Modo vista/test
        <div className="space-y-4">
          <Card className="p-4">
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code>{code}</code>
            </pre>
            <Textarea
              placeholder="Write the corrected code..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="mt-4 min-h-[200px] font-mono"
              disabled={hasSubmitted}
            />
            
            {!hasSubmitted && (
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={checkAnswer}
                  disabled={!userAnswer.trim()}
                >
                  Submit Answer
                </Button>
              </div>
            )}
            
            {hasSubmitted && (
              <div className={`mt-4 p-3 rounded-md ${isCorrect ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                <p className="font-medium">
                  {isCorrect ? 'Correct! Your answer is correct.' : 'Incorrect. Review your solution.'}
                </p>
              </div>
            )}
          </Card>

          {(showAnswer || hasSubmitted) && (
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline"
                onClick={() => setShowAnswer(!showAnswer)}
              >
                {showAnswer ? "Hide solution" : "Show solution"}
              </Button>
            </div>
          )}

          {showAnswer && (
            <Card className="p-4 bg-muted">
              <h4 className="text-sm font-medium mb-2">Solution:</h4>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                <code>{answer}</code>
              </pre>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
