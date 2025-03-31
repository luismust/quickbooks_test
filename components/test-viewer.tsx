"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ImageMap } from "./image-map"
import { TrueOrFalse } from "@/components/questions/viewers/true_or_false"
import { MultipleChoice } from "@/components/questions/viewers/multiple-choice"
import { PointAPoint } from "@/components/questions/viewers/point_a_point"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { ResultsDialog } from "./results-dialog"
import type { Area, Test, Question } from "@/lib/test-storage"
import { formatGoogleDriveUrl, getImageUrl } from "@/lib/utils"

interface Connection {
  start: string
  end: string
}

interface TestViewerProps {
  test: Test
  onFinish?: () => void
}

export function TestViewer({ test, onFinish }: TestViewerProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState<string[]>([])
  const [showFeedback, setShowFeedback] = useState<{ correct: boolean; message: string } | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [userAnswers, setUserAnswers] = useState<{[key: string]: boolean}>({})
  const [testCompleted, setTestCompleted] = useState(false)
  const [connections, setConnections] = useState<{[key: string]: Connection[]}>({})

  // Procesar las imágenes
  const processedQuestions = useMemo(() => {
    return test.questions.map(q => ({
      ...q,
      image: getImageUrl(q.image)
    }))
  }, [test.questions])
  
  const currentQuestionData = processedQuestions[currentQuestion]
  const progress = ((answered.length) / processedQuestions.length) * 100

  const handleAnswer = (isCorrect: boolean, questionId: string, connection?: Connection) => {
    if (answered.includes(questionId) || testCompleted) return
    
    const question = processedQuestions.find(q => q.id === questionId)
    if (!question) return
    
    const points = isCorrect ? question.scoring?.correct || 1 : -(question.scoring?.incorrect || 0)
    setScore(prev => Math.max(0, prev + points))
    
    if (connection) {
      setConnections(prev => ({ 
        ...prev, 
        [questionId]: [
          ...(prev[questionId] || []).filter(conn => 
            conn.start !== connection.start && 
            conn.end !== connection.end
          ),
          connection
        ]
      }))
    }
    
    setAnswered(prev => [...prev, questionId])
    setUserAnswers(prev => ({ ...prev, [questionId]: isCorrect }))
    
    setShowFeedback({
      correct: isCorrect,
      message: isCorrect 
        ? `Correct! +${question.scoring?.correct || 1} points` 
        : `Incorrect. Try to find the correct area in another part of the image.`
    })

    setTimeout(() => {
      setShowFeedback(null)
    }, 3000)
  }

  const handleNext = () => {
    if (currentQuestion < processedQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleFinish = () => {
    if (answered.length === processedQuestions.length) {
      setTestCompleted(true)
    }
  }

  const resetTest = () => {
    setCurrentQuestion(0)
    setScore(0)
    setAnswered([])
    setShowFeedback(null)
    setShowResults(false)
    setUserAnswers({})
    setTestCompleted(false)
    setConnections({})
  }

  if (!processedQuestions || processedQuestions.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{test.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">No questions available</p>
        </CardContent>
      </Card>
    )
  }

  const renderQuestion = (question: Question) => {
    const isAnswered = answered.includes(question.id)

    switch (question.type) {
      case 'clickArea':
        // Para preguntas de tipo clickArea, asegurarnos de mantener la funcionalidad sin revelar las respuestas
        return (
          <div className="relative">
            <ImageMap
              src={question.image || ''}
              areas={question.areas || []} // Necesitamos mantener las áreas para la funcionalidad
              drawingArea={null}
              onAreaClick={(areaId) => {
                if (isAnswered) return
                const area = question.areas?.find(a => a.id === areaId)
                handleAnswer(area?.isCorrect || false, question.id)
              }}
              alt={question.title}
              isDrawingMode={false}
              isEditMode={false} // Esto es clave - el modo sin edición ocultará completamente las áreas
              onError={() => {
                console.error('Failed to load image in test view:', question.image);
                // No mostrar notificación para evitar interrumpir el test
              }}
            />
            {/* Mensaje sutil para indicar que se debe hacer clic en la imagen */}
            {!isAnswered && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-black/40 text-white px-3 py-1 rounded-full text-xs">
                  Click on the correct answer
                </div>
              </div>
            )}
          </div>
        )

      case 'trueOrFalse':
        return (
          <TrueOrFalse
            question={question.question}
            answer={(answer) => {
              if (isAnswered) return
              handleAnswer(answer === question.correctAnswer, question.id)
            }}
            isAnswered={isAnswered}
          />
        )

      case 'multipleChoice':
        return (
          <MultipleChoice
            options={question.options || []}
            onSelect={(optionId) => {
              if (isAnswered) return
              const option = question.options?.find(o => o.id === optionId)
              handleAnswer(option?.isCorrect || false, question.id)
            }}
            isAnswered={isAnswered}
          />
        )

      case 'pointAPoint':
        return (
          <PointAPoint
            points={question.points || []}
            onSelect={(pointId, connection) => {
              if (isAnswered) return
              const point = question.points?.find(p => p.id === pointId)
              if (connection && point?.type === 'right') {
                const connectedLeftPoint = question.points?.find(p => p.id === connection.start)
                const isCorrect = connectedLeftPoint?.correctMatch === point.id
                handleAnswer(isCorrect, question.id, connection)
              }
            }}
            isAnswered={isAnswered}
            selectedPoint={userAnswers[question.id] ? question.id : ""}
            existingConnections={connections[question.id] || []}
          />
        )

      case 'dragAndDrop':
      case 'sequence':
      case 'openQuestion':
      case 'identifyErrors':
      case 'phraseComplete':
        return (
          <div className="p-4 text-center text-muted-foreground">
            This type of question is not implemented yet
          </div>
        )

      default:
        return (
          <div className="p-4 text-center text-muted-foreground">
            Unsupported question type: {question.type}
          </div>
        )
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{test.name}</CardTitle>
          {showResults ? (
            <div className="text-center mt-4">
              <h3 className="text-xl font-semibold mb-2">
                Final score: {score} / {test.maxScore}
              </h3>
              <p className="text-muted-foreground">
                {score >= test.minScore ? test.passingMessage : test.failingMessage}
              </p>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">{test.description || ''}</p>
              <div className="mt-2 text-sm text-muted-foreground">
                Answered questions: {answered.length} of {processedQuestions.length}
              </div>
              {testCompleted && (
                <div className="mt-2 text-sm text-yellow-600">
                  You have completed this test. Click "View results" to see your score.
                </div>
              )}
            </>
          )}
        </CardHeader>

        <CardContent>
          {!showResults && currentQuestionData && (
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold mb-4">
                {currentQuestionData.question}
              </h2>
              {currentQuestionData.image && (
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={currentQuestionData.image}
                    alt={currentQuestionData.title}
                    className="w-full h-auto"
                    onError={(e) => {
                      console.error('Error loading image:', currentQuestionData.image)
                      e.currentTarget.src = '/placeholder-image.png' // Imagen de fallback
                      toast.error("Failed to load image")
                    }}
                  />
                </div>
              )}
              {renderQuestion(currentQuestionData)}
            </motion.div>
          )}
        </CardContent>

        <div className="px-6 pb-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{answered.length} of {processedQuestions.length} answered</span>
          </div>
          <Progress value={progress} />
        </div>

        <CardFooter className="border-t p-6">
          <div className="flex justify-between w-full">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentQuestion === 0 || testCompleted}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            
            {testCompleted ? (
              <Button onClick={() => setShowResults(true)}>View results</Button>
            ) : (
              currentQuestion === processedQuestions.length - 1 ? (
                <Button 
                  onClick={handleFinish}
                  variant="default"
                  disabled={answered.length < processedQuestions.length}
                >
                  Finish test
                </Button>
              ) : (
                <Button 
                  onClick={handleNext} 
                  disabled={!answered.includes(currentQuestionData.id) || testCompleted}
                >
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )
            )}
          </div>
        </CardFooter>
      </Card>

      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50"
          >
            <div className={`
              px-6 py-3 rounded-lg shadow-lg
              ${showFeedback.correct 
                ? "bg-green-500 text-white" 
                : "bg-red-500 text-white"}
            `}>
              {showFeedback.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ResultsDialog
        isOpen={showResults}
        onClose={() => setShowResults(false)}
        score={score}
        maxScore={test.maxScore}
        minScore={test.minScore}
        passingMessage={test.passingMessage}
        failingMessage={test.failingMessage}
      />
    </div>
  )
} 