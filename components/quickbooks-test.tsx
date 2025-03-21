"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Info, Edit, Play, Link, Download, Save, Loader2 } from "lucide-react"
import { ImageMap } from "@/components/image-map"
import { QuestionForm } from "./question-form"
import { questionTemplates } from "@/lib/templates"
import { saveTest, exportTest } from "@/lib/test-storage"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import { processGoogleDriveUrl, downloadAndCacheImage } from "@/lib/utils"
import type { Area, Test } from "@/lib/test-storage" // Importar el tipo Area y Test
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

interface Question {
  id: number
  title: string
  description: string
  question: string
  image: string
  originalImage?: string
  areas: Area[]
  scoring?: {
    correct: number    // Puntos al acertar
    incorrect: number  // Puntos que se pierden al fallar
    retain: number     // Puntos que se mantienen al fallar
  }
}

// Reemplazar el testScreens inicial con uno más simple
const testScreens = [
  {
    id: 1,
    title: "Nueva Pregunta",
    description: "Agrega una descripción para la pregunta",
    image: "",
    question: "¿Qué acción debe realizar el usuario?",
    areas: [],
    scoring: {
      correct: 1,
      incorrect: 1,
      retain: 0
    }
  }
]

interface QuickbooksTestProps {
  initialTest?: any
  isEditMode?: boolean
}

const defaultScoring = {
  correct: 1,
  incorrect: 1,
  retain: 0
}

const defaultQuestion = {
  id: Date.now(),
  title: "Nueva Pregunta",
  description: "Agrega una descripción para la pregunta",
  question: "¿Qué acción debe realizar el usuario?",
  image: "/placeholder.svg",
  areas: [],
  scoring: {
    correct: 1,
    incorrect: 1,
    retain: 0
  }
};

