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
import { UserNameDialog } from "./user-name-dialog"
import type { Area, Test, Question } from "@/lib/test-storage"
import { createProxyImage, getBestImageUrl, preloadQuestionImages } from "@/lib/image-utils"
import { IdentifyErrors } from "@/components/questions/viewers/Identify_errors"
import { DragAndDrop } from "@/components/questions/viewers/drag_and_drop"
import { Sequence } from "@/components/questions/viewers/sequence"
import { useRouter } from "next/navigation"

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
    reader.onerror = (e) => reject(new Error('Error reading image'));
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
  const [imageRefreshKey, setImageRefreshKey] = useState(0)
  
  // Estado para el nombre del usuario
  const [userName, setUserName] = useState("")
  const [showUserNameDialog, setShowUserNameDialog] = useState(true)
  const [testStarted, setTestStarted] = useState(false)
  
  const router = useRouter()
  
  // Placeholder constante para imágenes que fallan o referencias
  const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAMAAABHPGVmAAAA21BMVEUAAAD///+/v7+ZmZmqqqqZmZmfn5+dnZ2ampqcnJycnJybm5ubm5uampqampqampqampqbm5uampqampqbm5uampqampqampqampqampqampqampqamp///+YmJiZmZmampqbm5ucnJydnZ2enp6fnp6fn5+gn5+gn6CgoKChoKChoaGioaGioqKjoqKjo6Ojo6SkpKSlpaWmpqanp6eoqKiqqqpTU1MAAAB8A5ZEAAAARnRSTlMAAQIEBQUGBwcLDBMUFRYaGxwdNjxRVVhdYGRnaWptcXV2eHp7fX5/gISGiImKjI2OkJKTlZebnKCio6Slqq+2uL6/xdDfsgWO3gAAAWhJREFUeNrt1sdSwzAUBVAlkRJaGi33il2CYNvpvZP//6OEBVmWM+PIGlbhncWTcbzwNNb1ZwC8mqDZMaENiXBJVGsCE5KUKbE1GZNURlvLjfUTjC17JNvbgYzUW3qpKxJllJYwKyIw0mSsCRlWBkLhDGTJGE3WEF3KEnGdJYRGlrqKtJEn1A0hWp4w1xBNnlA3kFg5wlzD2o0M4a4j0jJEXEciZQh3A9HkCHMD0fOEuI7IyhGxhojyhLiG6HlCXUdYOcLdRER5Qt1AJDnC3MQ6ZQhxHWvJEu4GIsoR6jrWljKEu4VlP9eMeS5wt5CWpV2WNKqUlPMdKo7oa4jEd2qoqM1DpwVGWp0jmqd+7JQYa/oqsnQ4EfWdSsea8O/yCTgc/3FMSLnUwA8xJhQq44HQB1zySOBCZx8Y3H4mJF8XOJTEBELr8IfzXECYf+fQJ0LO16JvRA5PCK92GMP/FIB3YUC2pHrS/6AAAAAASUVORK5CYII=';

  // Asegurarse de que se muestre el diálogo de nombre de usuario
  useEffect(() => {
    // Si no hay nombre de usuario, asegurarse de que el diálogo esté visible
    if (!userName.trim() && !showUserNameDialog) {
      setShowUserNameDialog(true);
    }
  }, [userName, showUserNameDialog]);

  // Efecto para forzar la carga de imágenes al montar el componente
  useEffect(() => {
    // Una vez que el componente se ha montado, forzar una actualización
    // para asegurar que las imágenes se cargan correctamente
    const timerId = setTimeout(() => {
      setImageRefreshKey(prev => prev + 1);
      console.log("Forzando carga inicial de imágenes");
    }, 200);
    
    return () => clearTimeout(timerId);
  }, []); // Solo ejecutar una vez al montar el componente

  // Función mejorada para cargar y procesar la imagen desde URL externa
  const loadAndProcessImage = useCallback(async (url: string): Promise<string> => {
    try {
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
      
      return optimizedImage;
      
    } catch (error) {
      console.error('Error processing image:', error);
      return url; // Devolver la URL original en caso de error
    }
  }, []);

  // Función mejorada para cargar la imagen real a partir de la referencia
  const loadImageFromReference = useCallback(async (reference: string) => {
    try {
      // Extraer el ID de la referencia o usar directamente el imageId
      let imageId;
      if (typeof reference === 'string' && reference.startsWith('image_reference_')) {
        imageId = reference.replace('image_reference_', '');
      } else {
        imageId = reference;
      }
      
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
          // Si la imagen se cargó con éxito, devolver la URL
          resolve(imageUrl);
        };
        
        img.onerror = () => {
          // Intentar con otra URL como último recurso
          const fallbackUrl = `${API_URL}/images?id=${imageId}&redirect=data`;
          
          const fallbackImg = createProxyImage(fallbackUrl);
          
          fallbackImg.onload = () => {
            resolve(fallbackUrl);
          };
          
          fallbackImg.onerror = () => {
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
      const imageKey = `img_${q.id}_${new Date().getTime()}_${imageRefreshKey}`;
      
      // Si no hay imagen o la imagen es una cadena vacía, no hay nada que procesar
      if (!q.image && !q.imageId && !q.blobUrl && !q.imageApiUrl) {
        return { ...q, image: '', _imageKey: imageKey, _imageType: 'none' as const };
      }

      try {
        // Priorizar las diferentes fuentes de imágenes
        // 1. Primero blobUrl (URL directa a Vercel Blob)
        if (q.blobUrl && typeof q.blobUrl === 'string' && q.blobUrl.startsWith('http')) {
          return {
            ...q,
            image: q.blobUrl,
            _imageKey: imageKey,
            _imageType: 'blobUrl' as const
          };
        }

        // 2. Luego imageApiUrl (URL a través de API)
        if (q.imageApiUrl && typeof q.imageApiUrl === 'string' && q.imageApiUrl.startsWith('http')) {
          return {
            ...q,
            image: q.imageApiUrl,
            _imageKey: imageKey,
            _imageType: 'apiUrl' as const
          };
        }

        // 3. Si tenemos imageId, usarlo como referencia
        if (q.imageId) {
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
          return { ...q, image: q.image, _imageKey: imageKey, _imageType: 'base64' as const };
        }
        
        // 5. Si es una URL blob, conservarla 
        if (typeof q.image === 'string' && q.image.startsWith('blob:')) {
          // Si tenemos datos de imagen en _imageData, son preferibles a la URL blob
          if (q._imageData && typeof q._imageData === 'string' && q._imageData.startsWith('data:')) {
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
          return {
            ...q,
            image: q._imageData,
            _imageKey: imageKey,
            _imageType: 'base64' as const
          };
        }

        if (q._localFile && typeof q._localFile === 'string' && q._localFile.startsWith('data:')) {
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
  }, [test.questions, imageRefreshKey]);
  
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
        // Cargar la imagen
        loadImageFromReference(imageRef).then(imageData => {
          if (imageData) {
            setLoadedImages(prev => ({
              ...prev,
              [imageRef]: imageData
            }));
          }
        });
      }
    }
  }, [currentQuestion, processedQuestions, loadedImages, loadImageFromReference]);

  // Efecto para precargar todas las imágenes al inicio
  useEffect(() => {
    const preloadImages = async () => {
      if (processedQuestions.length === 0) return;
      
      try {
        const preloadedImgs = await preloadQuestionImages(processedQuestions);
        
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

  // Función para manejar cuando el usuario proporciona su nombre
  const handleUserNameSubmit = (name: string) => {
    setUserName(name);
    setShowUserNameDialog(false);
    setTestStarted(true);
    
    // Forzar la recarga de las imágenes incrementando el key
    setTimeout(() => {
      setImageRefreshKey(prev => prev + 1);
      console.log("Forzando recarga de imágenes después de enviar el nombre");
    }, 100);
    
    toast.success(`Welcome, ${name}! Your test will start now.`);
  }

  // Función para volver a la lista de tests
  const handleGoBackToTests = () => {
    console.log("Navegando de vuelta a la lista de tests...");
    try {
      // Intenta primero con router.push
      router.push('/tests');
      
      // Como alternativa, también podemos probar con window.location
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          if (window.location.pathname !== '/tests') {
            console.log("Usando window.location como respaldo");
            window.location.href = '/tests';
          }
        }, 200);
      }
    } catch (error) {
      console.error("Error navegando a /tests:", error);
      // Último recurso: recargar la página
      if (typeof window !== 'undefined') {
        window.location.href = '/tests';
      }
    }
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

    // Debug: imprimir el tipo de pregunta y sus propiedades
    console.log(`Question type: ${question.type}`, 
                `Has items: ${Boolean(question.items && question.items.length > 0)}`, 
                `Items: ${JSON.stringify(question.items || [])}`)

    // Normalizar el tipo de pregunta para evitar problemas de case-sensitivity
    const questionType = question.type?.toLowerCase();

    switch (questionType) {
      case 'clickarea':
        // Debug: Información de la imagen
        console.log("Rendering clickArea image", {
          questionId: question.id,
          imageType: (question as any)._imageType,
          imageSrc: getBestImageUrl(question),
          imageRefreshKey
        });
        
        return (
          <div className="relative">
            {/* Si la pregunta tiene imageId o image, utilizar ImageMap */}
            {question.imageId || question.image ? (
                  <>
                  {/* Image map component below */}
                  <ImageMap
                    src={getBestImageUrl(question) || ''}
                    areas={question.areas?.filter(a => {
                      // Filtrar áreas con coordenadas válidas
                      if (!a.coords || a.coords.length < 4) {
                        return false;
                      }
                      
                      // Verificar que no hay valores Infinity o NaN
                      const hasInvalidCoords = a.coords.some(
                        coord => !Number.isFinite(coord) || Number.isNaN(coord)
                      );
                      
                      if (hasInvalidCoords) {
                        return false;
                      }
                      
                      return true;
                    }) || []} 
                    drawingArea={null}
                    onAreaClick={(areaId) => {
                      if (isAnswered) return;
                      
                      // Buscar el área correcta por ID y obtener su propiedad isCorrect
                      const area = question.areas?.find(a => a.id === areaId);
                      
                      if (area) {
                        // Usar específicamente el valor isCorrect del área para determinar si es correcta
                        const isCorrect = area.isCorrect === true;
                        handleAnswer(isCorrect, question.id);
                      } else {
                        handleAnswer(false, question.id);
                      }
                    }}
                    alt={question.title || 'Test question image'}
                    isDrawingMode={false}
                    isEditMode={false}
                    className="w-full h-auto object-contain"
                    key={`question-${question.id}-${currentQuestion}-${imageRefreshKey}`} // Add imageRefreshKey
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
                            
                            // Forzar recarga incrementando la clave
                            setImageRefreshKey(prev => prev + 1);
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
                      handleAnswer(false, question.id);
                    }}
                  />
                  </>
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

      case 'trueorfalse':
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

      case 'multiplechoice':
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

      case 'pointapoint':
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

      case 'draganddrop':
        return (
          <DragAndDrop
            items={question.items || []}
            onAnswer={(isCorrect: boolean) => 
              handleAnswer(isCorrect, question.id)
            }
            isAnswered={isAnswered}
          />
        )

      case 'sequence':
        return (
          <Sequence
            question={question.question}
            answer={question.sequence || []}
            isEditMode={false}
            onAnswerSubmit={(isCorrect: boolean) => 
              handleAnswer(isCorrect, question.id)
            }
          />
        )
        
      case 'identifyerrors':
        return (
          <IdentifyErrors
            question={question.question}
            answer={question.answer || ''}
            code={question.code || ''}
            isEditMode={false}
            onAnswerSubmit={(isCorrect) => 
              handleAnswer(isCorrect, question.id)
            }
          />
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
      {/* Diálogo para solicitar el nombre del usuario - asegurar que siempre se muestre al inicio */}
      {showUserNameDialog && (
        <UserNameDialog 
          isOpen={showUserNameDialog}
          onSubmit={handleUserNameSubmit}
          testName={test.name}
          onClose={handleGoBackToTests}
        />
      )}

      {!showUserNameDialog && (
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
                              height: '350px', // Aumentar altura para mejor visualización
                              minHeight: '300px'
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
                          height: '350px', // Aumentar altura para mejor visualización
                          minHeight: '300px'
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
      )}

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
        userName={userName}
        testName={test.name}
      />
    </div>
  )
} 