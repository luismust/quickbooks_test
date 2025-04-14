"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
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
import { createProxyImage, getBestImageUrl, preloadQuestionImages } from "@/lib/image-utils"

interface Connection {
  start: string
  end: string
}

interface TestViewerProps {
  test: Test
  onFinish?: () => void
}

// Función para leer una imagen como base64
function readImageAsBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(new Error('Error al leer la imagen'));
    reader.readAsDataURL(file);
  });
}

// Función para optimizar imágenes grandes
function optimizeImage(imageData: string, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = function() {
      let width = img.width;
      let height = img.height;
      
      // Redimensionar si es demasiado grande
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round(height * maxWidth / width);
          width = maxWidth;
        } else {
          width = Math.round(width * maxHeight / height);
          height = maxHeight;
        }
      }
      
      // Crear canvas para redimensionar
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Dibujar imagen redimensionada
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a formato comprimido
        const mimeType = imageData.split(';')[0].split(':')[1] || 'image/jpeg';
        const optimizedData = canvas.toDataURL(mimeType, quality);
        
        resolve(optimizedData);
      } else {
        // Si no se pudo obtener contexto 2D, devolver la imagen original
        resolve(imageData);
      }
    };
    img.onerror = () => {
      // En caso de error, devolver la imagen original
      resolve(imageData);
    };
    img.src = imageData;
  });
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
  const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAMAAABHPGVmAAAA21BMVEUAAAD///+/v7+ZmZmqqqqZmZmfn5+dnZ2ampqcnJycnJybm5ubm5uampqampqampqampqbm5uampqampqbm5uampqampqampqampqampqampqampqampqamp///+YmJiZmZmampqbm5ucnJydnZ2enp6fnp6fn5+gn5+gn6CgoKChoKChoaGioaGioqKjoqKjo6Ojo6SkpKSlpaWmpqanp6eoqKiqqqpTU1MAAAB8A5ZEAAAARnRSTlMAAQIEBQUGBwcLDBMUFRYaGxwdNjxRVVhdYGRnaWptcXV2eHp7fX5/gISGiImKjI2OkJKTlZebnKCio6Slqq+2uL6/xdDfsgWO3gAAAWhJREFUeNrt1sdSwzAUBVAlkRJaGi33il2CYNvpvZP//6OEBVmWM+PIGlbhncWTcbzwNNb1ZwC8mqDZMaENiXBJVGsCE5KUKbE1GZNURlvLjfUTjC17JNvbgYzUW3qpKxJllJYwKyIw0mSsCRlWBkLhDGTJGE3WEF3KEnGdJYRGlrqKtJEn1A0hWp4w1xBNnlA3kFg5wlzD2o0M4a4j0jJEXEciZQh3A9HkCHMD0fOEuI7IyhGxhojyhLiG6HlCXUdYOcLdRER5Qt1AJDnC3MQ6ZQhxHWvJEu4GIsoR6jrWljKEu4VlP9eMeS5wt5CWpV2WNKqUlPMdKo7oa4jEd2qoqM1DpwVGWp0jmqd+7JQYa/oqsnQ4EfWdSsea8O/yCTgc/3FMSLnUwA8xJhQq44HQB1zySOBCZx8Y3H4mJF8XOJTEBELr8IfzXECYf+fQJ0LO16JvRA5PCK92GMP/FIB3YUC2pHrS/6AAAAAASUVORK5CYII=';

  // Función mejorada para cargar y procesar la imagen desde URL externa
  const loadAndProcessImage = useCallback(async (url: string): Promise<string> => {
    try {
      console.log('Fetching and processing image from URL:', url);
      
      // Intentar cargar la imagen como un blob
      const response = await fetch(url, {
        headers: {
          'Accept': 'image/*',
        },
        // No incluir credentials para evitar problemas CORS
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`Error fetching image: ${response.status} ${response.statusText}`);
      }

      // Obtener la imagen como blob
      const imageBlob = await response.blob();
      
      // Convertir el blob a base64
      const base64Data = await readImageAsBase64(imageBlob);
      
      // Optimizar la imagen para mejor rendimiento
      const optimizedImage = await optimizeImage(base64Data);
      
      console.log('Successfully processed and optimized image');
      return optimizedImage;
      
    } catch (error) {
      console.error('Error processing image:', error);
      return url; // Devolver la URL original en caso de error
    }
  }, []);

  // Función mejorada para cargar la imagen real a partir de la referencia
  const loadImageFromReference = useCallback(async (reference: string) => {
    try {
      console.log('Attempting to load image from reference:', reference);
      
      // Extraer el ID de la referencia o usar directamente el imageId
      let imageId;
      if (typeof reference === 'string' && reference.startsWith('image_reference_')) {
        imageId = reference.replace('image_reference_', '');
      } else {
        imageId = reference;
      }
      
      console.log('Using image ID:', imageId);
      
      if (!imageId) {
        console.error('Could not extract image ID from reference:', reference);
        return null;
      }
      
      // URL del backend
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickbooks-backend.vercel.app/api';
      
      // Construir URL para obtener la imagen del backend
      const imageUrl = `${API_URL}/images?id=${imageId}&redirect=1`;
      
      // Usar createProxyImage para cargar la imagen con manejo de CORS
      return new Promise<string>((resolve, reject) => {
        const img = createProxyImage(imageUrl);
        
        img.onload = () => {
          console.log('Image loaded successfully via createProxyImage');
          // Si la imagen se cargó con éxito, devolver la URL
          resolve(imageUrl);
        };
        
        img.onerror = () => {
          console.error('Error loading image via createProxyImage');
          
          // Intentar con otra URL como último recurso
          const fallbackUrl = `${API_URL}/images?id=${imageId}&redirect=data`;
          console.log('Trying fallback URL:', fallbackUrl);
          
          const fallbackImg = createProxyImage(fallbackUrl);
          
          fallbackImg.onload = () => {
            console.log('Fallback image loaded successfully');
            resolve(fallbackUrl);
          };
          
          fallbackImg.onerror = () => {
            console.error('Fallback image also failed to load');
            reject(new Error('Failed to load image'));
          };
        };
      });
    } catch (error) {
      console.error('Error loading image from reference:', error);
      return null;
    }
  }, []);

  // Procesar las imágenes
  const processedQuestions = useMemo(() => {
    return test.questions.map(q => {
      // Crear un ID único para la imagen basado en su contenido
      const imageKey = `img_${q.id}_${new Date().getTime()}`;
      
      // Si no hay imagen o la imagen es una cadena vacía, no hay nada que procesar
      if (!q.image && !q.imageId && !q.blobUrl && !q.imageApiUrl) {
        return { ...q, image: '', _imageKey: imageKey, _imageType: 'none' as const };
      }

      try {
        // Priorizar las diferentes fuentes de imágenes
        // 1. Primero blobUrl (URL directa a Vercel Blob)
        if (q.blobUrl && typeof q.blobUrl === 'string' && q.blobUrl.startsWith('http')) {
          console.log('TestViewer: Using blobUrl:', q.blobUrl.substring(0, 40) + '...');
          return {
            ...q,
            image: q.blobUrl,
            _imageKey: imageKey,
            _imageType: 'blobUrl' as const
          };
        }

        // 2. Luego imageApiUrl (URL a través de API)
        if (q.imageApiUrl && typeof q.imageApiUrl === 'string' && q.imageApiUrl.startsWith('http')) {
          console.log('TestViewer: Using imageApiUrl:', q.imageApiUrl.substring(0, 40) + '...');
          return {
            ...q,
            image: q.imageApiUrl,
            _imageKey: imageKey,
            _imageType: 'apiUrl' as const
          };
        }

        // 3. Si tenemos imageId, usarlo como referencia
        if (q.imageId) {
          console.log('TestViewer: Using imageId as reference:', q.imageId);
          return {
            ...q,
            _imageType: 'reference' as const,
            _imageRef: q.imageId,
            _imageKey: imageKey,
            // Mantener la imagen original
            image: q.image 
          };
        }
        
        // 4. Si la imagen ya es base64, usarla directamente
        if (typeof q.image === 'string' && q.image.startsWith('data:image/')) {
          console.log('TestViewer: Using base64 image directly');
          return { ...q, image: q.image, _imageKey: imageKey, _imageType: 'base64' as const };
        }
        
        // 5. Si es una URL blob, conservarla 
        if (typeof q.image === 'string' && q.image.startsWith('blob:')) {
          console.log('TestViewer: Using blob URL directly:', q.image.substring(0, 40) + '...');
          
          // Si tenemos datos de imagen en _imageData, son preferibles a la URL blob
          if (q._imageData && typeof q._imageData === 'string' && q._imageData.startsWith('data:')) {
            console.log('TestViewer: Using _imageData instead of blob URL');
            return {
              ...q,
              image: q._imageData,
              _imageKey: imageKey,
              _imageType: 'base64' as const
            };
          }
          
          return {
            ...q,
            image: q.image,
            _imageKey: imageKey,
            _imageType: 'blob' as const
          };
        }
        
        // 6. Si tenemos _imageData o _localFile, usarlo con prioridad sobre otras URLs
        if (q._imageData && typeof q._imageData === 'string' && q._imageData.startsWith('data:')) {
          console.log('TestViewer: Using _imageData');
          return {
            ...q,
            image: q._imageData,
            _imageKey: imageKey,
            _imageType: 'base64' as const
          };
        }

        if (q._localFile && typeof q._localFile === 'string' && q._localFile.startsWith('data:')) {
          console.log('TestViewer: Using _localFile');
          return {
            ...q,
            image: q._localFile,
            _imageKey: imageKey,
            _imageType: 'base64' as const
          };
        }
        
        // 7. Para cualquier otra URL (HTTP, HTTPS, etc.)
        return {
          ...q,
          image: q.image || '',
          _imageKey: imageKey,
          _imageType: 'url' as const
        };
      } catch (error) {
        console.error('Error processing image for question', q.id, error);
        return {
          ...q, 
          image: '',
          _imageKey: imageKey,
          _imageType: 'error' as const
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

  // Efecto para precargar todas las imágenes al inicio
  useEffect(() => {
    const preloadImages = async () => {
      if (processedQuestions.length === 0) return;
      
      console.log('Preloading images for all questions...');
      
      try {
        const preloadedImgs = await preloadQuestionImages(processedQuestions);
        console.log(`Successfully preloaded ${Object.keys(preloadedImgs).length} images`);
        
        // Almacenar las imágenes precargadas
        const newLoadedImages: {[key: string]: string} = {};
        
        // Procesar cada imagen precargada
        Object.entries(preloadedImgs).forEach(([questionId, img]) => {
          // Si la pregunta tiene imageId, guardar con esa clave
          const question = processedQuestions.find(q => q.id === questionId);
          if (question?.imageId) {
            newLoadedImages[question.imageId] = img.src;
          }
          
          // También guardar con el ID de la pregunta como respaldo
          newLoadedImages[questionId] = img.src;
        });
        
        // Actualizar el estado con las imágenes precargadas
        setLoadedImages(prev => ({
          ...prev,
          ...newLoadedImages
        }));
      } catch (error) {
        console.error('Error preloading images:', error);
      }
    };
    
    preloadImages();
  }, [processedQuestions]);

  const handleAnswer = (isCorrect: boolean, questionId: string, connection?: Connection) => {
    if (answered.includes(questionId) || testCompleted) return
    
    const question = processedQuestions.find(q => q.id === questionId)
    if (!question) return
    
    console.log('handleAnswer called with:', { isCorrect, questionId });
    
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
    
    // Mostrar mensaje global de feedback
    setShowFeedback({
      correct: isCorrect,
      message: isCorrect 
        ? `Correct answer! +${question.scoring?.correct || 1} points` 
        : `Incorrect!`
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

  // Función para procesar blobs de URL a base64
  const processBlobUrl = useCallback(async (blobUrl: string): Promise<string> => {
    try {
      // Obtener el blob desde la URL
      const response = await fetch(blobUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch blob: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Convertir blob a base64
      const base64 = await readImageAsBase64(blob);
      
      // Optimizar la imagen
      return await optimizeImage(base64);
    } catch (error) {
      console.error('Error processing blob URL:', error);
      return blobUrl; // Devolver la URL original en caso de error
    }
  }, []);

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
            {/* Si la pregunta tiene imageId o image, utilizar ImageMap */}
            {question.imageId || question.image ? (
                  <ImageMap
                src={getBestImageUrl(question) || ''}
                    areas={question.areas || []} 
                    drawingArea={null}
                    onAreaClick={(areaId) => {
                      if (isAnswered) return;
                      
                      // Buscar el área correcta por ID y obtener su propiedad isCorrect
                      const area = question.areas?.find(a => a.id === areaId);
                      
                      console.log('Area clicked in TestViewer:', areaId);
                      console.log('Areas available:', question.areas?.map(a => ({ 
                        id: a.id, 
                        isCorrect: a.isCorrect 
                      })));
                      console.log('Found area:', area ? 
                        { id: area.id, isCorrect: area.isCorrect } : 
                        'Area not found');
                      
                      if (area) {
                        // Usar específicamente el valor isCorrect del área para determinar si es correcta
                        const isCorrect = area.isCorrect === true;
                        console.log('Is this answer correct?', isCorrect);
                        handleAnswer(isCorrect, question.id);
                      } else {
                        console.error('Area with ID not found:', areaId);
                        handleAnswer(false, question.id);
                      }
                    }}
                    alt={question.title || 'Test question image'}
                    isDrawingMode={false}
                    isEditMode={false}
                key={`question-${question.id}-${Date.now()}`} // Force reload on re-render
                onError={async () => {
                      console.error('Failed to load image in test view:', question.image);
                  
                  // Intentar cargar usando createProxyImage como último recurso
                  try {
                    // Si hay imageId, intentar cargar directamente desde él
                    if (question.imageId) {
                      const url = await loadImageFromReference(question.imageId);
                      if (url && typeof url === 'string') {
                        // Actualizar la pregunta con la nueva URL
                        const updatedQuestion = { ...question };
                        updatedQuestion.image = url;
                        
                        // Forzar actualización
                        setLoadedImages(prev => ({
                          ...prev,
                          [question.id]: url
                        }));
                      }
                    }
                  } catch (e) {
                    console.error('Error in fallback image loading:', e);
                  }
                  
                  toast.error("Could not load test image. Please try refreshing the page.");
                }}
                // Manejar clics fuera de las áreas definidas
                onClick={(e) => {
                  if (isAnswered) return;
                  
                  console.log('Click outside defined areas, marking as incorrect');
                  handleAnswer(false, question.id);
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                  <span className="text-sm text-gray-500">No image available for this question</span>
                </div>
              </div>
            )}
            
            {/* Mensaje sutil para indicar que se debe hacer clic en la imagen */}
            <div className="absolute bottom-2 left-2 right-2 bg-white bg-opacity-70 p-2 rounded text-sm text-center">
              <p>Click on the image according to the question</p>
            </div>
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
                            <span className="text-sm text-gray-500">Image loading...</span>
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