"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Info, Edit, Play, Link, Download, Save, Loader2, Lock } from "lucide-react"
import { ImageMap } from "@/components/image-map"
import { questionTemplates } from "@/lib/templates"
import { saveTest, getTests, editTest, generateId } from "@/lib/test-storage"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { useLocalStorage } from "@/components/local-storage-provider"

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
    description: "",
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
interface ExtendedQuestion extends Omit<Question, '_localFile'> {
  _localFile?: File | string;
  _placeholderApplied?: boolean;
}

// Actualizar el manejo de tipos para que sea más explícito
type QuestionType = 'clickArea' | 'multipleChoice' | 'dragAndDrop' | 'sequence' | 
  'pointAPoint' | 'openQuestion' | 'identifyErrors' | 'phraseComplete' | 
  'trueOrFalse' | 'imageDescription' | 'imageComparison' | 'imageError' | 
  'imageHotspots' | 'imageSequence';

export function QuickbooksTest({ initialTest, isEditMode: initialEditMode = true }: QuickbooksTestProps) {
  const router = useRouter()
  const [screens, setScreens] = useState<ExtendedQuestion[]>(() => {
    if (initialTest?.questions) {
      return initialTest.questions.map((question: Question) => ({
        ...question,
        id: question.id || generateId(),
        image: question.image || '',
        type: question.type || 'clickArea',
        scoring: question.scoring || defaultScoring,
        _localFile: question._localFile
      })) as ExtendedQuestion[]
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
  const [isExporting, setIsExporting] = useState(false);
  const [test, setTest] = useState<Test | null>(initialTest || null)

  // Añadimos useLocalStorage al componente
  const { isStaticMode, saveLocalTest } = useLocalStorage()

  // Array de tipos de preguntas premium
  const premiumQuestionTypes = [
    'imageDescription', 
    'imageComparison', 
    'imageError', 
    'imageHotspots', 
    'imageSequence'
  ];
  
  // Verificar si un tipo de pregunta es premium
  const isPremiumQuestionType = (type: string): boolean => premiumQuestionTypes.includes(type);

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
      description: "",
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
      // Asegurarnos que las preguntas tengan los campos requeridos por ExtendedQuestion
      const validQuestions = template.questions.map(q => ({
        ...q,
        id: typeof q.id === 'string' ? q.id : generateId(),
        type: q.type || 'clickArea',
        scoring: q.scoring || defaultScoring,
      })) as ExtendedQuestion[]
      
      setScreens(validQuestions)
      setCurrentScreen(0)
      setScore(0)
      setAnswered([])
      setCustomImages({})
      setCustomAreas({})
    }
  }

  const handleScreenUpdate = (screenIndex: number, updates: Partial<Question>) => {
    setScreens((prevScreens: ExtendedQuestion[]) => 
      prevScreens.map((screen: ExtendedQuestion, index: number) => 
        index === screenIndex
          ? { ...screen, ...updates }
          : screen
      )
    )
    setHasUnsavedChanges(true)
  }

  const handleDeleteScreen = (screenIndex: number) => {
    // Guardar el número actual de preguntas para ajustar currentScreen después
    const currentCount = screens.length;
    
    // Filtrar las preguntas para eliminar la seleccionada
    const newScreens = screens.filter((_, i) => i !== screenIndex);
    setScreens(newScreens);
    
    // Ajustar el índice de la pregunta actual si es necesario
    if (currentScreen >= screenIndex && currentScreen > 0) {
      // Si la pregunta actual es la que se eliminó o está después, retroceder
      setCurrentScreen(currentScreen - 1);
    } else if (currentScreen >= newScreens.length) {
      // Si después de eliminar, el índice excede el número de preguntas
      setCurrentScreen(Math.max(0, newScreens.length - 1));
    }
    
    setHasUnsavedChanges(true);
    toast.success("Question deleted successfully");
  }

  const handleTestUpdate = (updates: Partial<Question>) => {
    setScreens((prevScreens: ExtendedQuestion[]) => 
      prevScreens.map((screen: ExtendedQuestion) => ({ ...screen, ...updates }))
    )
    setHasUnsavedChanges(true)
  }

  const currentTestScreen = screens[currentScreen] || defaultQuestion
  const currentAreas = currentTestScreen.areas || []
  const currentImage = currentTestScreen.image || ""
  const progress = ((currentScreen + 1) / screens.length) * 100
  const isCompleted = answered.length === screens.length

  // Añadir depuración para la imagen actual
  useEffect(() => {
    if (currentImage) {
      console.log('Current image analysis:', {
        image: currentImage.substring(0, 30) + '...',
        isBase64: currentImage.startsWith('data:image/'),
        isReference: currentImage.startsWith('image_reference_'),
        length: currentImage.length
      });
    }
  }, [currentImage]);

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      setIsLoading(true)
      console.log('Handling image upload for file:', file.name, 'size:', file.size)
      
      // Convertir la imagen a base64 para mostrarla
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        
        reader.onloadend = () => {
          // Resultado como base64 string
          const base64String = reader.result as string
          
          console.log('Image uploaded and converted to base64', {
            fileSize: file.size,
            base64Length: base64String.length,
            base64Preview: base64String.substring(0, 50) + '...'
          })
          
          setIsLoading(false)
          resolve(base64String)
        }
        
        reader.onerror = () => {
          console.error('Error reading the file')
          setIsLoading(false)
          reject(new Error('Error reading the file'))
        }
        
        reader.readAsDataURL(file)
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      setIsLoading(false)
      toast.error('Error uploading image. Please try again.')
      return ''
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
      setScreens((prev: ExtendedQuestion[]) => prev.filter((_: ExtendedQuestion, i: number) => i !== index))
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
      // Usamos otro estado para controlar la exportación
      setIsExporting(true)

      // Procesar las imágenes primero
      const processedScreens = await Promise.all(screens.map(async (screen) => {
        return screen
      }))

      const testData = {
        id: initialTest?.id || generateId(),
        name: testName,
        description: testDescription,
        questions: processedScreens,
                  maxScore: testMaxScore,
                  minScore: testMinScore,
                  passingMessage: testPassingMessage,
        failingMessage: testFailingMessage
      }

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

      toast.success('Test exported successfully')

      // No redirigimos después de exportar
      // router.push('/')
    } catch (error) {
      console.error('Error exporting test:', error)
      toast.error('Error exporting test')
    } finally {
      setIsExporting(false)
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
    toast.success("All marked areas have been deleted")
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
    setIsSaving(true)

    try {
      console.log('handleSaveTest - Starting to process questions')
      console.log('Current screens:', screens.length, 'questions to process')
      
      // Ya no necesitamos procesar las imágenes aquí, porque la función saveTest en lib/test-storage.ts
      // ahora usa prepareQuestionWithImage para cada pregunta con las recomendaciones del backend
      
      const testData: Test = {
        id: test?.id || generateId(),
        name: testName,
        description: testDescription,
        questions: screens, // Enviamos las preguntas sin procesar, saveTest se encargará de convertir las blob URLs
        maxScore: testMaxScore,
        minScore: testMinScore,
        passingMessage: testPassingMessage,
        failingMessage: testFailingMessage
      }

      // En modo estático, guardar en localStorage en lugar de Airtable
      if (isStaticMode) {
        console.log('Static mode: Saving test to localStorage')
        saveLocalTest(testData)
        
        // Actualizar el estado con los datos guardados
        setTest(testData)
        setScreens(testData.questions)
        setHasUnsavedChanges(false)
        
        toast.success("Test saved to local storage")
        
        // Redirigir a la página principal
        router.push('/')
      } else {
        console.log('Saving test with data:', {
          id: testData.id,
          name: testData.name,
          questionsCount: testData.questions.length,
          isEdit: !!initialTest?.id
        })

        // Determinar si es un test nuevo o uno existente para editar
        let savedTest;
        if (initialTest?.id) {
          // Es un test existente, usar editTest
          console.log('Editing existing test with ID:', initialTest.id)
          savedTest = await editTest(testData)
          console.log('Test edited successfully with ID:', savedTest.id)
          toast.success("Test edited successfully")
        } else {
          // Es un test nuevo, usar saveTest
          console.log('Creating new test')
          savedTest = await saveTest(testData)
          console.log('Test created successfully with ID:', savedTest.id)
          toast.success("Test created successfully")
        }

        // Actualizar el estado con los datos guardados
        setTest(savedTest)
        setScreens(savedTest.questions)
        setHasUnsavedChanges(false)
        
        // Redirigir a la página principal
        router.push('/')
      }
    } catch (error) {
      console.error("Error saving test:", error)
      toast.error("Error saving test. Please try again.")
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

  // Crear un nuevo useEffect para manejar imágenes de referencia cuando se cargan
  useEffect(() => {
    const loadImagesForReferences = async () => {
      if (!screens || screens.length === 0) return;

      // Verificar si hay alguna pregunta con referencia a imagen que aún no tiene placeholder
      const needsPlaceholder = screens.some(q => 
        q.isImageReference && 
        q.image && 
        q.image.startsWith('image_reference_')
      );
      
      if (!needsPlaceholder) return;

      console.log('Detected image references in questions, loading placeholders');

      // Crear placeholders para imágenes de referencia
      const updatedScreens = screens.map(q => {
        if (q.isImageReference && q.image && q.image.startsWith('image_reference_')) {
          // Crear un placeholder base64 para la imagen
          const placeholderBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
          return {
            ...q,
            image: placeholderBase64, // Reemplazar la referencia con el placeholder
            _placeholderApplied: true // Marcar que ya se aplicó el placeholder
          };
        }
        return q;
      });

      // Actualizar las pantallas con los placeholders
      setScreens(updatedScreens);
    };

    loadImagesForReferences();
  }, []);  // Solo ejecutar una vez al montar el componente

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
                        disabled={isExporting}
                      >
                        {isExporting ? (
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
                        className="bg-black hover:bg-gray-800 text-white"
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
                  
                  {/* Banner informativo sobre guardar el test */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200 text-blue-700 text-sm">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" /> 
                      <p>
                        <strong>Important:</strong> All changes to questions are saved in the editor only. 
                        Click <strong>Save Test</strong> button at the top when you're finished 
                        to save all your questions at once.
                      </p>
                    </div>
                  </div>

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
                      onFocus={(e) => e.target.select()}
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
                      onFocus={(e) => e.target.select()}
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
                      onFocus={(e) => e.target.select()}
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
                      onFocus={(e) => e.target.select()}
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
                  <h3 className="text-lg font-medium">
                    Question {currentScreen + 1} of {screens.length}
                  </h3>
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

                {/* Asegurar que siempre hay un currentTestScreen válido */}
                {screens.length > 0 && currentScreen < screens.length ? (
                <div className="space-y-6">
                  {/* Campos básicos de la pregunta */}
                  <div className="grid gap-4">
                    <div>
                      <label htmlFor="questionText" className="block text-sm font-medium mb-1">
                        Question
                      </label>
                      <Input
                        id="questionText"
                        value={currentTestScreen.question}
                        onChange={(e) => handleScreenUpdate(currentScreen, { question: e.target.value })}
                          placeholder="Ej: Where would you click to create a new invoice?"
                          onFocus={(e) => e.target.select()}
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
                          placeholder="(Optional) Add additional instructions or context for the question"
                        className="h-24"
                          onFocus={(e) => e.target.select()}
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
                      onValueChange={(value) => {
                        if (isPremiumQuestionType(value)) {
                          // Si es un tipo premium, mostrar toast y no cambiar
                          toast.error("This question type is only available for paying users.");
                          return;
                        }
                        // Si no es premium, permitir el cambio
                        // Forzar el tipo para evitar errores de tipado
                        const validType = value as 'clickArea' | 'multipleChoice' | 'dragAndDrop' | 'sequence' | 
                                               'pointAPoint' | 'openQuestion' | 'identifyErrors' | 'phraseComplete' | 
                                               'trueOrFalse' | 'imageDescription' | 'imageComparison' | 'imageError' | 
                                               'imageHotspots' | 'imageSequence';
                        handleScreenUpdate(currentScreen, { type: validType });
                      }}
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
                        
                          {/* Preguntas basadas en imágenes (premium) */}
                          <SelectItem value="imageDescription">
                            <div className="flex items-center">
                              <Lock className="h-3.5 w-3.5 mr-2 text-amber-500" />
                              Image Description
                            </div>
                          </SelectItem>
                          <SelectItem value="imageComparison">
                            <div className="flex items-center">
                              <Lock className="h-3.5 w-3.5 mr-2 text-amber-500" />
                              Image Comparison
                            </div>
                          </SelectItem>
                          <SelectItem value="imageError">
                            <div className="flex items-center">
                              <Lock className="h-3.5 w-3.5 mr-2 text-amber-500" />
                              Image Error
                            </div>
                          </SelectItem>
                          <SelectItem value="imageHotspots">
                            <div className="flex items-center">
                              <Lock className="h-3.5 w-3.5 mr-2 text-amber-500" />
                              Image Hotspots
                            </div>
                          </SelectItem>
                          <SelectItem value="imageSequence">
                            <div className="flex items-center">
                              <Lock className="h-3.5 w-3.5 mr-2 text-amber-500" />
                              Image Sequence
                            </div>
                          </SelectItem>
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
                          correctAnswer: data.answer
                        })}
                      />
                    </div>
                  )}
                    {/* Para tipos premium, mostrar mensaje de bloqueo en lugar del editor */}
                    {isPremiumQuestionType(currentTestScreen.type) && (
                    <div className="border-t pt-6">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                          <Lock className="h-10 w-10 mx-auto mb-4 text-amber-500" />
                          <h3 className="text-lg font-medium text-amber-700 mb-2">Premium Feature</h3>
                          <p className="text-amber-600 mb-4">
                            This question type is only available for paying users.
                          </p>
                          <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                            Upgrade Now
                          </Button>
                    </div>
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
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Example: If you configure "Points for correct answer" = 2 and "Points for incorrect answer" = 1
                      then the user will gain 2 points for a correct answer and lose 1 point for an incorrect answer.
                    </p>
                  </div>

                  {/* Botones de acción para la pregunta actual */}
                  <div className="flex justify-end gap-2 mt-4">
                      
                  </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No questions available. Please add a question.</p>
                  </div>
                )}

                  {/* Navegación entre preguntas */}
                {screens.length > 0 && (
                    <div className="flex justify-between items-center gap-2 pt-4">
                    <div className="flex flex-wrap gap-2 max-w-full overflow-hidden">
                      {screens.length <= 10 ? (
                        // Si hay 10 o menos preguntas, mostrar todos los botones
                        screens.map((_, index) => (
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
                        ))
                      ) : (
                        // Si hay más de 10 preguntas, mostrar un formato paginado
                        <>
                          {/* Siempre mostrar la primera pregunta */}
                          <MotionDiv
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              variant={currentScreen === 0 ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentScreen(0)}
                              className="w-8 h-8 p-0"
                            >
                              1
                            </Button>
                          </MotionDiv>
                          
                          {/* Si estamos lejos del inicio, mostrar elipsis */}
                          {currentScreen > 3 && (
                            <span className="flex items-center justify-center w-8 text-center">...</span>
                          )}
                          
                          {/* Mostrar 5 botones alrededor de la pregunta actual */}
                          {Array.from({ length: Math.min(5, screens.length) }, (_, i) => {
                            // Calcular qué índices mostrar alrededor de la pregunta actual
                            let index;
                            if (currentScreen <= 2) {
                              // Al inicio, mostrar preguntas 1-5
                              index = i + 1;
                            } else if (currentScreen >= screens.length - 3) {
                              // Al final, mostrar las últimas 5 preguntas
                              index = screens.length - 5 + i;
                            } else {
                              // En el medio, mostrar 2 antes y 2 después
                              index = currentScreen + i - 2;
                            }
                            
                            // Solo mostrar si está en rango y no es la primera ni última pregunta
                            if (index > 0 && index < screens.length - 1 && index < screens.length) {
                              return (
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
                              );
                            }
                            return null;
                          }).filter(Boolean)}
                          
                          {/* Si estamos lejos del final, mostrar elipsis */}
                          {currentScreen < screens.length - 4 && (
                            <span className="flex items-center justify-center w-8 text-center">...</span>
                          )}
                          
                          {/* Siempre mostrar la última pregunta */}
                          <MotionDiv
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              variant={currentScreen === screens.length - 1 ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentScreen(screens.length - 1)}
                              className="w-8 h-8 p-0"
                            >
                              {screens.length}
                            </Button>
                          </MotionDiv>
                        </>
                      )}
                      </div>
                  </div>
                )}
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
                {currentTestScreen.description && 
                 currentTestScreen.description !== currentTestScreen.question && 
                 currentTestScreen.description !== currentTestScreen.title && (
                <MotionDiv 
                  className="text-muted-foreground mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {currentTestScreen.description}
                </MotionDiv>
                )}
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
                          key={`image-map-${currentScreen}-${currentImage.slice(0, 20)}`}
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
                            toast.error("Failed to load image. Please try uploading again.")
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