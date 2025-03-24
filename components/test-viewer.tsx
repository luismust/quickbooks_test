"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { ImageMap } from "@/components/image-map"
import { motion, AnimatePresence, Variants } from "framer-motion"
import type { Test, Area } from "@/lib/test-storage"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface TestViewerProps {
  test: Test
  onFinish?: () => void
}

// Crear el MotionButton
const MotionButton = motion(Button)

export function TestViewer({ test, onFinish }: TestViewerProps) {
  const [currentScreen, setCurrentScreen] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState<string[]>([])
  const [attempts, setAttempts] = useState<{[key: string]: number}>({})
  const [showFeedback, setShowFeedback] = useState<{ correct: boolean; message: string } | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isLoadingImages, setIsLoadingImages] = useState(true)
  const [showResults, setShowResults] = useState(false)
  const [finalScore, setFinalScore] = useState({
    score: 0,
    percentage: 0,
    passed: false
  })

  const currentQuestion = test.questions[currentScreen]
  const progress = (currentScreen / test.questions.length) * 100

  // Usar la configuración de puntuación de la pregunta actual o valores por defecto
  const scoring = currentQuestion?.scoring || {
    correct: 1,
    incorrect: 1,
    retain: 0
  }

  // Definimos las variantes de animación
  const cardVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.3
      }
    }
  }

  const contentVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        delay: 0.2,
        duration: 0.3
      }
    }
  }

  const imageVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        delay: 0.3,
        duration: 0.4,
        ease: "easeOut"
      }
    }
  }

  const handleAreaClick = (areaId: string) => {
    if (answered.includes(currentQuestion.id)) return

    const clickedArea = currentQuestion.areas.find(area => area.id === areaId)
    
    if (clickedArea?.isCorrect) {
      // Usar la puntuación configurada en la pregunta
      const points = currentQuestion.scoring?.correct || 1
      setScore(prev => prev + points)
      setShowFeedback({ 
        correct: true, 
        message: `¡Correcto! +${points} puntos` 
      })
    } else {
      const pointsLost = currentQuestion.scoring?.incorrect || 1
      const pointsRetained = currentQuestion.scoring?.retain || 0
      const newScore = Math.max(score - pointsLost + pointsRetained, 0)
      setScore(newScore)
      setShowFeedback({ 
        correct: false, 
        message: `Incorrecto. -${pointsLost} puntos` 
      })
    }

    setAnswered(prev => [...prev, currentQuestion.id])
    setTimeout(() => setShowFeedback(null), 2000)
  }

  const handleNext = () => {
    if (currentScreen < test.questions.length - 1) {
      setCurrentScreen(prev => prev + 1)
      setAnswered([])
    }
  }

  const handlePrevious = () => {
    if (currentScreen > 0) {
      setCurrentScreen(prev => prev - 1)
      setAnswered([])
    }
  }

  const handleTestComplete = () => {
    setIsCompleted(true)
    const maxPossibleScore = test.maxScore || 100
    const minRequiredScore = test.minScore || 60
    const finalPercentage = (score / maxPossibleScore) * 100
    const passed = finalPercentage >= minRequiredScore
    
    setFinalScore({
      score: score,
      percentage: finalPercentage,
      passed: passed
    })
    
    setShowResults(true)
  }

  const resetTest = () => {
    setCurrentScreen(0)
    setScore(0)
    setAnswered([])
    setAttempts({})
    setShowFeedback(null)
    setIsCompleted(false)
    setShowResults(false)
    setFinalScore({
      score: 0,
      percentage: 0,
      passed: false
    })
  }

  // Función para limpiar todas las áreas marcadas
  const clearAllAreas = () => {
    setAnswered([])
    setAttempts({})
    setScore(0)
    toast({
      title: "Áreas limpiadas",
      description: "Se han eliminado todas las áreas marcadas",
    })
  }

    return (
    <>
      <AnimatePresence mode="wait">
    <motion.div
          key={currentScreen}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full"
    >
      <Card>
        <CardHeader>
              <motion.div variants={contentVariants}>
          <CardTitle className="text-2xl font-bold">
            {currentQuestion?.title || "Nueva Pregunta"}
          </CardTitle>
            <p className="text-muted-foreground">
              {currentQuestion?.description || "Agrega una descripción para la pregunta"}
          </p>
              </motion.div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
                <motion.div 
                  variants={imageVariants}
                  className="relative aspect-video rounded-lg overflow-hidden border"
                >
                  {currentQuestion?.image && (
                    <ImageMap
                      src={currentQuestion.image}
                      areas={currentQuestion.areas}
                      onAreaClick={handleAreaClick}
                      alt={currentQuestion.title || ""}
                      hideCorrectAreas={!answered.includes(currentQuestion.id)}
                      onClearAllAreas={clearAllAreas}
                      hasMarkedAreas={answered.length > 0}
                  className="w-full h-full object-contain"
                  onError={() => {
                        setIsLoadingImages(false)
                        toast({
                          title: "Error",
                          description: "No se pudo cargar la imagen",
                          variant: "destructive"
                        })
                      }}
                      onLoad={() => setIsLoadingImages(false)}
                    />
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-between items-center mt-4"
                >
                  <MotionButton 
                    onClick={handlePrevious} 
                    disabled={currentScreen === 0}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChevronLeft className="mr-2" />
                    Anterior
                  </MotionButton>
                  
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                <p className="text-sm text-muted-foreground mb-1">
                  Pregunta {currentScreen + 1} de {test.questions.length}
                </p>
                <p className="font-medium">
                      Puntuación: {score} / {test.maxScore || 100}
                    </p>
                  </motion.div>

                  <MotionButton 
                    onClick={currentScreen === test.questions.length - 1 ? handleTestComplete : handleNext}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {currentScreen === test.questions.length - 1 ? "Finalizar" : "Siguiente"}
                    {currentScreen !== test.questions.length - 1 && <ChevronRight className="ml-2" />}
                  </MotionButton>
                </motion.div>

                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <Progress 
                    value={progress} 
                    className="h-2"
                  />
                </motion.div>
          </div>
        </CardContent>
      </Card>
        </motion.div>
      </AnimatePresence>

      {/* Feedback flotante con animación mejorada */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`
              fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg
              ${showFeedback.correct ? "bg-green-500" : "bg-red-500"}
              text-white
            `}
          >
            {showFeedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialog de resultados con animaciones */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="sm:max-w-[425px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Resultados del Test
                <Badge variant={finalScore.passed ? "default" : "destructive"}>
                  {finalScore.passed ? "Aprobado" : "No Aprobado"}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                {finalScore.passed ? test.passingMessage : test.failingMessage}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Puntuación Final:</span>
                  <span className="text-2xl font-bold">
                    {finalScore.score} / {test.maxScore || 100}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Porcentaje obtenido:</span>
                    <span>{Math.round(finalScore.percentage)}%</span>
                  </div>
                  <Progress 
                    value={finalScore.percentage}
                    className={`h-2 ${
                      finalScore.passed 
                        ? "bg-green-500" 
                        : "bg-red-500"
                    }`}
                  />
                </div>

                <div className="flex justify-between text-sm">
                  <span>Puntuación mínima requerida:</span>
                  <span>{test.minScore || 60}%</span>
                </div>

                <div className="text-sm text-muted-foreground mt-4">
                  <h4 className="font-medium mb-2">Resumen:</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Preguntas totales: {test.questions.length}</li>
                    <li>Áreas correctas encontradas: {answered.length}</li>
                    <li>Intentos realizados: {Object.values(attempts).reduce((a, b) => a + b, 0)}</li>
                  </ul>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={resetTest}
              >
                Intentar de nuevo
              </Button>
              <Button
                onClick={() => {
                  setShowResults(false)
                  onFinish?.()
                }}
              >
                Finalizar
              </Button>
            </DialogFooter>
    </motion.div>
        </DialogContent>
      </Dialog>
    </>
  )
} 