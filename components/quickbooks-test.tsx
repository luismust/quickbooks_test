"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Info } from "lucide-react"
import { ImageMap } from "@/components/image-map"

// This would be replaced with your actual screenshots
const testScreens = [
  {
    id: 1,
    title: "QuickBooks Dashboard",
    description: "Identify the correct area to create a new invoice",
    image: "/placeholder.svg?height=600&width=800",
    question: "¿Dónde harías clic para crear una nueva factura?",
    areas: [
      { id: "area1", shape: "rect", coords: [50, 100, 150, 150], isCorrect: false },
      { id: "area2", shape: "rect", coords: [200, 150, 300, 200], isCorrect: true },
      { id: "area3", shape: "rect", coords: [400, 200, 500, 250], isCorrect: false },
    ],
  },
  {
    id: 2,
    title: "QuickBooks Menu",
    description: "Find the correct menu option for reports",
    image: "/placeholder.svg?height=600&width=800",
    question: "¿Dónde harías clic para ver los reportes?",
    areas: [
      { id: "area1", shape: "rect", coords: [100, 150, 200, 200], isCorrect: false },
      { id: "area2", shape: "rect", coords: [300, 100, 400, 150], isCorrect: true },
      { id: "area3", shape: "rect", coords: [500, 250, 600, 300], isCorrect: false },
    ],
  },
  {
    id: 3,
    title: "Invoice Creation",
    description: "Select the field to add a customer to an invoice",
    image: "/placeholder.svg?height=600&width=800",
    question: "¿Dónde seleccionarías el cliente para la factura?",
    areas: [
      { id: "area1", shape: "rect", coords: [150, 100, 250, 150], isCorrect: true },
      { id: "area2", shape: "rect", coords: [300, 200, 400, 250], isCorrect: false },
      { id: "area3", shape: "rect", coords: [450, 300, 550, 350], isCorrect: false },
    ],
  },
]

export function QuickbooksTest() {
  const [currentScreen, setCurrentScreen] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState<number[]>([])
  const [showFeedback, setShowFeedback] = useState<{ correct: boolean; message: string } | null>(null)

  const handleAreaClick = (areaId: string) => {
    if (answered.includes(testScreens[currentScreen].id)) return

    const clickedArea = testScreens[currentScreen].areas.find((area) => area.id === areaId)

    if (clickedArea?.isCorrect) {
      setScore((prev) => prev + 1)
      setShowFeedback({ correct: true, message: "¡Correcto! +1 punto" })
    } else {
      setScore((prev) => Math.max(0, prev - 1))
      setShowFeedback({ correct: false, message: "Incorrecto. -1 punto" })
    }

    setAnswered((prev) => [...prev, testScreens[currentScreen].id])

    // Clear feedback after 2 seconds
    setTimeout(() => {
      setShowFeedback(null)
    }, 2000)
  }

  const handleNext = () => {
    if (currentScreen < testScreens.length - 1) {
      setCurrentScreen((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentScreen > 0) {
      setCurrentScreen((prev) => prev - 1)
    }
  }

  const resetTest = () => {
    setCurrentScreen(0)
    setScore(0)
    setAnswered([])
    setShowFeedback(null)
  }

  const currentTestScreen = testScreens[currentScreen]
  const progress = ((currentScreen + 1) / testScreens.length) * 100
  const isCompleted = answered.length === testScreens.length

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{currentTestScreen.title}</CardTitle>
          <Badge variant="outline" className="ml-2">
            Puntuación: {score}
          </Badge>
        </div>
        <CardDescription>{currentTestScreen.description}</CardDescription>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent>
        <div className="relative">
          <h3 className="text-lg font-medium mb-4">{currentTestScreen.question}</h3>

          <ImageMap
            src={currentTestScreen.image || "/placeholder.svg"}
            areas={currentTestScreen.areas}
            onAreaClick={handleAreaClick}
            alt={`Screenshot of ${currentTestScreen.title}`}
            className="w-full h-auto border rounded-md"
          />

          {showFeedback && (
            <div
              className={`absolute top-4 right-4 p-3 rounded-md ${
                showFeedback.correct ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {showFeedback.message}
            </div>
          )}

          {answered.includes(currentTestScreen.id) && (
            <div className="mt-4 p-3 bg-muted rounded-md flex items-start">
              <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>
                {currentTestScreen.areas.find((area) => area.isCorrect)?.isCorrect
                  ? "La respuesta correcta está marcada en el área indicada. Continúa con la siguiente pregunta."
                  : "Inténtalo de nuevo o continúa con la siguiente pregunta."}
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={currentScreen === 0}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
        </Button>

        {isCompleted ? (
          <Button onClick={resetTest}>Reiniciar prueba</Button>
        ) : (
          <Button onClick={handleNext} disabled={currentScreen === testScreens.length - 1}>
            Siguiente <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

