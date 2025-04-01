"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ImageMap } from "./image-map"
import { TrueOrFalse } from "@/components/questions/viewers/true_or_false"
import { MultipleChoice } from "@/components/questions/viewers/multiple-choice"
import { PointAPoint } from "@/components/questions/viewers/point_a_point"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { ResultsDialog } from "./results-dialog"
import type { Area, Test, Question } from "@/lib/test-storage"

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
  const [loadedImages, setLoadedImages] = useState<{ [key: string]: string }>({})
  
  // Placeholder constante para imágenes que fallan o referencias
  const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAMAAABHPGVmAAAA21BMVEUAAAD///+/v7+ZmZmqqqqZmZmfn5+dnZ2ampqcnJycnJybm5ubm5uampqampqampqampqbm5uampqampqbm5uampqampqampqampqampqampqampqampqampqampqampqampqampqampqamp///+YmJiZmZmampqbm5ucnJydnZ2enp6fnp6fn5+gn5+gn6CgoKChoKChoaGioaGioqKjoqKjo6Ojo6SkpKSlpaWmpqanp6eoqKiqqqpTU1MAAAB8A5ZEAAAARnRSTlMAAQIEBQUGBwcLDBMUFRYaGxwdNjxRVVhdYGRnaWptcXV2eHp7fX5/gISGiImKjI2OkJKTlZebnKCio6Slqq+2uL6/xdDfsgWO3gAAAWhJREFUeNrt1sdSwzAUBVAlkRJaGi33il2CYNvpvZP//6OEBVmWM+PIGlbhncWTcbzwNNb1ZwC8mqDZMaENiXBJVGsCE5KUKbE1GZNURlvLjfUTjC17JNvbgYzUW3qpKxJllJYwKyIw0mSsCRlWBkLhDGTJGE3WEF3KEnGdJYRGlrqKtJEn1A0hWp4w1xBNnlA3kFg5wlzD2o0M4a4j0jJEXEciZQh3A9HkCHMD0fOEuI7IyhGxhojyhLiG6HlCXUdYOcLdRER5Qt1AJDnC3MQ6ZQhxHWvJEu4GIsoR6jrWljKEu4VlP9eMeS5wt5CWpV2WNKqUlPMdKo7oa4jEd2qoqM1DpwVGWp0jmqd+7JQYa/oqsnQ4EfWdSsea8O/yCTgc/3FMSLnUwA8xJhQq44HQB1zySOBCZx8Y3H4mJF8XOJTEBELr8IfzXECYf+fQJ0LO16JvRA5PCK92GMP/FIB3YUC2pHrS/6AAAAAASUVORK5CYII=';

  // Función para cargar la imagen real a partir de la referencia
  const loadImageFromReference = async (reference: string) => {
    try {
      console.log('Attempting to load image from reference:', reference);
      
      // Extraer el ID de la referencia (formato es "image_reference__ID")
      const imageId = reference.replace('image_reference_', '');
      
      console.log('Extracted image ID:', imageId);
      
      if (!imageId) {
        console.error('Could not extract image ID from reference:', reference);
        return null;
      }
      
      // URL del backend en Vercel (ajustar a la URL real)
      // Esta URL debe apuntar a tu backend de Vercel
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://quickbooks-backend.vercel.app';
      
      // Intentar obtener la imagen del backend
      console.log('Fetching image from backend:', `${backendUrl}/api/images/${imageId}`);
      
      // Hacer la solicitud al endpoint del backend
      const response = await fetch(`${backendUrl}/api/images/${imageId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching image from backend: ${response.statusText}`);
      }
      
      const imageData = await response.json();
      console.log('Received image data from backend:', imageData);
      
      // El backend debería devolver la URL o los datos de la imagen
      if (imageData.url) {
        return imageData.url;
      } else if (imageData.data) {
        return imageData.data;
      } else {
        console.error('Backend response does not contain image URL or data:', imageData);
        return null;
      }
    } catch (error) {
      console.error('Error loading image from reference:', error);
      return null;
    }
  };

  // Procesar las imágenes
  const processedQuestions = useMemo(() => {
    return test.questions.map(q => {
      // Crear un ID único para la imagen basado en su contenido
      const imageKey = `img_${q.id}_${new Date().getTime()}`;
      
      // Si no hay imagen o la imagen es una cadena vacía, no hay nada que procesar
      if (!q.image) {
        return { ...q, image: '', _imageKey: imageKey, _imageType: 'none' };
      }

      try {
        // SOLUCIÓN: Si es una referencia a imagen (formato usado en Airtable)
        if (typeof q.image === 'string' && q.image.startsWith('image_reference_')) {
          console.log('TestViewer: Found image reference:', q.image);
          
          // Guardar la referencia pero no intentar cargarla inmediatamente
          // La cargaremos cuando sea necesario
          return {
            ...q,
            _imageType: 'reference',
            _imageRef: q.image,
            _imageKey: imageKey,
            // La imagen se cargará dinámicamente cuando se necesite
            image: q.image 
          };
        }
        
        // Si la imagen ya es base64, usarla directamente
        if (typeof q.image === 'string' && q.image.startsWith('data:image/')) {
          console.log('TestViewer: Using base64 image directly');
          return { ...q, image: q.image, _imageKey: imageKey, _imageType: 'base64' };
        }
        
        // Si es una URL blob, conservarla (será manejada por ImageMap si expira)
        if (typeof q.image === 'string' && q.image.startsWith('blob:')) {
          console.log('TestViewer: Using blob URL directly:', q.image.substring(0, 40) + '...');
          
          // Si tenemos datos de imagen en _imageData, son preferibles a la URL blob
          if ((q as any)._imageData) {
            console.log('TestViewer: Using _imageData instead of blob URL');
            return {
              ...q,
              image: (q as any)._imageData,
              _imageKey: imageKey,
              _imageType: 'base64'
            };
          }
          
          return {
            ...q,
            image: q.image,
            _imageKey: imageKey,
            _imageType: 'blob'
          };
        }
        
        // Si tenemos _imageData, usarlo con prioridad sobre otras URLs
        if ((q as any)._imageData) {
          console.log('TestViewer: Using _imageData');
          return {
            ...q,
            image: (q as any)._imageData,
            _imageKey: imageKey,
            _imageType: 'base64'
          };
        }
        
        // Para cualquier otra URL (HTTP, HTTPS, etc.)
        return {
          ...q,
          image: q.image,
          _imageKey: imageKey,
          _imageType: 'url'
        };
      } catch (error) {
        console.error('Error processing image for question', q.id, error);
        return {
          ...q, 
          image: '',
          _imageKey: imageKey,
          _imageType: 'error'
        };
      }
    });
  }, [test.questions]);
  
  const currentQuestionData = processedQuestions[currentQuestion]
  const progress = ((answered.length) / processedQuestions.length) * 100

  // Efecto para cargar la imagen de referencia cuando cambia la pregunta actual
  useEffect(() => {
    const questionData = processedQuestions[currentQuestion];
    if (
      questionData && 
      (questionData as any)._imageType === 'reference' && 
      (questionData as any)._imageRef
    ) {
      const imageRef = (questionData as any)._imageRef;
      
      // Verificar si ya tenemos esta imagen cargada
      if (!loadedImages[imageRef]) {
        console.log('Loading image from reference:', imageRef);
        
        // Cargar la imagen
        loadImageFromReference(imageRef).then(imageData => {
          if (imageData) {
            console.log('Successfully loaded image from reference');
            setLoadedImages(prev => ({
              ...prev,
              [imageRef]: imageData
            }));
          } else {
            console.error('Failed to load image from reference');
          }
        });
      } else {
        console.log('Image already loaded from reference:', imageRef);
      }
    }
  }, [currentQuestion, processedQuestions, loadedImages, loadImageFromReference]);

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
        return (
          <div className="relative">
            {/* Si es una referencia de imagen y tenemos la imagen cargada */}
            {(currentQuestionData as any)._imageType === 'reference' && loadedImages[(currentQuestionData as any)._imageRef] ? (
              <div className="relative border border-border rounded-md overflow-hidden">
                <div 
                  style={{
                    backgroundImage: `url(${loadedImages[(currentQuestionData as any)._imageRef]})`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    width: '100%',
                    height: '350px'
                  }}
                  className="relative"
                >
                  {question.areas?.map((area) => (
                    <div
                      key={area.id}
                      className="absolute cursor-pointer"
                      style={{
                        left: `${area.coords[0]}%`,
                        top: `${area.coords[1]}%`,
                        width: `${area.coords[2] - area.coords[0]}%`,
                        height: `${area.coords[3] - area.coords[1]}%`
                      }}
                      onClick={() => {
                        if (isAnswered) return;
                        handleAnswer(area.isCorrect, question.id);
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Si es una referencia de imagen pero aún no está cargada */}
                {(currentQuestionData as any)._imageType === 'reference' && !loadedImages[(currentQuestionData as any)._imageRef] ? (
                  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                      <span className="text-sm text-gray-500">Cargando imagen...</span>
                    </div>
                  </div>
                ) : (
                  /* Para imágenes normales (no referencias) */
                  <ImageMap
                    src={question.image || ''}
                    areas={question.areas || []} 
                    drawingArea={null}
                    onAreaClick={(areaId) => {
                      if (isAnswered) return
                      const area = question.areas?.find(a => a.id === areaId)
                      handleAnswer(area?.isCorrect || false, question.id)
                    }}
                    alt={question.title}
                    isDrawingMode={false}
                    isEditMode={false}
                    key={(question as any)._imageKey || `question-${question.id}`}
                    onError={() => {
                      console.error('Failed to load image in test view:', question.image);
                      toast.error("Could not load test image. Using a placeholder image instead.");
                    }}
                  />
                )}
              </>
            )}
            
            {/* Mensaje sutil para indicar que se debe hacer clic en la imagen */}
            {!isAnswered && ((currentQuestionData as any)._imageType !== 'reference' || 
                            ((currentQuestionData as any)._imageType === 'reference' && 
                             loadedImages[(currentQuestionData as any)._imageRef])) && (
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
              {/* Solo mostrar la imagen para tipos que no sean clickArea */}
              {currentQuestionData.image && currentQuestionData.type !== 'clickArea' && (
                <div className="relative rounded-lg overflow-hidden">
                  {/* Para referencias de imagen, intentar mostrar la imagen cargada */}
                  {(currentQuestionData as any)._imageType === 'reference' && (
                    <>
                      {loadedImages[(currentQuestionData as any)._imageRef] ? (
                        // Si tenemos la imagen cargada, mostrarla
                        <div
                          style={{
                            backgroundImage: `url(${loadedImages[(currentQuestionData as any)._imageRef]})`,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            width: '100%',
                            height: '300px'
                          }}
                          className="w-full h-auto rounded-lg"
                        ></div>
                      ) : (
                        // Si aún no tenemos la imagen, mostrar un loader
                        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                            <span className="text-sm text-gray-500">Cargando imagen...</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Para imágenes normales (no referencias) */}
                  {(currentQuestionData as any)._imageType !== 'reference' && (
                    <div
                      style={{
                        backgroundImage: `url(${currentQuestionData.image})`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        width: '100%',
                        height: '300px'
                      }}
                      className="w-full h-auto rounded-lg"
                    ></div>
                  )}
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