"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Check, X } from "lucide-react"

interface OpenQuestionProps {
  question: string
  answer: string
  onChange?: (data: { question: string; answer: string }) => void
  isEditMode?: boolean
  onAnswerSubmit?: (isCorrect: boolean) => void
}

export function OpenQuestion({ 
  question, 
  answer, 
  onChange, 
  isEditMode = true,
  onAnswerSubmit
}: OpenQuestionProps) {
  const [userAnswer, setUserAnswer] = useState("")
  const [showAnswer, setShowAnswer] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  // Simple function to check if the answer is "close enough"
  const checkAnswer = () => {
    if (!userAnswer.trim()) {
      toast.error("Please provide an answer before submitting");
      return;
    }

    // Normalize both answers for comparison (lowercase, trim, remove extra spaces)
    const normalizedUserAnswer = userAnswer.toLowerCase().trim().replace(/\s+/g, ' ');
    const normalizedCorrectAnswer = answer.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Check if answers are similar (exact match or contains the key parts)
    const exactMatch = normalizedUserAnswer === normalizedCorrectAnswer;
    const closeMatch = normalizedCorrectAnswer.includes(normalizedUserAnswer) || 
                      normalizedUserAnswer.includes(normalizedCorrectAnswer);
    
    // Set correctness based on matches
    const result = exactMatch || (closeMatch && normalizedUserAnswer.length > 10);
    
    setIsCorrect(result);
    setHasSubmitted(true);
    
    if (onAnswerSubmit) {
      onAnswerSubmit(result);
    }
    
    if (result) {
      toast.success("Your answer is correct!");
    } else {
      toast.error("Your answer doesn't match what we expected.");
    }
  };

  const handleReset = () => {
    setUserAnswer("");
    setHasSubmitted(false);
    setShowAnswer(false);
    setIsCorrect(false);
  };

  return (
    <div className="space-y-4">
      {isEditMode ? (
        // Modo edición
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Question
            </label>
            <Textarea
              placeholder="Write the question..."
              value={question}
              onChange={(e) => onChange?.({ question: e.target.value, answer })}
              className="min-h-[100px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Correct answer
            </label>
            <Textarea
              placeholder="Write the correct answer..."
              value={answer}
              onChange={(e) => onChange?.({ question, answer: e.target.value })}
              className="min-h-[100px]"
            />
          </div>
        </div>
      ) : (
        // Modo vista/test
        <div className="space-y-4">
          <Card className={`p-4 ${hasSubmitted ? (isCorrect ? 'border-green-200' : 'border-red-200') : ''}`}>
            <p className="text-sm font-medium mb-4">{question}</p>
            <Textarea
              placeholder="Write your answer..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className={`min-h-[100px] ${hasSubmitted ? 'bg-gray-50 text-gray-800' : ''}`}
              disabled={hasSubmitted}
            />
            
            {hasSubmitted && (
              <div className={`mt-4 p-3 rounded-md ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center">
                  {isCorrect 
                    ? <Check className="h-5 w-5 text-green-500 mr-2" /> 
                    : <X className="h-5 w-5 text-red-500 mr-2" />
                  }
                  <p className="text-sm font-medium">
                    {isCorrect 
                      ? "Your answer is correct!" 
                      : "Your answer needs improvement."
                    }
                  </p>
                </div>
              </div>
            )}
          </Card>
          
          <div className="flex justify-end gap-2">
            {hasSubmitted ? (
              <>
                <Button 
                  variant="outline"
                  onClick={handleReset}
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowAnswer(!showAnswer)}
                >
                  {showAnswer ? "Hide answer" : "Show answer"}
                </Button>
              </>
            ) : (
              <Button 
                onClick={checkAnswer}
                disabled={!userAnswer.trim()}
              >
                Submit Answer
              </Button>
            )}
          </div>

          {showAnswer && hasSubmitted && (
            <Card className="p-4 bg-muted">
              <h4 className="text-sm font-medium mb-2">Correct answer:</h4>
              <p className="text-sm">{answer}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
