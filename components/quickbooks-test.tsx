"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Info, Edit, Play, Link, Download, Save } from "lucide-react"
import { ImageMap } from "@/components/image-map"
import { QuestionForm } from "./question-form"
import { questionTemplates } from "@/lib/templates"
import { saveTest, exportTest } from "@/lib/test-storage"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import { processGoogleDriveUrl, downloadAndCacheImage } from "@/lib/utils"
import type { Area } from "@/lib/test-storage" // Importar el tipo Area
import { toast } from "@/components/ui/use-toast"

interface Question {
  id: number
  title: string
  description: string
  question: string
  image: string
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

export function QuickbooksTest({ initialTest, isEditMode: initialEditMode = true }: QuickbooksTestProps) {
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

  const handleImageUrlChange = async (url: string) => {
    if (!url) return
    
    const processedUrl = processGoogleDriveUrl(url)
    console.log('URL original:', url)
    console.log('URL procesada:', processedUrl)
    
    // Descargar y cachear la imagen
    const cachedUrl = await downloadAndCacheImage(processedUrl)
    
    setCustomImages(prev => ({
      ...prev,
      [currentScreen]: cachedUrl
    }))

    handleScreenUpdate(currentScreen, { image: processedUrl })
  }

  const handleToggleMode = () => {
    setIsEditMode(!isEditMode)
    setIsDrawingMode(false)
    setShowFeedback(null)
  }

  const handleDrawingComplete = (coords: number[]) => {
    const newArea = {
      id: `area${Date.now()}`,
      shape: "rect" as const,
      coords: coords,
      isCorrect: true
    }

    if (isEditMode) {
      // En modo edición, actualizamos las áreas en el screen actual
      setScreens(prev => prev.map((screen, index) => 
        index === currentScreen 
          ? { ...screen, areas: [newArea] } // Reemplazar las áreas anteriores
          : screen
      ))
      
      // También actualizamos customAreas para la vista previa
      setCustomAreas(prev => ({
        ...prev,
        [currentScreen]: [newArea]
      }))
    }
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

  const handleSaveTest = () => {
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
        areas: customAreas[screens.indexOf(screen)] || screen.areas,
        image: customImages[screens.indexOf(screen)] || screen.image
      }))
    }

    if (saveTest(test)) {
      toast({
        title: "Test guardado",
        description: "El test se ha guardado correctamente"
      })
    }
  }

  const handleScreenUpdate = (index: number, updates: Partial<typeof screens[0]>) => {
    setScreens(prev => prev.map((screen, i) => 
      i === index ? { ...screen, ...updates } : screen
    ))
  }

  const handleTestUpdate = (updates: Partial<typeof screens[0]>) => {
    setScreens(prev => prev.map((screen, i) => 
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
      setScreens(prev => prev.filter((_, i) => i !== index))
      if (currentScreen >= index) {
        setCurrentScreen(prev => Math.max(0, prev - 1))
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="max-w-4xl mx-auto px-4 py-6"
    >
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-card">
          <motion.div 
            className="flex justify-between items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div>
              <CardTitle className="text-2xl">{testName || "Editor de Test"}</CardTitle>
              <CardDescription className="mt-1">
                {isEditMode ? "Modo edición" : "Modo prueba"}
              </CardDescription>
        </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={handleToggleMode}
                className="shadow-lg hover:shadow-xl transition-shadow"
              >
                {isEditMode ? (
                  <motion.div className="flex items-center gap-2" whileHover={{ x: 5 }}>
                    <Play className="h-4 w-4" />
                    Iniciar prueba
                  </motion.div>
                ) : (
                  <motion.div className="flex items-center gap-2" whileHover={{ x: -5 }}>
                    <Edit className="h-4 w-4" />
                    Modo edición
                  </motion.div>
                )}
              </Button>
            </motion.div>
          </motion.div>

          <motion.div 
            className="w-full mt-4"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3 }}
          >
        <Progress value={progress} className="h-2" />
          </motion.div>

          <div className="flex justify-end gap-2 p-4 border-b">
            <Button
              variant="outline"
              onClick={() => {
                const jsonStr = exportTest({
                  id: initialTest?.id || Date.now().toString(),
                  name: testName,
                  description: testDescription,
                  maxScore: testMaxScore,
                  minScore: testMinScore,
                  passingMessage: testPassingMessage,
                  failingMessage: testFailingMessage,
                  questions: screens.map((screen) => ({
                    ...screen,
                    areas: customAreas[screens.indexOf(screen)] || screen.areas,
                    image: customImages[screens.indexOf(screen)] || screen.image
                  }))
                })
                
                // Crear y descargar el archivo JSON
                const blob = new Blob([jsonStr], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${testName || 'test'}.json`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
              }}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar JSON
            </Button>

            <Button 
              onClick={handleSaveTest}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Guardar Test
            </Button>
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
                          value={customImages[currentScreen] || currentTestScreen.image || ''}
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
          <ImageMap
                        src={currentImage}
                        areas={currentAreas}
            onAreaClick={handleAreaClick}
            alt={`Screenshot of ${currentTestScreen.title}`}
            className="w-full h-auto border rounded-md"
                        isDrawingMode={isDrawingMode}
                        onDrawingComplete={handleDrawingComplete}
                        isEditMode={isEditMode}
                      />
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
                      <Button
                        key={index}
                        variant={currentScreen === index ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentScreen(index)}
                        className="w-10 h-10 rounded-full"
                      >
                        {index + 1}
                      </Button>
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
                  <ImageMap
                    src={currentImage}
                    areas={currentAreas}
                    onAreaClick={handleAreaClick}
                    alt={`Screenshot of ${currentTestScreen.title}`}
                    className="w-full h-auto border rounded-md"
                    isDrawingMode={isDrawingMode}
                    onDrawingComplete={handleDrawingComplete}
                    isEditMode={isEditMode}
                  />
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
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className={`
              px-6 py-3 rounded-full shadow-lg
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
  )
}

