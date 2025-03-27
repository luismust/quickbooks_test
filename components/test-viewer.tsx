"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ImageMap } from "./image-map"
import { TrueOrFalse } from "./true_or_false"
import { MultipleChoice } from "./multiple-choice-editor"
import { PointAPoint } from "./point_a_point"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { ResultsDialog } from "./results-dialog"
import { cn } from "@/lib/utils"

interface Question {
  id: number
  type: 'clickArea' | 'multipleChoice' | 'dragAndDrop' | 'sequence' | 'pointAPoint' | 'openQuestion' | 'identifyErrors' | 'phraseComplete' | 'trueOrFalse'
  title: string
  description: string
  question: string
  image?: string
  areas?: Area[]
  points?: {
    id: string
    text: string
    type: 'left' | 'right'
    correctMatch?: string
  }[]
  options?: {
    id: string
    text: string
    isCorrect: boolean
  }[]
  correctAnswer?: boolean
  scoring: {
    correct: number
    incorrect: number
    retain: number
  }
}

interface Connection {
  start: string
  end: string
}

interface TestViewerProps {
  test: {
    id: string
    name: string
    description?: string
    questions: Question[]
    maxScore: number
    minScore: number
    passingMessage: string
    failingMessage: string
  }
}

const processImageUrl = (url?: string) => {
  console.log('Processing image URL:', url)
  if (!url) {
    console.log('No URL provided')
    return ''
  }

  // Verificar si es una URL de Google Drive
  if (url.includes('drive.google.com/file/d/')) {
    try {
      // Extraer el ID del archivo
      const fileId = url.match(/\/d\/(.*?)(\/|$)/)
      if (fileId && fileId[1]) {
        console.log('Google Drive ID:', fileId[1])
        // Usar el formato alternativo de Google Drive
        const processedUrl = `https://drive.google.com/thumbnail?id=${fileId[1]}&sz=w1000`
        console.log('Processed URL:', processedUrl)
        return processedUrl
      }
    } catch (error) {
      console.error('Error processing Google Drive URL:', error)
    }
  }

  console.log('Returning original URL:', url)
  return url
}