export function QuickbooksTest({ initialTest, isEditMode: initialEditMode = true }: QuickbooksTestProps) {
  const router = useRouter()
  const [screens, setScreens] = useState(() => {
    if (initialTest?.questions) {
      // Procesar las URLs de las imágenes al cargar el test
      return initialTest.questions.map((question: Question) => ({
        ...question,
        image: question.image.includes('drive.google.com') 
          ? processGoogleDriveUrl(question.image)
          : question.image
      }))
    }
    return testScreens
  })
  const [currentScreen, setCurrentScreen] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState<number[]>([])
  const [showFeedback, setShowFeedback] = useState<{ correct: boolean; message: string } | null>(null)
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [customImages, setCustomImages] = useState<{[key: number]: string}>({})
  const [isEditMode, setIsEditMode] = useState(initialEditMode)
  const [customAreas, setCustomAreas] = useState<{[key: number]: Area[]}>({})
  const [selectedTemplate, setSelectedTemplate] = useState(questionTemplates[0])
  const [testName, setTestName] = useState(initialTest?.name || "")
  const [testDescription, setTestDescription] = useState(initialTest?.description || "")
  const [testMaxScore, setTestMaxScore] = useState(initialTest?.maxScore || 100)
  const [testMinScore, setTestMinScore] = useState(initialTest?.minScore || 60)
  const [testPassingMessage, setTestPassingMessage] = useState(initialTest?.passingMessage || "¡Felicitaciones! Has aprobado el test.")
  const [testFailingMessage, setTestFailingMessage] = useState(initialTest?.failingMessage || "Necesitas mejorar para aprobar el test.")
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [dialogConfig, setDialogConfig] = useState({
    title: "",
    description: "",
    type: "warning" as "warning" | "success"
  })

  const handleImageUrlChange = async (url: string) => {
    try {
      const processedUrl = processGoogleDriveUrl(url);
      const cachedUrl = await downloadAndCacheImage(processedUrl);
      
      handleTestUpdate({
        image: cachedUrl,
        originalImage: url // Guardar la URL original
      });
      
    } catch (error) {
      console.error('Error procesando imagen:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la imagen. Por favor, verifica la URL.",
        variant: "destructive",
      });
    }
  }

  const handleToggleMode = () => {
    setIsEditMode(!isEditMode)
    setIsDrawingMode(false)
    setShowFeedback(null)
  }

  const handleDrawingComplete = (newArea: Area) => {
    if (!isEditMode) return

    setScreens((prev: Question[]) => prev.map((screen, index) => 
      index === currentScreen 
        ? { ...screen, areas: [...(screen.areas || []), newArea] }
        : screen
    ))

    setCustomAreas((prev: { [key: number]: Area[] }) => ({
      ...prev,
      [currentScreen]: [...(prev[currentScreen] || []), newArea]
    }))

    setIsDrawingMode(false)
  }

  const handleAreaClick = (areaId: string) => {
    if (isEditMode) return
    if (isDrawingMode) return
    if (answered.includes(screens[currentScreen].id)) return

    const currentAreas = customAreas[currentScreen] || screens[currentScreen].areas
    const clickedArea = currentAreas.find((area) => area.id === areaId)

    if (clickedArea?.isCorrect) {
      setScore((prev) => prev + 1)
      setShowFeedback({ correct: true, message: "¡Correcto! +1 punto" })
    } else {
      // Verificar si el click está dentro del área dibujada
      const drawnArea = customAreas[currentScreen]?.[0]
      if (drawnArea) {
        const [x1, y1, x2, y2] = drawnArea.coords
        const clickX = parseFloat(areaId.split(',')[0])
        const clickY = parseFloat(areaId.split(',')[1])
        
        if (clickX >= x1 && clickX <= x2 && clickY >= y1 && clickY <= y2) {
          setScore((prev) => prev + 1)
          setShowFeedback({ correct: true, message: "¡Correcto! +1 punto" })
          return
        }
      }

      setScore((prev) => Math.max(0, prev - 1))
      setShowFeedback({ correct: false, message: "Incorrecto. -1 punto" })
    }

    setAnswered((prev) => [...prev, screens[currentScreen].id])
    setTimeout(() => setShowFeedback(null), 2000)
  }

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
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

  const handleImageSelect = (screenIndex: number) => {
    setCurrentScreen(screenIndex)
  }

  const handleAddQuestion = (newQuestion: typeof screens[0]) => {
    const newId = Date.now() + Math.random()
    setScreens((prev: Question[]) => [...prev, { ...newQuestion, id: newId }])
    setCurrentScreen(screens.length)
  }

  const handleTemplateChange = (templateId: string) => {
    const template = questionTemplates.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(template)
      setScreens(template.questions)
      setCurrentScreen(0)
      setScore(0)
      setAnswered([])
      setCustomImages({})
      setCustomAreas({})
    }
  }

  const handleSaveAndExit = async () => {
    setIsLoading(true)
    try {
      const test = {
        id: initialTest?.id || Date.now().toString(),
        name: testName,
        description: testDescription,
        maxScore: testMaxScore,
        minScore: testMinScore,
        passingMessage: testPassingMessage,
        failingMessage: testFailingMessage,
        questions: screens.map((screen: Question) => ({
          ...screen,
          image: screen.originalImage || screen.image,
          areas: customAreas[screens.indexOf(screen)] || screen.areas,
          scoring: screen.scoring || defaultScoring
        }))
      } as Test;

      if (saveTest(test)) {
        setDialogConfig({
          title: "¡Test Guardado!",
          description: "El test se ha guardado correctamente. ¿Deseas volver a la página principal?",
          type: "success"
        })
        setShowSuccessDialog(true)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el test. Inténtalo de nuevo.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleScreenUpdate = (index: number, updates: Partial<typeof screens[0]>) => {
    setScreens((prev: typeof screens) => prev.map((screen: typeof screens[0], i: number) => 
      i === index ? { ...screen, ...updates } : screen
    ))
  }

  const handleTestUpdate = (updates: Partial<typeof screens[0]>) => {
    setScreens((prev: typeof screens) => prev.map((screen: typeof screens[0], i: number) => 
      i === currentScreen ? { ...screen, ...updates } : screen
    ))
  }

  const currentTestScreen = screens[currentScreen]
  const currentImage = customImages[currentScreen] || currentTestScreen.image
  const currentAreas = customAreas[currentScreen] || currentTestScreen.areas
  const progress = ((currentScreen + 1) / screens.length) * 100
  const isCompleted = answered.length === screens.length

  const handleImageUpload = async (file: File, url: string) => {
    try {
      let imageUrl = url
      // ... resto del código ...
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  // Limpiar las URLs al desmontar
  useEffect(() => {
    return () => {
      Object.values(customImages).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch(e.key) {
        case 'ArrowRight':
          handleNext()
          break
        case 'ArrowLeft':
          handlePrevious()
          break
        case 'Escape':
          setIsDrawingMode(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const handleDeleteQuestion = (index: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta pregunta? Esta acción no se puede deshacer.')) {
      setScreens((prev: typeof screens) => prev.filter((_: typeof screens[0], i: number) => i !== index))
      if (currentScreen >= index) {
        setCurrentScreen(prev => Math.max(0, prev - 1))
      }
    }
  }

  // Animaciones para las transiciones
  const pageTransition = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  }

  const handleExportJson = async () => {
    setIsLoading(true)
    try {
      const test = {
        id: initialTest?.id || Date.now().toString(),
        name: testName,
        description: testDescription,
        maxScore: testMaxScore,
        minScore: testMinScore,
        passingMessage: testPassingMessage,
        failingMessage: testFailingMessage,
        questions: screens.map((screen: Question) => ({
          ...screen,
          image: screen.originalImage || screen.image,
          areas: customAreas[screens.indexOf(screen)] || screen.areas,
          scoring: screen.scoring || defaultScoring
        }))
      }

      const jsonStr = JSON.stringify(test, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${testName || 'test'}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setDialogConfig({
        title: "¡Exportación Exitosa!",
        description: "El test se ha exportado correctamente. ¿Deseas volver a la página principal?",
        type: "success"
      })
      setShowSuccessDialog(true)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo exportar el test. Inténtalo de nuevo.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelClick = () => {
    setDialogConfig({
      title: "¿Deseas cancelar?",
      description: "Los cambios no guardados se perderán. ¿Estás seguro?",
      type: "warning"
    })
    setShowCancelDialog(true)
  }

  return (
    <>
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransition}
        className="container mx-auto py-8"
      >
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">
                {isEditMode ? "Editor de Test" : "Realizar Test"}
              </CardTitle>
              <div className="flex gap-2">
                {isEditMode && (
                  <>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        onClick={handleCancelClick}
                        disabled={isLoading}
                      >
                        Cancelar
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        onClick={handleExportJson}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Exportando...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Exportar JSON
                          </>
                        )}
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={handleSaveAndExit}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar y Salir
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </>
                )}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    onClick={handleToggleMode}
                    disabled={isLoading}
                  >
                    {isEditMode ? (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Modo Prueba
                      </>
                    ) : (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        Modo Edición
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {isEditMode ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Sección de configuración */}
                <motion.div 
                  className="bg-card rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow"
                  whileHover={{ y: -2 }}
                >
                  <h3 className="text-lg font-medium mb-4">Configuración general</h3>
                  <div>
                    <label htmlFor="testName" className="block text-sm font-medium mb-1">
                      Nombre del test
                    </label>
                    <Input
                      id="testName"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      placeholder="Nombre del test"
                    />
                  </div>

                  <div>
                    <label htmlFor="testDescription" className="block text-sm font-medium mb-1">
                      Descripción
                    </label>
                    <Textarea
                      id="testDescription"
                      value={testDescription}
                      onChange={(e) => setTestDescription(e.target.value)}
                      placeholder="Descripción del test"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="maxScore" className="block text-sm font-medium mb-1">
                        Puntuación máxima del test
                      </label>
                      <Input
                        id="maxScore"
                        type="number"
                        min="0"
                        value={testMaxScore}
                        onChange={(e) => setTestMaxScore(Number(e.target.value))}
                        placeholder="100"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Puntuación total que se puede obtener en el test
                      </p>
                    </div>

                    <div>
                      <label htmlFor="minScore" className="block text-sm font-medium mb-1">
                        Puntuación mínima para aprobar
                      </label>
                      <Input
                        id="minScore"
                        type="number"
                        min="0"
                        value={testMinScore}
                        onChange={(e) => setTestMinScore(Number(e.target.value))}
                        placeholder="60"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Puntuación necesaria para considerar el test como aprobado
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="passingMessage" className="block text-sm font-medium mb-1">
                        Mensaje al aprobar
                      </label>
                      <Textarea
                        id="passingMessage"
                        value={testPassingMessage}
                        onChange={(e) => setTestPassingMessage(e.target.value)}
                        placeholder="¡Felicitaciones! Has aprobado el test."
                        className="h-20"
                      />
                    </div>

                    <div>
                      <label htmlFor="failingMessage" className="block text-sm font-medium mb-1">
                        Mensaje al no aprobar
                      </label>
                      <Textarea
                        id="failingMessage"
                        value={testFailingMessage}
                        onChange={(e) => setTestFailingMessage(e.target.value)}
                        placeholder="Necesitas mejorar para aprobar el test."
                        className="h-20"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Sección de preguntas */}
                <motion.div 
                  className="bg-card rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow"
                  whileHover={{ y: -2 }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium">Pregunta {currentScreen + 1} de {screens.length}</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddQuestion(defaultQuestion)}
                      >
                        Agregar pregunta
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteQuestion(currentScreen)}
                        disabled={screens.length <= 1}
                      >
                        Eliminar pregunta
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Campos básicos de la pregunta */}
                    <div className="grid gap-4">
                      <div>
                        <label htmlFor="questionTitle" className="block text-sm font-medium mb-1">
                          Título de la pregunta
                        </label>
                        <Input
                          id="questionTitle"
                          value={currentTestScreen.title}
                          onChange={(e) => handleScreenUpdate(currentScreen, { title: e.target.value })}
                          placeholder="Ej: Crear una nueva factura"
                        />
                      </div>

                      <div>
                        <label htmlFor="questionText" className="block text-sm font-medium mb-1">
                          Pregunta
                        </label>
                        <Input
                          id="questionText"
                          value={currentTestScreen.question}
                          onChange={(e) => handleScreenUpdate(currentScreen, { question: e.target.value })}
                          placeholder="Ej: ¿Dónde harías clic para crear una nueva factura?"
                        />
                      </div>

                      <div>
                        <label htmlFor="questionDescription" className="block text-sm font-medium mb-1">
                          Descripción o instrucciones
                        </label>
                        <Textarea
                          id="questionDescription"
                          value={currentTestScreen.description}
                          onChange={(e) => handleScreenUpdate(currentScreen, { description: e.target.value })}
                          placeholder="Proporciona instrucciones o contexto adicional para la pregunta"
                          className="h-24"
                        />
                      </div>

                      {/* URL de imagen movida aquí */}
                      <div className="border-t pt-4">
                        <label htmlFor="imageUrl" className="block text-sm font-medium mb-1">
                          URL de imagen (Google Drive)
                        </label>
                        <div className="flex gap-2">
                          <Input
                            id="imageUrl"
                            placeholder="https://drive.google.com/file/d/..."
                            value={currentTestScreen.image || ''}
                            onChange={(e) => handleImageUrlChange(e.target.value)}
                            type="url"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => window.open('https://drive.google.com', '_blank')}
                            title="Abrir Google Drive"
                          >
                            <Link className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 space-y-1">
                          <p>Asegúrate de que la imagen sea pública en Google Drive</p>
                          <p>Formatos de URL soportados:</p>
                          <ul className="list-disc pl-4">
                            <li>https://drive.google.com/file/d/ID_ARCHIVO/view</li>
                            <li>https://drive.google.com/open?id=ID_ARCHIVO</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Configuración de puntuación */}
                    <div className="border-t pt-6">
                      <h4 className="text-sm font-medium mb-4">Puntuación de la pregunta</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="correctPoints" className="block text-sm font-medium mb-1">
                            Puntos al acertar
                          </label>
                          <Input
                            id="correctPoints"
                            type="number"
                            min="0"
                            value={currentTestScreen.scoring?.correct ?? defaultScoring.correct}
                            onChange={(e) => handleScreenUpdate(currentScreen, {
                              scoring: {
                                ...currentTestScreen.scoring ?? defaultScoring,
                                correct: Number(e.target.value)
                              }
                            })}
                            placeholder="1"
                          />
                        </div>

                        <div>
                          <label htmlFor="incorrectPoints" className="block text-sm font-medium mb-1">
                            Puntos que se pierden
                          </label>
                          <Input
                            id="incorrectPoints"
                            type="number"
                            min="0"
                            value={currentTestScreen.scoring?.incorrect ?? defaultScoring.incorrect}
                            onChange={(e) => handleScreenUpdate(currentScreen, {
                              scoring: {
                                ...currentTestScreen.scoring ?? defaultScoring,
                                incorrect: Number(e.target.value)
                              }
                            })}
                            placeholder="1"
                          />
                        </div>

                        <div>
                          <label htmlFor="retainPoints" className="block text-sm font-medium mb-1">
                            Puntos que se mantienen
                          </label>
                          <Input
                            id="retainPoints"
                            type="number"
                            min="0"
                            value={currentTestScreen.scoring?.retain ?? defaultScoring.retain}
                            onChange={(e) => handleScreenUpdate(currentScreen, {
                              scoring: {
                                ...currentTestScreen.scoring ?? defaultScoring,
                                retain: Number(e.target.value)
                              }
                            })}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Ejemplo: Si configuras "Puntos al acertar" = 2, "Puntos que se pierden" = 1, y "Puntos que se mantienen" = 0,
                        entonces el usuario ganará 2 puntos al acertar y perderá 1 punto al fallar.
                      </p>
                    </div>

                    {/* Área de dibujo */}
                    <div className="border-t pt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-medium">Área correcta</h4>
                        <Button
                          variant="outline"
                          onClick={() => setIsDrawingMode(!isDrawingMode)}
                        >
                          {isDrawingMode ? "Modo selección" : "Dibujar área correcta"}
                        </Button>
                      </div>
                      {currentImage && (
                        <div className="relative">
                          <ImageMap
                            key={`${currentScreen}-${isDrawingMode}`}
                            src={currentTestScreen.image}
                            areas={currentAreas}
                            onAreaClick={handleAreaClick}
                            alt={`Screenshot of ${currentTestScreen.title}`}
                            className="w-full h-auto border rounded-md"
                            isDrawingMode={isDrawingMode}
                            isEditMode={isEditMode}
                            onDrawingComplete={handleDrawingComplete}
                            onError={() => {
                              toast({
                                title: "Error",
                                description: "No se pudo cargar la imagen",
                                variant: "destructive"
                              })
                            }}
                          />
                        </div>
                      )}
                      {!currentImage && (
                        <div className="border rounded-md p-4 text-center text-muted-foreground">
                          Agrega una URL de imagen para comenzar
                        </div>
                      )}
                    </div>

                    {/* Navegación entre preguntas */}
                    <div className="flex justify-center gap-2 pt-4">
                      {screens.map((_, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button
                            variant={currentScreen === index ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentScreen(index)}
                            className="w-8 h-8 p-0"
                          >
                            {index + 1}
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Vista de prueba */}
                <div className="text-center mb-8">
                  <motion.h2 
                    className="text-2xl font-bold"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {currentTestScreen.question}
                  </motion.h2>
                  <motion.p 
                    className="text-muted-foreground mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {currentTestScreen.description}
                  </motion.p>
                </div>

                {/* Área de imagen */}
                <motion.div
                  className="rounded-lg overflow-hidden border shadow-lg"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {currentImage && (
                    <div className="relative">
                      <ImageMap
                        key={`${currentScreen}-${isDrawingMode}`}
                        src={currentTestScreen.image}
                        areas={currentAreas}
                        onAreaClick={handleAreaClick}
                        alt={`Screenshot of ${currentTestScreen.title}`}
                        className="w-full h-auto border rounded-md"
                        isDrawingMode={isDrawingMode}
                        isEditMode={isEditMode}
                        onDrawingComplete={handleDrawingComplete}
                        onError={() => {
                          toast({
                            title: "Error",
                            description: "No se pudo cargar la imagen",
                            variant: "destructive"
                          })
                        }}
                      />
                    </div>
                  )}
                  {!currentImage && isEditMode && (
                    <div className="border rounded-md p-4 text-center text-muted-foreground">
                      Agrega una URL de imagen para comenzar
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </CardContent>

          {/* Agregar indicador de progreso */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Progreso</span>
              <span>{currentScreen + 1} de {screens.length}</span>
            </div>
            <Progress value={((currentScreen + 1) / screens.length) * 100} />
          </div>

          <CardFooter className="border-t p-6 bg-card">
            <div className="flex justify-between w-full">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" onClick={handlePrevious} disabled={currentScreen === 0}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                {isCompleted && !isEditMode ? (
                  <Button onClick={resetTest}>Reiniciar prueba</Button>
                ) : (
                  <Button onClick={handleNext} disabled={currentScreen === screens.length - 1}>
                    Siguiente <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </motion.div>
            </div>
          </CardFooter>
        </Card>

        {/* Feedback flotante */}
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
      </motion.div>

      {/* Diálogo de confirmación para cancelar */}
      <ConfirmationDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title={dialogConfig.title}
        description={dialogConfig.description}
        onConfirm={() => {
          setShowCancelDialog(false)
          router.push("/")
        }}
        type="warning"
      />

      {/* Diálogo de éxito */}
      <ConfirmationDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title={dialogConfig.title}
        description={dialogConfig.description}
        onConfirm={() => {
          setShowSuccessDialog(false)
          router.push("/")
        }}
        type="success"
      />
    </>
  )
}