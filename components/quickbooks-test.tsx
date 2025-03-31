"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Info, Edit, Play, Link, Download, Save, Loader2 } from "lucide-react"
import { ImageMap } from "@/components/image-map"
import { QuestionForm } from "./question-form"
import { questionTemplates } from "@/lib/templates"
import { saveTest, exportTest, getTests } from "@/lib/test-storage"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { generateId } from "@/lib/utils"
import type { Area, Test, Question, DragItem, SequenceItem } from "@/lib/test-storage"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { MultipleChoiceEditor } from "@/components/questions/editors/multiple-choice-editor"
import { DragAndDropEditor } from "@/components/questions/editors/drag-and-drop-editor"
import { SequenceEditor } from "@/components/questions/editors/sequence-editor"
import { PointAPoint } from "@/components/questions/viewers/point_a_point"
import { OpenQuestion } from "@/components/questions/viewers/open_question"
import { IdentifyErrors } from "@/components/questions/viewers/Identify_errors"
import { PhraseComplete } from "@/components/questions/viewers/phrase_complete"
import { TrueOrFalseEditor } from "@/components/questions/editors/true_or_false_editor"
import { PointAPointEditor } from "@/components/questions/editors/point_a_point_editor"
import { ImageAreaSelector } from "./image-area-selector"
import { ImageDescriptionEditor } from "@/components/questions/editors/image_description_editor"
import { ImageComparisonEditor } from "@/components/questions/editors/image_comparison_editor"
import { ImageErrorEditor } from "@/components/questions/editors/image_error_editor"
import { ImageHotspotsEditor } from "@/components/questions/editors/image_hotspots_editor"
import { ImageSequenceEditor } from "@/components/questions/editors/image_sequence_editor"

// Definir el tipo MotionDiv para TypeScript
const MotionDiv = motion.div

interface QuickbooksTestProps {
  initialTest?: Test
  isEditMode?: boolean
}

const defaultScoring = {
      correct: 1,
      incorrect: 1,
      retain: 0
    }

const defaultQuestion: Question = {
  id: generateId(),
    title: "New Question",
    description: "Add a description for the question",
    question: "What action should the user perform?",
  image: "",
  type: "clickArea",
    areas: [],
  scoring: defaultScoring
}

const testScreens: Question[] = [defaultQuestion]

// Actualizar el tipo Question para incluir un campo temporal para el archivo local
interface LocalFileInfo {
  file: File;
  localUrl: string;
}

// Modificar la tipificación de Question para admitir _localFile
interface ExtendedQuestion extends Question {
  _localFile?: File;
}