export function TestViewer({ test }: TestViewerProps) {
  console.log('TestViewer rendering with test:', test)

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState<number>(0)
  const [answered, setAnswered] = useState<number[]>([])
  const [showFeedback, setShowFeedback] = useState<{ correct: boolean; message: string } | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [userAnswers, setUserAnswers] = useState<{[key: number]: boolean}>({})
  const [testCompleted, setTestCompleted] = useState(false)
  const [connections, setConnections] = useState<{[key: number]: Connection[]}>({})
  const [imageError, setImageError] = useState(false)

  const clickTimeout = useRef<NodeJS.Timeout | null>(null)

  const handleAnswer = ({ isCorrect, questionId, currentScore }: AnswerParams) => {
    console.log('handleAnswer called:', { isCorrect, questionId, currentScore })
    
    if (!answered.includes(questionId)) {
      const questionScoring = test.questions[currentQuestion]?.scoring || {
        correct: 1,
        incorrect: 1,
        retain: 0
      };

      const points = isCorrect ? questionScoring.correct : -questionScoring.incorrect;
      const calculatedScore = currentScore + points;
      const newScore = Math.max(0, calculatedScore);

      console.log('Score update:', {
        previousScore: currentScore,
        points,
        calculatedScore,
        newScore,
        isCorrect
      });

      // Actualizar el estado
      setScore(newScore);
      setAnswered(prev => [...prev, questionId]);
      setUserAnswers(prev => ({
        ...prev,
        [questionId]: isCorrect
      }));

      // Mostrar feedback
      setShowFeedback({
        correct: isCorrect,
        message: isCorrect ? 
          `¡Correcto! +${questionScoring.correct} puntos` : 
          `Incorrecto. -${questionScoring.incorrect} puntos`
      });

      setTimeout(() => setShowFeedback(null), 2000);
    }
  };

  const handleNext = () => {
    if (currentQuestion < test.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleFinish = () => {
    console.log('Attempting to finish test:', {
      answered: answered.length,
      totalQuestions: test.questions.length,
      score,
      userAnswers
    })

    // Verificar si todas las preguntas están respondidas
    const allQuestionsAnswered = test.questions.every(q => answered.includes(q.id))
    
    if (!allQuestionsAnswered) {
      console.log('Not all questions answered')
      toast({
        title: "Preguntas sin responder",
        description: "Por favor responde todas las preguntas antes de finalizar.",
        variant: "destructive"
      })
      return
    }

    console.log('All questions answered, finishing test')
    setTestCompleted(true)
    setShowResults(true)
  }

  const resetTest = () => {
    console.log('Resetting test...')
    setCurrentQuestion(0)
    setScore(0)
    setAnswered([])
    setShowFeedback(null)
    setShowResults(false)
    setUserAnswers({})
    setTestCompleted(false)
    setConnections({})
  }

  const currentQuestionData = test.questions[currentQuestion]
  const progress = ((answered.length) / test.questions.length) * 100

  useEffect(() => {
    console.log('Question changed to:', currentQuestion)
    console.log('New question data:', test.questions[currentQuestion])
  }, [currentQuestion, test.questions])

  useEffect(() => {
    console.log('Current answered questions:', answered)
    console.log('Current user answers:', userAnswers)
  }, [answered, userAnswers])

  useEffect(() => {
    console.log('Test state updated:', {
      currentQuestion,
      answered,
      userAnswers,
      score,
      testCompleted
    })
  }, [currentQuestion, answered, userAnswers, score, testCompleted])

  useEffect(() => {
    return () => {
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current)
      }
    }
  }, [])

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>, question: Question) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Obtener el elemento de imagen
    const imageElement = e.currentTarget.querySelector('img');
    if (!imageElement) return;

    // Calcular la escala basada en las dimensiones naturales vs actuales
    const scaleX = imageElement.naturalWidth / imageElement.clientWidth;
    const scaleY = imageElement.naturalHeight / imageElement.clientHeight;

    // Aplicar la escala a las coordenadas del clic
    const scaledX = x * scaleX;
    const scaledY = y * scaleY;

    // Si ya respondió esta pregunta, no hacer nada
    if (answered.includes(question.id)) return;

    // Verificar si el clic está dentro de algún área
    const clickedArea = question.areas?.find(area => {
      if (area.shape === 'rect') {
        const [x1, y1, x2, y2] = area.coords;
        return (
          scaledX >= Math.min(x1, x2) && 
          scaledX <= Math.max(x1, x2) && 
          scaledY >= Math.min(y1, y2) && 
          scaledY <= Math.max(y1, y2)
        );
      }
      return false;
    });

    // Si hizo clic en un área, procesar como respuesta correcta o incorrecta
    if (clickedArea) {
      handleAnswer({
        isCorrect: clickedArea.isCorrect,
        questionId: question.id,
        currentScore: score
      });
    } else {
      // Si hizo clic fuera de cualquier área, contar como respuesta incorrecta
      handleAnswer({
        isCorrect: false,
        questionId: question.id,
        currentScore: score
      });
    }
  };

  if (!test.questions || test.questions.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto p-6">
        <p className="text-center text-muted-foreground">No questions available</p>
      </Card>
    )
  }

  const renderQuestion = (question: Question) => {
    const isAnswered = answered.includes(question.id)
    console.log('Rendering question:', question)
    console.log('Question type:', question.type)
    console.log('Question image:', question.image)

    switch (question.type) {
      case 'clickArea':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {imageError ? (
              <div className="text-center text-red-500 p-4 border border-red-200 rounded-lg bg-red-50">
                <p className="font-semibold">Error loading image</p>
                <p className="text-sm text-red-400 mt-1">
                  Please make sure the Google Drive image is publicly accessible
                </p>
                <Button 
                  onClick={() => setImageError(false)} 
                  variant="outline" 
                  className="mt-2"
                  size="sm"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="relative w-full max-w-2xl mx-auto">
                <div 
                  className="aspect-[4/3] relative"
                  onClick={(e) => handleImageClick(e, question)}
                >
                  <img
                    src={processImageUrl(question.image)}
                    alt={question.title}
                    className="w-full h-full object-contain"
                    onError={() => setImageError(true)}
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement
                      console.log('Image loaded:', {
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight,
                        clientWidth: img.clientWidth,
                        clientHeight: img.clientHeight
                      })
                    }}
                  />
                  
                  {/* Áreas clickeables visuales (solo cuando está respondida) */}
                  {isAnswered && question.areas?.map(area => {
                    if (area.shape === 'rect') {
                      const [x1, y1, x2, y2] = area.coords;
                      const imageElement = document.querySelector('img');
                      if (!imageElement) return null;

                      // Calcular la escala para mostrar las áreas
                      const scaleX = imageElement.clientWidth / imageElement.naturalWidth;
                      const scaleY = imageElement.clientHeight / imageElement.naturalHeight;

                      // Aplicar la escala a las coordenadas del área
                      const scaledStyle = {
                        left: `${x1 * scaleX}px`,
                        top: `${y1 * scaleY}px`,
                        width: `${(x2 - x1) * scaleX}px`,
                        height: `${(y2 - y1) * scaleY}px`
                      };

                      return (
                        <div
                          key={area.id}
                          className={cn(
                            "absolute pointer-events-none border-2",
                            area.isCorrect ? "border-green-500" : "border-red-500"
                          )}
                          style={scaledStyle}
                        />
                      );
                    }
                    return null;
                  })}

                  {/* Overlay para feedback visual */}
                  <div 
                    className={cn(
                      "absolute inset-0 transition-colors duration-200 rounded-lg",
                      isAnswered ? "bg-black/10" : "hover:bg-black/5"
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        )

      case 'trueOrFalse':
        const isCurrentQuestionAnswered = answered.includes(question.id);
        const currentAnswer = userAnswers[question.id];
        
        console.log('Rendering TrueOrFalse in TestViewer:', {
          questionId: question.id,
          isAnswered: isCurrentQuestionAnswered,
          userAnswer: currentAnswer,
          correctAnswer: question.correctAnswer,
          question
        });

        return (
          <TrueOrFalse
            question={question.question}
            answer={(value: boolean) => {
              if (!isCurrentQuestionAnswered) {
                console.log('Processing TrueOrFalse answer:', {
                  selectedValue: value,
                  correctAnswer: question.correctAnswer,
                  questionId: question.id
                });
                
                const isCorrect = value === question.correctAnswer;
                
                // Actualizar userAnswers antes de handleAnswer
                setUserAnswers(prev => ({
                  ...prev,
                  [question.id]: value
                }));
                
                handleAnswer({
                  isCorrect,
                  questionId: question.id,
                  currentScore: score
                });

                // Mostrar feedback
                setShowFeedback({
                  correct: isCorrect,
                  message: isCorrect ? "¡Correcto!" : "Incorrecto"
                });
              }
            }}
            isAnswered={isCurrentQuestionAnswered}
            selectedAnswer={currentAnswer}
            correctAnswer={isCurrentQuestionAnswered ? question.correctAnswer : undefined}
          />
        )

      case 'multipleChoice':
        console.log('Rendering multipleChoice question:', {
          isAnswered,
          userAnswers,
          questionId: question.id,
          options: question.options
        })
        return (
          <MultipleChoice
            options={question.options || []}
            onSelect={(optionId) => {
              console.log('Option selected:', optionId)
              
              // Prevenir respuestas múltiples
              if (isAnswered) {
                console.log('Question already answered')
                return
              }

              // Encontrar la opción seleccionada
              const selectedOption = question.options?.find(o => o.id === optionId)
              if (!selectedOption) {
                console.log('Selected option not found')
                return
              }

              console.log('Processing answer:', {
                optionId,
                isCorrect: selectedOption.isCorrect,
                questionId: question.id
              })

              // Procesar la respuesta
              handleAnswer({
                isCorrect: selectedOption.isCorrect,
                questionId: question.id,
                currentScore: score
              })

              // Actualizar el estado de la opción seleccionada
              setUserAnswers(prev => ({
                ...prev,
                [question.id]: selectedOption.isCorrect
              }))
            }}
            isAnswered={isAnswered}
            selectedOption={userAnswers[question.id]}
            correctOption={isAnswered ? question.options?.find(o => o.isCorrect)?.id : undefined}
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
                handleAnswer({
                  isCorrect,
                  questionId: question.id,
                  currentScore: score
                })
              }
            }}
            isAnswered={isAnswered}
            selectedPoint={userAnswers[question.id]}
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
    <div className="container mx-auto py-4">
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader className="space-y-2 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">
              {test.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                Question {currentQuestion + 1} of {test.questions.length}
              </span>
              <span className="bg-blue-100 px-2 py-0.5 rounded-full font-medium">
                {score} pts
              </span>
            </div>
          </div>
          
          {!showResults && (
            <Progress 
              value={progress} 
              className="h-1.5 bg-blue-100"
            />
          )}
        </CardHeader>

        <CardContent className="p-6">
          {!showResults && currentQuestionData && (
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {console.log('Rendering question content')}
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">
                  {currentQuestionData.question}
                </h2>
                {currentQuestionData.description && (
                  <p className="text-sm text-muted-foreground">
                    {currentQuestionData.description}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                {console.log('About to render question component')}
                {renderQuestion(currentQuestionData)}
              </div>
            </motion.div>
          )}
        </CardContent>

        <CardFooter className="border-t p-4 flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            size="sm"
            className="w-24"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          {currentQuestion === test.questions.length - 1 ? (
            <Button
              onClick={handleFinish}
              disabled={!answered.includes(test.questions[currentQuestion].id)}
            >
              Finalizar
              <CheckCircle className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!answered.includes(test.questions[currentQuestion].id)}
              size="sm"
              className="w-24"
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardFooter>
      </Card>

      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 right-4 z-50"
          >
            <div className={cn(
              "px-4 py-2 rounded-lg shadow-lg flex items-center gap-2",
              showFeedback.correct 
                ? "bg-green-50 text-green-700 border border-green-200" 
                : "bg-red-50 text-red-700 border border-red-200"
            )}>
              {showFeedback.correct ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
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