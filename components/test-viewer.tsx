"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Info } from "lucide-react"
import { ImageMap } from "@/components/image-map"
import { motion, AnimatePresence } from "framer-motion"
import type { Test } from "@/lib/test-storage"
import { processGoogleDriveUrl, downloadAndCacheImage } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface TestViewerProps {
  test: Test
  onFinish?: () => void
  onDelete?: () => void
}

const defaultScoring = {
  correct: 1,    // Por defecto, gana 1 punto al acertar
  incorrect: 1,  // Pierde 1 punto al fallar
  retain: 0      // No mantiene puntos al fallar
}

export function TestViewer({ test, onFinish, onDelete }: TestViewerProps) {
  const [currentScreen, setCurrentScreen] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState<number[]>([])
  const [showFeedback, setShowFeedback] = useState<{ correct: boolean; message: string } | null>(null)
  const [imageError, setImageError] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [processedImages, setProcessedImages] = useState<{[key: string]: string}>({})
  const [cachedImages, setCachedImages] = useState<{[key: string]: string}>({})
  const [maxScore, setMaxScore] = useState(0)
  const [showResults, setShowResults] = useState(false)

  const currentQuestion = test.questions[currentScreen]
  const progress = (currentScreen / test.questions.length) * 100
  const isCompleted = answered.length === test.questions.length

  useEffect(() => {
    const loadImages = async () => {
      const processed = {} as {[key: string]: string}
      const cached = {} as {[key: string]: string}

      for (const question of test.questions) {
        if (question.image.includes('drive.google.com')) {
          const processedUrl = processGoogleDriveUrl(question.image)
          processed[question.id] = processedUrl
          // Descargar y cachear la imagen
          cached[question.id] = await downloadAndCacheImage(processedUrl)
        }
      }
      
      setProcessedImages(processed)
      setCachedImages(cached)
    }

    loadImages()

    // Limpiar las URLs de objeto al desmontar
    return () => {
      Object.values(cachedImages).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [test])

  useEffect(() => {
    // Calcular puntuación máxima al cargar el test
    const total = test.questions.reduce((sum, question) => 
      sum + (question.scoring?.correct ?? 1), 0)
    setMaxScore(total)
  }, [test])

  const getCurrentImage = () => {
    const question = test.questions[currentScreen]
    if (!question.image) return ''
    return cachedImages[question.id] || processedImages[question.id] || question.image
  }

  const handleAreaClick = (areaId: string) => {
    if (answered.includes(currentQuestion.id)) return

    const clickedArea = currentQuestion.areas.find((area) => area.id === areaId)
    const scoring = currentQuestion.scoring ?? defaultScoring

    if (clickedArea?.isCorrect) {
      setScore((prev) => prev + scoring.correct)
      setShowFeedback({ 
        correct: true, 
        message: `¡Correcto! +${scoring.correct} ${scoring.correct === 1 ? 'punto' : 'puntos'}` 
      })
    } else {
      const pointsLost = Math.max(0, scoring.incorrect - scoring.retain)
      setScore((prev) => Math.max(0, prev - pointsLost))
      setShowFeedback({ 
        correct: false, 
        message: pointsLost > 0 
          ? `Incorrecto. -${pointsLost} ${pointsLost === 1 ? 'punto' : 'puntos'}`
          : "Incorrecto. Intenta de nuevo" 
      })
    }

    setAnswered((prev) => [...prev, currentQuestion.id])
    setTimeout(() => setShowFeedback(null), 2000)
  }

  const handleNext = () => {
    if (currentScreen < test.questions.length - 1) {
      setCurrentScreen((prev) => prev + 1)
      setImageError(false)
    } else if (isCompleted) {
      setShowResults(true)
    }
  }

  const handlePrevious = () => {
    if (currentScreen > 0) {
      setCurrentScreen((prev) => prev - 1)
      setImageError(false)
    }
  }

  const resetTest = () => {
    setCurrentScreen(0)
    setScore(0)
    setAnswered([])
    setShowFeedback(null)
    setImageError(false)
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageError(false)
    const img = e.target as HTMLImageElement
    const { naturalWidth, naturalHeight } = img
    const aspectRatio = naturalHeight / naturalWidth
    const width = Math.min(800, window.innerWidth - 48)
    setDimensions({
      width,
      height: width * aspectRatio
    })
  }

  // Agregar componente de resultados
  const ResultsCard = () => {
    const hasPassedTest = score >= test.minScore
    const percentage = ((score / test.maxScore) * 100).toFixed(1)

    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Resultados del Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold">
              {score} / {test.maxScore} puntos
            </h3>
            <p className="text-muted-foreground">
              {percentage}% de acierto
            </p>
            <Badge 
              variant={hasPassedTest ? "default" : "destructive"}
              className="text-base py-1.5"
            >
              {hasPassedTest ? "Aprobado" : "No aprobado"}
            </Badge>
          </div>

          <Progress 
            value={Number(percentage)} 
            className="h-2"
            indicatorColor={hasPassedTest ? "bg-green-600" : "bg-red-600"}
          />

          <div className="p-4 rounded-lg border bg-card text-card-foreground">
            <p className="text-center">
              {hasPassedTest 
                ? (test.passingMessage || "¡Felicitaciones! Has aprobado el test.")
                : (test.failingMessage || `Necesitas al menos ${test.minScore} puntos para aprobar.`)}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Desglose de preguntas:</h4>
            {test.questions.map((question, index) => (
              <div 
                key={question.id}
                className="flex justify-between items-center text-sm p-2 rounded bg-muted"
              >
                <span>Pregunta {index + 1}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={answered.includes(question.id) ? "default" : "outline"}>
                    {answered.includes(question.id) ? "Respondida" : "Sin responder"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {question.scoring.correct} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={onFinish}>
            Finalizar
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (showResults) {
    return <ResultsCard />
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <Card className="w-full">
        <CardHeader className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1 flex-1 min-w-0">
              <CardTitle className="text-xl font-bold truncate">
                {test.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Pregunta {currentScreen + 1} de {test.questions.length}
              </p>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="font-medium">
                Puntuación: {score} / {maxScore}
              </span>
              {onDelete && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de eliminar este test?')) {
                      onDelete()
                    }
                  }}
                >
                  Eliminar
                </Button>
              )}
            </div>
          </div>

          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-medium">{currentQuestion.question}</h3>
            <p className="text-sm text-muted-foreground">{currentQuestion.description}</p>
          </div>

          <div className="w-full border rounded-lg overflow-hidden bg-background">
            <div className="relative" style={{ paddingBottom: '52.25%' }}>
              {getCurrentImage() && (
                <ImageMap
                  src={getCurrentImage()}
                  areas={currentQuestion.areas}
                  onAreaClick={handleAreaClick}
                  alt={currentQuestion.title}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{ objectFit: 'contain', maxHeight: '70vh' }}
                  onError={() => setImageError(true)}
                  onLoad={handleImageLoad}
                  isDrawingMode={false}
                  isEditMode={false}
                />
              )}
              {imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                  <div className="text-center p-4 max-w-md">
                    <p className="text-sm text-muted-foreground mb-2">
                      Error al cargar la imagen
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setImageError(false)}
                    >
                      Reintentar
                    </Button>
                  </div>
                </div>
              )}
              {!getCurrentImage() && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    No hay imagen disponible
                  </p>
                </div>
              )}
            </div>
          </div>

          {answered.includes(currentQuestion.id) && (
            <div className="rounded-lg bg-muted p-4 flex items-start gap-3">
              <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                {currentQuestion.areas.find((area) => area.isCorrect)?.isCorrect
                  ? "¡Correcto! La respuesta está en el área marcada."
                  : "Incorrecto. Intenta de nuevo o continúa con la siguiente pregunta."}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between p-4 sm:p-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentScreen === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          {currentScreen === test.questions.length - 1 ? (
            <Button
              onClick={() => setShowResults(true)}
              variant="default"
            >
              Ver Resultados
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Siguiente
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>

      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 p-4 rounded-lg shadow-lg"
            style={{
              background: showFeedback.correct ? "rgb(220 252 231)" : "rgb(254 226 226)",
              color: showFeedback.correct ? "rgb(22 101 52)" : "rgb(153 27 27)",
            }}
          >
            {showFeedback.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 