export function QuickbooksTest({ initialTest, isEditMode: initialEditMode = true }: QuickbooksTestProps) {
  const router = useRouter()
  const [screens, setScreens] = useState<ExtendedQuestion[]>(() => {
    if (initialTest?.questions) {
      return initialTest.questions.map((question: Question) => ({
        ...question,
        id: question.id || generateId(),
        image: question.image && question.image.includes('drive.google.com') 
          ? processGoogleDriveUrl(question.image)
          : question.image || '',
        type: question.type || 'clickArea',
        scoring: question.scoring || defaultScoring
      }))
    }
    return testScreens as ExtendedQuestion[]
  })
  const [currentScreen, setCurrentScreen] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState<string[]>([])
  const [showFeedback, setShowFeedback] = useState<{ correct: boolean; message: string } | null>(null)
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [customImages, setCustomImages] = useState<{[key: string]: string}>({})
  const [isEditMode, setIsEditMode] = useState(initialEditMode)
  const [customAreas, setCustomAreas] = useState<{[key: string]: Area[]}>(() => {
    const initial: {[key: string]: Area[]} = {}
    screens.forEach((screen) => {
      initial[screen.id] = []
    })
    return initial
  })
  const [selectedTemplate, setSelectedTemplate] = useState(questionTemplates[0])
  const [testName, setTestName] = useState(initialTest?.name || "")
  const [testDescription, setTestDescription] = useState(initialTest?.description || "")
  const [testMaxScore, setTestMaxScore] = useState(initialTest?.maxScore || 100)
  const [testMinScore, setTestMinScore] = useState(initialTest?.minScore || 60)
  const [testPassingMessage, setTestPassingMessage] = useState(initialTest?.passingMessage || "Congratulations! You have passed the test.")
  const [testFailingMessage, setTestFailingMessage] = useState(initialTest?.failingMessage || "You need to improve to pass the test.")
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [dialogConfig, setDialogConfig] = useState({
    title: "",
    description: "",
    type: "warning" as "warning" | "success"
  })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [test, setTest] = useState<Test | null>(initialTest || null)

  const handleToggleMode = () => {
    setIsEditMode(!isEditMode)
    setIsDrawingMode(false)
    setShowFeedback(null)
  }

  const handleDrawingComplete = (areas: Area[]) => {
    if (!currentScreen) return

    // Actualizar las áreas en la pantalla actual
    setScreens(prevScreens => 
      prevScreens.map(screen => 
        screen.id === currentScreen.id
          ? { ...screen, areas: [...(screen.areas || []), ...areas] }
          : screen
      )
    )

    // Salir del modo de dibujo
    setIsDrawingMode(false)
  }

  const handleAreaClick = (areaId: string) => {
    if (isEditMode) return
    if (isDrawingMode) return
    if (answered.includes(screens[currentScreen].id)) return

    const currentAreas = customAreas[screens[currentScreen].id] || screens[currentScreen].areas
    const clickedArea = currentAreas?.find((area) => area.id === areaId)

    if (clickedArea?.isCorrect) {
      setScore((prev) => prev + 1)
      setShowFeedback({ correct: true, message: "¡Correcto! +1 punto" })
    } else {
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

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: generateId(),
      type: 'clickArea',
      title: "New Question",
      description: "Add a description for the question",
      question: "What action should the user perform?",
      image: "",
      areas: [],
      scoring: {...defaultScoring}
    }

    setScreens(prev => [...prev, newQuestion])
    setCurrentScreen(prev => prev + 1)
    setHasUnsavedChanges(true)
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

  const handleScreenUpdate = (screenIndex: number, updates: Partial<Question>) => {
    setScreens((prevScreens: Question[]) => 
      prevScreens.map((screen: Question) => 
        screen.id === screens[screenIndex].id
          ? { ...screen, ...updates }
          : screen
      )
    )
    setHasUnsavedChanges(true)
  }

  const handleDeleteScreen = (screenIndex: number) => {
    setScreens((prevScreens: Question[]) => 
      prevScreens.filter((screen: Question) => screen.id !== screens[screenIndex].id)
    )
    setHasUnsavedChanges(true)
  }

  const handleTestUpdate = (updates: Partial<Question>) => {
    setScreens((prevScreens: Question[]) => 
      prevScreens.map((screen: Question) => ({ ...screen, ...updates }))
    )
    setHasUnsavedChanges(true)
  }

  const currentTestScreen = screens[currentScreen] || defaultQuestion
  const currentAreas = currentTestScreen.areas || []
  const currentImage = currentTestScreen.image || ""
  const progress = ((currentScreen + 1) / screens.length) * 100
  const isCompleted = answered.length === screens.length

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/google-drive', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await response.json()
      console.log('Image uploaded successfully:', data.url)
      return data.url
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload image to Google Drive',
        variant: 'destructive'
      })
      throw error
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
    if (window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
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

  const handleExportTest = async () => {
    try {
      setIsLoading(true)

      // Procesar las imágenes primero
      const processedScreens = await Promise.all(screens.map(async (screen) => {
        const processedQuestions = await Promise.all(
          (screen.questions || []).map(async (q) => {
            if (q.image?.startsWith('blob:')) {
              try {
                const file = await fetch(q.image).then(res => res.blob()).then(blob => new File([blob], 'image.jpg', { type: blob.type }))
                const driveUrl = await handleImageUpload(file)
                return { ...q, image: driveUrl }
              } catch (error) {
                console.error('Error uploading image:', error)
                return q
              }
            }
            return q
          })
        )
        return { ...screen, questions: processedQuestions }
      }))

      const testData = {
        id: initialTest?.id || generateId(),
        name: testName,
        description: testDescription,
        screens: processedScreens,
                  maxScore: testMaxScore,
                  minScore: testMinScore,
                  passingMessage: testPassingMessage,
        failingMessage: testFailingMessage
      }

      // Guardar en localStorage
      localStorage.setItem(`test_${testData.id}`, JSON.stringify(testData))

      // Subir a Google Drive
      await uploadTestToDrive(testData)

      // Descargar el archivo JSON
      const blob = new Blob([JSON.stringify(testData, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
      a.download = `test_${testData.id}.json`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)

      toast({
        title: 'Test saved',
        description: 'Your test has been saved successfully.',
      })

      // Redirigir a la página principal
      router.push('/')
    } catch (error) {
      console.error('Error saving test:', error)
      toast({
        title: 'Error saving test',
        description: 'There was an error saving your test. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelClick = () => {
    setDialogConfig({
      title: "Do you want to cancel?",
      description: "Unsaved changes will be lost. Are you sure?",
      type: "warning"
    })
    setShowCancelDialog(true)
  }

  // Simplificar la función para limpiar áreas
  const handleClearAllAreas = useCallback(() => {
    const updatedScreens = [...screens]
    updatedScreens[currentScreen].areas = [] // Limpiar áreas del screen actual
    setScreens(updatedScreens)
    
    setHasUnsavedChanges(true)
    toast({
      title: "Areas cleaned",
      description: "All marked areas have been deleted"
    })
  }, [currentScreen, screens])

  // Agregar selector de tipo de pregunta
  const handleQuestionTypeChange = (type: 'clickArea' | 'multipleChoice' | 'dragAndDrop' | 'sequence' | 'pointAPoint' | 'openQuestion' | 'identifyErrors' | 'phraseComplete' | 'trueOrFalse') => {
    handleScreenUpdate(currentScreen, {
      type,
      // Resetear campos específicos según el tipo
      areas: type === 'clickArea' ? [] : undefined,
      options: type === 'multipleChoice' ? [] : undefined,
      sequence: type === 'sequence' ? [] : undefined
    })
  }

  // Actualizar la función handleSaveTest para usar el diálogo de éxito
  const handleSaveTest = async () => {
    try {
      setIsSaving(true)
      
      // Validar datos requeridos
      if (!testName.trim()) {
        toast.error("Test name is required")
        return
      }

      console.log('Current states before save:', {
        testName,
        testDescription,
        screensCount: screens.length,
        maxScore: testMaxScore,
        minScore: testMinScore
      })

      const testData = {
        id: test?.id || generateId(),
        name: testName.trim(),
        description: testDescription.trim(),
        questions: screens,
        maxScore: testMaxScore,
        minScore: testMinScore,
        passingMessage: testPassingMessage.trim(),
        failingMessage: testFailingMessage.trim()
      }

      console.log('Test data prepared:', testData)

      const savedTest = await saveTest(testData)
      console.log('Test saved:', savedTest)

      setTest(savedTest)
      setHasUnsavedChanges(false)
      toast.success("Test saved successfully")
      
    } catch (error) {
      console.error('Error in handleSaveTest:', error)
      toast.error("Failed to save test")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoad = async () => {
    try {
      setIsLoading(true)

      // Cargar directamente desde Airtable
      const tests = await getTests()
      const test = tests.find(t => t.id === initialTest?.id)
      
      if (test) {
        setTest(test)
        setScreens(test.questions)
        setCurrentScreen(0)
        setScore(0)
        setAnswered([])
      }

    } catch (error) {
      console.error('Error loading test:', error)
      toast({
        title: 'Error loading test',
        description: 'There was an error loading your test. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      // Crear objeto de test
      const testToSave: Test = {
        id: test?.id || generateId(),
        name: test?.name || "New Test",
        description: test?.description || "",
        questions: screens.map(screen => ({
          ...screen,
          // Si la imagen es blob, ya debería estar en Airtable
          image: screen.image?.startsWith('blob:') ? '' : screen.image,
        })),
        maxScore,
        minScore,
        passingMessage: test?.passingMessage || "Congratulations!",
        failingMessage: test?.failingMessage || "Try again"
      }

      // Guardar en Airtable
      const savedTest = await saveTest(testToSave)
      
      toast.success("Test saved successfully")
      
      // Actualizar el estado local
      setTest(savedTest)

    } catch (error) {
      console.error('Error saving test:', error)
      toast.error("Error saving test")
    } finally {
      setIsSaving(false)
    }
  }

  const loadInitialTest = async () => {
    if (initialTest?.id) {
      try {
        setIsLoading(true)
        // Cargar test desde Airtable
        const tests = await getTests()
        const test = tests.find(t => t.id === initialTest.id)
        
        if (test) {
          setTest(test)
          setScreens(test.questions)
          setCurrentScreen(0)
          setScore(0)
          setAnswered([])
        }
      } catch (error) {
        console.error('Error loading test:', error)
        toast.error("Error loading test")
      } finally {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    loadInitialTest()
  }, [initialTest?.id])

  // Agregar la función para eliminar imagen de Airtable
  const deleteImageFromAirtable = async (imageUrl: string) => {
    try {
      const response = await fetch('/api/airtable/delete-image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete image')
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      throw error
    }
  }

  return (
    <>
      <MotionDiv
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
                {isEditMode ? "Test Editor" : "Take the test"}
              </CardTitle>
              <div className="flex gap-2">
                {isEditMode && (
                  <>
                    <MotionDiv whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        onClick={handleCancelClick}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </MotionDiv>
                    <MotionDiv whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        onClick={handleExportTest}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Export JSON
                          </>
                        )}
            </Button>
                    </MotionDiv>
                    <MotionDiv whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={handleSaveTest}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Test
                          </>
                        )}
            </Button>
                    </MotionDiv>
                  </>
                )}
                <MotionDiv whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    onClick={handleToggleMode}
                    disabled={isLoading}
                  >
                    {isEditMode ? (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Test Mode
                      </>
                    ) : (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Mode
                      </>
                    )}
                  </Button>
                </MotionDiv>
              </div>
          </div>
      </CardHeader>

        <CardContent className="p-6">
          {isEditMode ? (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Sección de configuración */}
              <MotionDiv 
                className="bg-card rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow"
                whileHover={{ y: -2 }}
              >
                <h3 className="text-lg font-medium mb-4">General configuration</h3>
                <div className="space-y-4">
                <div>
                  <label htmlFor="testName" className="block text-sm font-medium mb-1">
                      Test name *
                  </label>
                  <Input
                    id="testName"
                    value={testName}
                      onChange={(e) => {
                        console.log('Test name changed:', e.target.value)
                        setTestName(e.target.value)
                        setHasUnsavedChanges(true)
                      }}
                      placeholder="Enter test name"
                      required
                  />
                </div>

                <div>
                  <label htmlFor="testDescription" className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <Textarea
                    id="testDescription"
                    value={testDescription}
                      onChange={(e) => {
                        console.log('Test description changed:', e.target.value)
                        setTestDescription(e.target.value)
                        setHasUnsavedChanges(true)
                      }}
                      placeholder="Enter test description"
                      className="h-24"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="maxScore" className="block text-sm font-medium mb-1">
                      Maximum score
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
                      Total score that can be obtained in the test
                    </p>
                  </div>

                  <div>
                    <label htmlFor="minScore" className="block text-sm font-medium mb-1">
                      Minimum score to pass
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
                      Score needed to consider the test as passed
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="passingMessage" className="block text-sm font-medium mb-1">
                      Passing message
                    </label>
                    <Textarea
                      id="passingMessage"
                      value={testPassingMessage}
                      onChange={(e) => setTestPassingMessage(e.target.value)}
                      placeholder="Congratulations! You have passed the test."
                      className="h-20"
                    />
                  </div>

                  <div>
                    <label htmlFor="failingMessage" className="block text-sm font-medium mb-1">
                      Message when failing
                    </label>
                    <Textarea
                      id="failingMessage"
                      value={testFailingMessage}
                      onChange={(e) => setTestFailingMessage(e.target.value)}
                      placeholder="You need to improve to pass the test."
                      className="h-20"
                    />
                  </div>
                </div>
              </MotionDiv>

              {/* Sección de preguntas */}
              <MotionDiv 
                className="bg-card rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow"
                whileHover={{ y: -2 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium">Question {currentScreen + 1} of {screens.length}</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                        onClick={() => handleAddQuestion()}
                    >
                      Add question
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                        onClick={() => handleDeleteScreen(currentScreen)}
                      disabled={screens.length <= 1}
                    >
                      Delete question
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Campos básicos de la pregunta */}
                  <div className="grid gap-4">
                    <div>
                      <label htmlFor="questionTitle" className="block text-sm font-medium mb-1">
                        Question title
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
                        Question
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
                        Description or instructions
                      </label>
                      <Textarea
                        id="questionDescription"
                        value={currentTestScreen.description}
                        onChange={(e) => handleScreenUpdate(currentScreen, { description: e.target.value })}
                        placeholder="Provide instructions or additional context for the question"
                        className="h-24"
                      />
                    </div>
                    </div>

                  {/* Selector de tipo de pregunta */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Question type
                      </label>
                    <Select
                      value={currentTestScreen.type}
                      onValueChange={(value) => handleScreenUpdate(currentScreen, { type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select question type" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Preguntas básicas */}
                        <SelectItem value="clickArea">Click Area</SelectItem>
                        <SelectItem value="multipleChoice">Multiple Choice</SelectItem>
                        <SelectItem value="dragAndDrop">Drag and Drop</SelectItem>
                        <SelectItem value="sequence">Sequence</SelectItem>
                        <SelectItem value="pointAPoint">Point to Point</SelectItem>
                        <SelectItem value="openQuestion">Open Question</SelectItem>
                        <SelectItem value="identifyErrors">Identify Errors</SelectItem>
                        <SelectItem value="phraseComplete">Phrase Complete</SelectItem>
                        <SelectItem value="trueOrFalse">True or False</SelectItem>
                        
                        {/* Preguntas basadas en imágenes */}
                        <SelectItem value="imageDescription">Image Description</SelectItem>
                        <SelectItem value="imageComparison">Image Comparison</SelectItem>
                        <SelectItem value="imageError">Image Error</SelectItem>
                        <SelectItem value="imageHotspots">Image Hotspots</SelectItem>
                        <SelectItem value="imageSequence">Image Sequence</SelectItem>
                      </SelectContent>
                    </Select>
                      </div>

                  {/* Renderizar el editor específico según el tipo */}
                  {currentTestScreen.type === 'clickArea' && (
                    <div className="border-t pt-6">
                      <ImageAreaSelector
                        image={currentTestScreen.image || ''}
                        areas={currentTestScreen.areas || []}
                        onChange={(data) => {
                          console.log('Image area change:', data);
                          
                          // Extraer el archivo local si está presente
                          const { localFile, ...otherData } = data;
                          
                          // Guardar el archivo local en el estado de la pregunta
                          if (localFile) {
                            handleScreenUpdate(currentScreen, {
                              ...otherData,
                              _localFile: localFile 
                            });
                          } else {
                            handleScreenUpdate(currentScreen, otherData);
                          }
                        }}
                        isEditMode={isEditMode}
                        onImageUpload={handleImageUpload}
                      />
                      </div>
                  )}

                  {currentTestScreen.type === 'multipleChoice' && (
                    <div className="border-t pt-6">
                      <MultipleChoiceEditor
                        options={currentTestScreen.options || []}
                        onChange={(options) => handleScreenUpdate(currentScreen, { options })}
                      />
                    </div>
                  )}

                  {currentTestScreen.type === 'dragAndDrop' && (
                    <div className="border-t pt-6">
                      <DragAndDropEditor
                        items={currentTestScreen.items || []}
                        onChange={(items) => handleScreenUpdate(currentScreen, { items })}
                      />
                  </div>
                  )}

                  {currentTestScreen.type === 'sequence' && (
                    <div className="border-t pt-6">
                      <SequenceEditor
                        sequence={currentTestScreen.sequence || []}
                        onChange={(sequence) => handleScreenUpdate(currentScreen, { sequence })}
                      />
                    </div>
                  )}
                  {currentTestScreen.type === 'pointAPoint' && (
                    <div className="border-t pt-6">
                      <PointAPointEditor
                        points={currentTestScreen.points || []}
                        onChange={(points) => handleScreenUpdate(currentScreen, { points })}
                      />
                    </div>
                  )}
                    {currentTestScreen.type === 'openQuestion' && (
                    <div className="border-t pt-6">
                      <OpenQuestion
                        question={currentTestScreen.question}
                        answer={currentTestScreen.answer || ''}
                        onChange={(data) => handleScreenUpdate(currentScreen, data)}
                        isEditMode={true}
                      />
                    </div>
                  )}
                  {currentTestScreen.type === 'identifyErrors' && (
                    <div className="border-t pt-6">
                      <IdentifyErrors
                        question={currentTestScreen.question}
                        answer={currentTestScreen.answer || ''}
                        onChange={(data) => handleScreenUpdate(currentScreen, data)}
                        isEditMode={true}
                      />
                    </div>
                  )}
                  {currentTestScreen.type === 'phraseComplete' && (
                    <div className="border-t pt-6">
                      <PhraseComplete
                        question={currentTestScreen.question}
                        answer={currentTestScreen.answer || ''}
                        onChange={(data) => handleScreenUpdate(currentScreen, data)}
                        isEditMode={true}
                      />
                    </div>
                  )}
                  {currentTestScreen.type === 'trueOrFalse' && (
                    <div className="border-t pt-6">
                      <TrueOrFalseEditor
                        question={currentTestScreen.question}
                        answer={currentTestScreen.correctAnswer || false}
                        onChange={(data) => handleScreenUpdate(currentScreen, { 
                          question: data.question,
                          correctAnswer: data.answer
                        })}
                      />
                    </div>
                  )}
                  {currentTestScreen.type === 'imageDescription' && (
                    <div className="border-t pt-6">
                      <ImageDescriptionEditor
                        imageUrl={currentTestScreen.image || ''}
                        question={currentTestScreen.question}
                        correctDescription={currentTestScreen.correctDescription || ''}
                        keywords={currentTestScreen.keywords || []}
                        onChange={(data) => handleScreenUpdate(currentScreen, data)}
                      />
                    </div>
                  )}
                  {currentTestScreen.type === 'imageComparison' && (
                    <div className="border-t pt-6">
                      <ImageComparisonEditor
                        imageUrl1={currentTestScreen.image || ''}
                        imageUrl2={currentTestScreen.secondImage || ''}
                        question={currentTestScreen.question}
                        differences={currentTestScreen.differences || []}
                        onChange={(data) => handleScreenUpdate(currentScreen, data)}
                      />
                    </div>
                  )}
                  {currentTestScreen.type === 'imageError' && (
                    <div className="border-t pt-6">
                      <ImageErrorEditor
                        imageUrl={currentTestScreen.image || ''}
                        question={currentTestScreen.question}
                        errors={currentTestScreen.errors || []}
                        onChange={(data) => handleScreenUpdate(currentScreen, data)}
                      />
                    </div>
                  )}
                  {currentTestScreen.type === 'imageHotspots' && (
                    <div className="border-t pt-6">
                      <ImageHotspotsEditor
                        imageUrl={currentTestScreen.image || ''}
                        question={currentTestScreen.question}
                        hotspots={currentTestScreen.hotspots || []}
                        onChange={(data) => handleScreenUpdate(currentScreen, data)}
                      />
                    </div>
                  )}
                  {currentTestScreen.type === 'imageSequence' && (
                    <div className="border-t pt-6">
                      <ImageSequenceEditor
                        images={currentTestScreen.sequence || []}
                        question={currentTestScreen.question}
                        onChange={(data) => handleScreenUpdate(currentScreen, data)}
                      />
                    </div>
                  )}
                  {/* Configuración de puntuación */}
                  <div className="border-t pt-6">
                    <h4 className="text-sm font-medium mb-4">Question scoring</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="correctPoints" className="block text-sm font-medium mb-1">
                          Points for correct answer
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
                          Points for incorrect answer
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
                          Points for correct answer
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
                      Example: If you configure "Points for correct answer" = 2, "Points for incorrect answer" = 1, and "Points for correct answer" = 0,
                      then the user will gain 2 points for a correct answer and lose 1 point for an incorrect answer.
                    </p>
                  </div>

                  {/* Botones de acción para la pregunta actual */}
                  <div className="flex justify-end gap-2 mt-4">
                    <Button 
                      variant="outline"
                      onClick={async () => {
                        try {
                          // Si hay una imagen en Airtable, eliminarla
                          if (currentTestScreen.image && !currentTestScreen._localFile) {
                            await deleteImageFromAirtable(currentTestScreen.image)
                          }
                          
                          // Limpiar la imagen local y su URL temporal
                          if (currentTestScreen._localFile) {
                            URL.revokeObjectURL(currentTestScreen.image)
                          }
                          
                          // Actualizar el estado
                          const updatedScreens = [...screens]
                          updatedScreens[currentScreen] = {
                            ...currentTestScreen,
                            image: '', // Limpiar la URL de la imagen
                            _localFile: undefined // Limpiar el archivo local
                          }
                          setScreens(updatedScreens)
                          
                          toast.success("Changes discarded and image deleted")
                        } catch (error) {
                          console.error('Error canceling changes:', error)
                          toast.error("Failed to delete image")
                        }
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>

                    <Button 
                      onClick={async () => {
                        try {
                          setIsSaving(true)
                          const updatedScreens = [...screens]
                          const currentQuestion = updatedScreens[currentScreen]
                          
                          // Si hay imagen local, subirla primero
                          if (currentQuestion._localFile) {
                            try {
                              const uploadedUrl = await uploadImageToAirtable(currentQuestion._localFile)
                              currentQuestion.image = uploadedUrl
                              delete currentQuestion._localFile
                            } catch (error) {
                              // Si falla la subida, limpiar la imagen
                              URL.revokeObjectURL(currentQuestion.image)
                              currentQuestion.image = ''
                              delete currentQuestion._localFile
                              throw error
                            }
                          }
                          
                          setScreens(updatedScreens)
                          setHasUnsavedChanges(true)
                          
                          toast.success("Question saved successfully")
                        } catch (error) {
                          console.error('Error saving question:', error)
                          toast.error("Failed to save question")
                        } finally {
                          setIsSaving(false)
                        }
                      }}
                      disabled={isSaving}
                      className="gap-2"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save Question
                    </Button>
                  </div>

                  {/* Navegación entre preguntas */}
                  <div className="flex justify-center gap-2 pt-4">
                    {screens.map((_, index) => (
                      <MotionDiv
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
                      </MotionDiv>
                    ))}
                  </div>
                </div>
              </MotionDiv>
            </MotionDiv>
          ) : (
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Vista de prueba */}
              <div className="text-center mb-8">
                <MotionDiv 
                  className="text-2xl font-bold"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {currentTestScreen.question}
                </MotionDiv>
                <MotionDiv 
                  className="text-muted-foreground mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {currentTestScreen.description}
                </MotionDiv>
              </div>

              {/* Área de imagen */}
              <MotionDiv
                className="rounded-lg overflow-hidden border shadow-lg"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                {currentImage && (
                    <div className="relative">
                  <ImageMap
                        key={`${currentScreen}-${isDrawingMode}`}
                        src={currentImage}
                    areas={currentAreas}
                      drawingArea={null}
                    onAreaClick={handleAreaClick}
                    alt={`Screenshot of ${currentTestScreen.title}`}
                    className="w-full h-auto border rounded-md"
                    isDrawingMode={isDrawingMode}
                    isEditMode={isEditMode}
                        onError={() => {
                        if (currentImage) {
                          console.error('Failed to load image:', currentImage)
                          toast({
                            title: "Error",
                            description: "Failed to load image. Please try uploading again.",
                            variant: "destructive"
                          })
                        }
                        }}
                      />
                    </div>
                )}
                {!currentImage && isEditMode && (
                  <div className="border rounded-md p-4 text-center text-muted-foreground">
                    Add an image URL to start
            </div>
          )}
              </MotionDiv>
            </MotionDiv>
          )}
      </CardContent>

          {/* Agregar indicador de progreso */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{currentScreen + 1} of {screens.length}</span>
            </div>
            <Progress value={((currentScreen + 1) / screens.length) * 100} />
          </div>

        <CardFooter className="border-t p-6 bg-card">
          <div className="flex justify-between w-full">
            <MotionDiv whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button variant="outline" onClick={handlePrevious} disabled={currentScreen === 0}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
            </MotionDiv>

            <MotionDiv whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              {isCompleted && !isEditMode ? (
          <Button onClick={resetTest}>Restart test</Button>
        ) : (
                <Button onClick={handleNext} disabled={currentScreen === screens.length - 1}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
            </MotionDiv>
          </div>
      </CardFooter>
    </Card>

      {/* Feedback flotante */}
      <AnimatePresence>
        {showFeedback && (
          <MotionDiv
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
          </MotionDiv>
        )}
      </AnimatePresence>
    </MotionDiv>

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