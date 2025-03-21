"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Info } from "lucide-react"
import { ImageMap } from "@/components/image-map"
import { motion, AnimatePresence } from "framer-motion"
import type { Test, Area } from "@/lib/test-storage"
import { processGoogleDriveUrl, downloadAndCacheImage } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

interface TestViewerProps {
  test: Test
  onFinish?: () => void
  onDelete?: () => void
}

const defaultScoring = {
  correct: 1,    
  incorrect: 1,  
  retain: 0      
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

  const handleAreaClick = (areaId: string) => {
    if (answered.includes(currentQuestion.id)) return

    const clickedArea = currentQuestion.areas.find((area) => area.id === areaId)
    const scoring = currentQuestion.scoring || { correct: 1, incorrect: 0, retain: 0 }

    if (clickedArea?.isCorrect) {
      setScore((prev) => prev + scoring.correct)
      setShowFeedback({ 
        correct: true, 
        message: `¡Correcto! +${scoring.correct} puntos` 
      })
    } else {
      const pointsLost = Math.max(0, scoring.incorrect - scoring.retain)
      setScore((prev) => Math.max(0, prev - pointsLost))
      setShowFeedback({ 
        correct: false, 
        message: pointsLost > 0 ? `Incorrecto. -${pointsLost} puntos` : "Incorrecto" 
      })
    }

    setAnswered((prev) => [...prev, currentQuestion.id])
    setTimeout(() => setShowFeedback(null), 2000)
  }

  const handleNext = () => {
    if (currentScreen < test.questions.length - 1) {
      setCurrentScreen(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentScreen > 0) {
      setCurrentScreen(prev => prev - 1)
    }
  }

  const getCurrentImage = (): string => {
    return currentQuestion?.image || ""
  }

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const image = event.target as HTMLImageElement
    if (image.naturalWidth > 0 && image.naturalHeight > 0) {
      setDimensions({ width: image.naturalWidth, height: image.naturalHeight })
    }
  }

  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No hay preguntas disponibles</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {currentQuestion.title}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Puntuación: {score}
            </div>
          </div>
          <p className="mt-2 text-muted-foreground">{currentQuestion.description}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-lg font-medium">{currentQuestion.question}</div>

          <div className="relative rounded-lg overflow-hidden border">
            <ImageMap
              src={getCurrentImage()}
              areas={currentQuestion.areas.map(area => ({
                ...area,
                x: area.coords[0],
                y: area.coords[1],
                width: area.coords[2] - area.coords[0],
                height: area.coords[3] - area.coords[1]
              }))}
              onAreaClick={handleAreaClick}
              alt={currentQuestion.title}
              className="w-full h-auto"
              isDrawingMode={false}
              isEditMode={false}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progreso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentScreen === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>

            {isCompleted ? (
              <Button onClick={onFinish}>
                Finalizar
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={currentScreen === test.questions.length - 1}
              >
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
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
              ${showFeedback.correct ? "bg-green-500" : "bg-red-500"}
              text-white
            `}>
              {showFeedback.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
} 