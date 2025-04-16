"use client"


// Extender el tipo Window para incluir el objeto BlobImageProcessor
declare global {
  interface Window {
    BlobImageProcessor?: {
      processAllBlobImagesInTest: (test: any) => Promise<any>;
      processBlobUrl: (blobUrl: string, imageElement?: HTMLImageElement | null) => Promise<string>;
      getImageDataFromElement: (imageElement: HTMLImageElement) => Promise<string>;
      getImageDataFromBlobUrl: (blobUrl: string) => Promise<string>;
      uploadImageData: (blobUrl: string, imageData: string) => Promise<{url: string, imageId: string}>;
    }
  }
}

export interface Area {
  id: string
  shape: "rect" | "circle" | "poly"
  coords: number[]
  isCorrect: boolean
  x?: number
  y?: number
  width?: number
  height?: number
}

export interface DragItem {
  id: string
  text: string
  order: number
  correctZone: string
}

export interface SequenceItem {
  id: string
  text: string
  order: number
}

export interface Question {
  id: string
  title: string
  description: string
  question: string
  image?: string           // URL principal de la imagen
  imageId?: string         // ID de la imagen en Vercel Blob
  blobUrl?: string         // URL directa a Vercel Blob
  imageApiUrl?: string     // URL alternativa a través de la API
  originalImage?: string
  _localFile?: File | string   // Puede ser un objeto File o una string base64
  _imageData?: string          // Para almacenar datos base64 de la imagen
  isImageReference?: boolean   // Indica si la imagen es una referencia
  imageReference?: string      // Guarda la referencia original a la imagen
  _imageType?: 'reference' | 'base64' | 'url' | 'blob' | 'blobUrl' | 'apiUrl' | 'none' | 'error'  // Tipo de imagen
  _imageRef?: string           // Referencia a imagen (ID o nombre)
  _imageKey?: string           // Clave única para la imagen (para forzar recarga)
  code?: string            // Código con errores para el tipo IdentifyErrors
  answer?: string          // Respuesta correcta para distintos tipos de preguntas
  type: 'clickArea' |
  'multipleChoice' |
  'dragAndDrop' |
  'sequence' |
  'pointAPoint' |
  'openQuestion' |
  'identifyErrors' |
  'phraseComplete' |
  'trueOrFalse' |
  'imageDescription' |
  'imageComparison' |
  'imageError' |
  'imageHotspots' |
  'imageSequence'
  areas?: Area[]
  options?: {
    id: string
    text: string
    isCorrect: boolean
  }[]
  correctAnswer?: boolean
  items?: DragItem[]
  sequence?: SequenceItem[]
  points?: {
    id: string
    text: string
    type: 'left' | 'right'
    correctMatch?: string
  }[]
  scoring: {
    correct: number
    incorrect: number
    retain: number
  }
}

export interface Test {
  id: string
  name: string
  description: string
  questions: Question[]
  maxScore: number     // Puntuación máxima del test
  minScore: number     // Puntuación mínima para aprobar
  passingMessage: string  // Mensaje cuando aprueba
  failingMessage: string  // Mensaje cuando no aprueba
}

export const validateTest = (test: Test): boolean => {
  try {
    if (!test.name || typeof test.name !== 'string') return false
    if (!test.description || typeof test.description !== 'string') return false
    if (!Array.isArray(test.questions)) return false

    for (const question of test.questions) {
      if (!question.id || typeof question.id !== 'string') return false
      if (!question.title || typeof question.title !== 'string') return false
      if (!question.description || typeof question.description !== 'string') return false
      if (!question.question || typeof question.question !== 'string') return false
      if (!question.image || typeof question.image !== 'string') return false
      if (!Array.isArray(question.areas)) return false

      for (const area of question.areas) {
        if (!area.id || typeof area.id !== 'string') return false
        if (area.shape !== 'rect') return false
        if (!Array.isArray(area.coords) || area.coords.length !== 4) return false
        if (typeof area.isCorrect !== 'boolean') return false
      }
    }

    // Validar que las imágenes sean URLs
    const hasValidImages = test.questions.every(question => {
      return question.image ? true : false
    })

    if (!hasValidImages) {
      console.error('Todas las preguntas deben tener imágenes válidas')
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Función para convertir un Blob URL a base64
 * Implementación exacta sugerida por el backend
 */
async function convertBlobUrlToBase64(blobUrl: string): Promise<string | null> {
  try {
    // Paso 1: Obtener el blob desde la URL
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    // Paso 2: Leer el blob como base64 usando FileReader
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error convirtiendo Blob URL a base64:', error);
    return null;
  }
}

// Función para subir una imagen al servidor de Vercel Blob
async function uploadImageToServer(imageData: string, fileName: string = 'question_image.jpg'): Promise<{imageId: string, url: string, blobUrl?: string}> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickbooks-backend.vercel.app/api';
  
  try {
    console.log(`Uploading image to Vercel Blob via ${API_URL}/images?action=upload`);
    
    const response = await fetch(`${API_URL}/images?action=upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': typeof window !== 'undefined' ? window.location.origin : 'https://tests-system.vercel.app'
      },
      body: JSON.stringify({
        imageData: imageData,
        fileName: fileName
      })
      // No usamos credentials para evitar problemas CORS
    });
    
      if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error al subir la imagen: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Image uploaded successfully to Vercel Blob:', result.imageId);
    return result; // Devuelve {imageId, url, blobUrl, ...}
  } catch (error) {
    console.error('Error uploading image to Vercel Blob:', error);
    throw error;
  }
}

/**
 * Función para procesar una pregunta con imagen
 */
async function prepareQuestionWithImage(question: Question): Promise<Question> {
  try {
    // Si no es pregunta de tipo clickArea, no procesar
    if (question.type !== 'clickArea') {
      return question;
    }
    
    console.log(`Procesando imagen para pregunta de tipo clickArea ${question.id}`);
    
    // Si ya tenemos un imageId, no es necesario subir la imagen nuevamente
    // a menos que haya una nueva imagen en _localFile o _imageData
    if (question.imageId && !question._localFile && !question._imageData) {
      console.log('La pregunta ya tiene imageId, no es necesario volver a subir la imagen');
      return question;
    }
    
    // Determinar qué datos de imagen usar
    let imageData: string | null = null;
    let fileName = `question_${question.id}_${Date.now()}.jpg`;
    
    // Caso 1: _localFile como string base64
    if (typeof question._localFile === 'string' && question._localFile.startsWith('data:')) {
      console.log('Usando _localFile (base64) como fuente de imagen');
      imageData = question._localFile;
    } 
    // Caso 2: _imageData como string base64
    else if (typeof question._imageData === 'string' && question._imageData.startsWith('data:')) {
      console.log('Usando _imageData como fuente de imagen');
      imageData = question._imageData;
    }
    // Caso 3: URL blob que necesita ser convertida a base64
    else if (question.image && question.image.startsWith('blob:')) {
      console.log('Convirtiendo blob URL a base64');
      imageData = await convertBlobUrlToBase64(question.image);
    }
    
    // Si tenemos datos de imagen, procesarlos y subirlos
    if (imageData) {
      // Optimizar la imagen si es posible
      try {
        if (typeof window !== 'undefined') {
          // Función para optimizar imágenes grandes
          const optimizeImage = async (data: string, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<string> => {
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
                  const mimeType = data.split(';')[0].split(':')[1] || 'image/jpeg';
                  const optimizedData = canvas.toDataURL(mimeType, quality);
                  
                  resolve(optimizedData);
                } else {
                  // Si no se pudo obtener contexto 2D, devolver la imagen original
                  resolve(data);
                }
              };
              img.onerror = () => {
                // En caso de error, devolver la imagen original
                resolve(data);
              };
              img.src = data;
            });
          };
          
          console.log('Optimizando imagen antes de subir');
          imageData = await optimizeImage(imageData);
          console.log('Imagen optimizada correctamente');
        }
      } catch (optimizeError) {
        console.warn('No se pudo optimizar la imagen, usando original:', optimizeError);
      }
      
      // Subir la imagen al servidor
      try {
        console.log('Subiendo imagen al servidor');
        const uploadResult = await uploadImageToServer(imageData, fileName);
        
        // Actualizar la pregunta con los datos de la imagen
        const processedQuestion: Question = { ...question };
        processedQuestion.imageId = uploadResult.imageId;
        processedQuestion.blobUrl = uploadResult.blobUrl || uploadResult.url;
        processedQuestion.image = uploadResult.url;
        
        // Limpiar los datos de imagen locales para no enviarlos al backend
        processedQuestion._localFile = undefined;
        processedQuestion._imageData = undefined;
        
        console.log('Imagen subida correctamente. ID:', uploadResult.imageId);
        return processedQuestion;
      } catch (uploadError) {
        console.error('Error al subir la imagen:', uploadError);
        throw uploadError;
      }
    }
    
    // Si llegamos aquí, no había datos nuevos de imagen para subir
    return question;
  } catch (error) {
    console.error('Error procesando imagen para pregunta', question.id, error);
    // En caso de error devolver la pregunta original
    return question;
  }
}

// URL base de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickbooks-backend.vercel.app/api';

/**
 * Carga un test específico desde la API
 */
export const loadTestFromAPI = async (testId: string): Promise<Test | null> => {
  try {
    // Usar el nuevo endpoint load-tests que ofrece mayor compatibilidad con imágenes
    const apiUrl = `${API_BASE_URL}/load-tests?id=${testId}`;
    console.log(`Loading test from API: ${apiUrl}`);
    
    // Configurar los headers según lo que acepta Vercel en su configuración
    const response = await fetch(apiUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': typeof window !== 'undefined' ? window.location.origin : 'https://tests-system.vercel.app'
      }
    });

    if (!response.ok) {
      console.error('Error cargando test desde API:', response.statusText);
      return null;
    }

    const test = await response.json();
    
    // Procesar las imágenes para asegurar compatibilidad
    if (test && test.questions) {
      test.questions = test.questions.map((question: Question) => {
        const processedQuestion = { ...question };
        
        // Priorizar blobUrl si está disponible (URL directa a Vercel Blob)
        if (question.blobUrl && question.blobUrl.startsWith('http')) {
          console.log(`Question ${question.id}: Using direct blob URL`);
          processedQuestion.image = question.blobUrl;
        }
        // Si no hay blobUrl pero hay imageApiUrl, usarla como respaldo
        else if (question.imageApiUrl && question.imageApiUrl.startsWith('http')) {
          console.log(`Question ${question.id}: Using API URL`);
          processedQuestion.image = question.imageApiUrl;
        }
        // Si no hay ninguna URL específica pero hay imagen estándar, usarla
        else if (question.image && question.image.startsWith('http')) {
          console.log(`Question ${question.id}: Using standard image URL`);
          // La imagen ya está asignada correctamente
        }
        // Si hay imageId pero faltan URLs, construir URL a partir del ID
        else if (question.imageId) {
          console.log(`Question ${question.id}: Constructing URL from imageId`);
          processedQuestion.imageApiUrl = `${API_BASE_URL}/images?id=${question.imageId}&redirect=1`;
          // Si no hay imagen principal, usar la construida
          if (!processedQuestion.image) {
            processedQuestion.image = processedQuestion.imageApiUrl;
          }
        }
        
        return processedQuestion;
      });
    }
    
    // Opcionalmente cachear en localStorage
    try {
      // Guardar en localStorage para acceso offline
      const savedTests = JSON.parse(localStorage.getItem('saved-tests') || '[]');
      const existingIndex = savedTests.findIndex((t: Test) => t.id === test.id);
      
      if (existingIndex >= 0) {
        savedTests[existingIndex] = test;
      } else {
        savedTests.push(test);
      }
      
      localStorage.setItem('saved-tests', JSON.stringify(savedTests));
    } catch (localStorageError) {
      console.warn('No se pudo guardar en localStorage:', localStorageError);
    }
    
    return test;
  } catch (error) {
    console.error('Error cargando test desde API:', error);
    
    // Intentar cargar desde localStorage como fallback
    return loadTestFromLocalStorage(testId);
  }
};

/**
 * Carga un test desde localStorage (fallback)
 */
export const loadTestFromLocalStorage = (testId: string): Test | null => {
  try {
    if (typeof window === "undefined") return null;

    const tests = JSON.parse(localStorage.getItem('saved-tests') || '[]');
    const test = tests.find((t: Test) => t.id === testId);

    if (!test) {
      console.log('Test no encontrado en localStorage:', testId);
      return null;
    }

    return test;
  } catch (error) {
    console.error('Error cargando test desde localStorage:', error);
    return null;
  }
};

/**
 * Carga todos los tests desde la API
 */
export const loadTestsFromAPI = async () => {
  try {
    // Usar el endpoint específico para cargar tests
    const apiUrl = `${API_BASE_URL}/load-tests`;
    console.log(`Loading tests from API: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': typeof window !== 'undefined' ? window.location.origin : 'https://tests-system.vercel.app'
      }
    });

    if (!response.ok) {
      console.error(`Error loading tests from API: ${response.status} ${response.statusText}`);
      return loadTestsFromLocalStorage();
    }

    const data = await response.json();
    const rawTests = data.tests || [];
    
    // Procesar las imágenes en cada test
    const tests = rawTests.map((test: Test) => {
      // Procesar cada pregunta para tener URLs de imagen correctas
      const processedQuestions = test.questions.map((question: Question) => {
        const processedQuestion = { ...question };
        
        // Priorizar blobUrl si está disponible (URL directa a Vercel Blob)
        if (question.blobUrl && question.blobUrl.startsWith('http')) {
          console.log(`Question ${question.id}: Using direct blob URL`);
          processedQuestion.image = question.blobUrl;
        }
        // Si no hay blobUrl pero hay imageApiUrl, usarla como respaldo
        else if (question.imageApiUrl && question.imageApiUrl.startsWith('http')) {
          console.log(`Question ${question.id}: Using API URL`);
          processedQuestion.image = question.imageApiUrl;
        }
        // Si no hay ninguna URL específica pero hay imagen estándar, usarla
        else if (question.image && question.image.startsWith('http')) {
          console.log(`Question ${question.id}: Using standard image URL`);
          // La imagen ya está asignada correctamente
        }
        // Si hay imageId pero faltan URLs, construir URL a partir del ID
        else if (question.imageId) {
          console.log(`Question ${question.id}: Constructing URL from imageId`);
          processedQuestion.imageApiUrl = `${API_BASE_URL}/images?id=${question.imageId}&redirect=1`;
          // Si no hay imagen principal, usar la construida
          if (!processedQuestion.image) {
            processedQuestion.image = processedQuestion.imageApiUrl;
          }
        }
        
        return processedQuestion;
      });

      return {
        ...test,
        questions: processedQuestions
      };
    });
    
    // Opcionalmente cachear en localStorage
    try {
      localStorage.setItem('saved-tests', JSON.stringify(tests));
    } catch (localStorageError) {
      console.warn('No se pudo guardar en localStorage:', localStorageError);
    }
    
    return tests;
  } catch (error) {
    console.error('Error cargando tests desde API:', error);
    
    // Intentar cargar desde localStorage como fallback
    return loadTestsFromLocalStorage();
  }
};

// Función de fallback para cargar tests desde localStorage
const loadTestsFromLocalStorage = () => {
  try {
    const savedTests = localStorage.getItem('saved-tests');
    if (savedTests) {
      return JSON.parse(savedTests);
    }
    return [];
  } catch (error) {
    console.error('Error cargando tests desde localStorage:', error);
    return [];
  }
}; 

/**
 * Función principal para cargar un test - intenta API y cae en localStorage
 */
export const loadTest = async (testId: string): Promise<Test | null> => {
  // Intentar primero desde la API, si falla usa localStorage
  const test = await loadTestFromAPI(testId);
  return test;
};

/**
 * Carga tests desde la API o localStorage
 */
export const loadTests = async (): Promise<Test[]> => {
  // Intentar primero desde la API, si falla usa localStorage
  return await loadTestsFromAPI();
};

/**
 * Alias para loadTests para mayor compatibilidad
 */
export const getTests = loadTests;

/**
 * Exporta un test como JSON
 */
export const exportTest = (test: Test): string => {
  return JSON.stringify(test, null, 2);
};

/**
 * Genera un ID único
 */
export function generateId(prefix: string = ''): string {
  if (prefix) {
    return `${prefix}_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Elimina un test por ID
 */
// 2. ELIMINAR UN TEST
export const deleteTest = async (testId: string): Promise<boolean> => {
  try {
    console.log(`Intentando eliminar test con ID: ${testId}`);
    
    // Usar el endpoint específico para eliminar tests
    const apiUrl = 'https://quickbooks-backend.vercel.app/api/delete-test';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': typeof window !== 'undefined' ? window.location.origin : 'https://tests-system.vercel.app'
      },
      body: JSON.stringify({
        id: testId
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Error al eliminar test:', errorData);
      throw new Error(`Failed to delete test: ${errorData.error || response.statusText}`);
    }

    // Leer la respuesta para confirmar que la operación fue exitosa
    const result = await response.json();
    console.log('Respuesta del servidor:', result);

    // Al eliminar con éxito, limpiar localStorage
    try {
      // Cargar arrays actuales
      const savedTests = JSON.parse(localStorage.getItem('saved-tests') || '[]');
      const quickbookTests = JSON.parse(localStorage.getItem('quickbook_tests') || '[]');
      
      // Filtrar el test eliminado
      const filteredSavedTests = savedTests.filter((t: { id: string }) => t.id !== testId);
      const filteredQuickbookTests = quickbookTests.filter((t: { id: string }) => t.id !== testId);
      
      // Guardar arrays actualizados
      localStorage.setItem('saved-tests', JSON.stringify(filteredSavedTests));
      localStorage.setItem('quickbook_tests', JSON.stringify(filteredQuickbookTests));
      
      console.log('Test eliminado correctamente de localStorage');
    } catch (e) {
      console.error('Error al eliminar test de localStorage:', e);
    }

    return true;
  } catch (error) {
    console.error('Error al eliminar test:', error);
    return false;
  }
};

/**
 * Guarda un test en el backend, procesando correctamente las imágenes
 */
export async function saveTest(test: Test): Promise<Test> {
  try {
    console.log('Starting saveTest function')

    // URL base del API
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickbooks-backend.vercel.app/api';

    // Crear una copia del test para no modificar el original
    let processedTest = { ...test };
    
    // Procesar todas las preguntas individualmente para asegurar que las imágenes estén gestionadas correctamente
    console.log('Procesando imágenes de preguntas individualmente...');
    const processedQuestions = await Promise.all(
      processedTest.questions.map(async (question) => {
        // Si es de tipo clickArea, procesarla con prepareQuestionWithImage
        if (question.type === 'clickArea') {
          let imageToProcess = null;
          
          // Determinar la fuente de la imagen a procesar
          if (typeof question._localFile === 'string' && question._localFile.startsWith('data:')) {
            console.log(`Pregunta ${question.id}: Usando _localFile como fuente de imagen`);
            imageToProcess = question._localFile;
          } else if (typeof question._imageData === 'string' && question._imageData.startsWith('data:')) {
            console.log(`Pregunta ${question.id}: Usando _imageData como fuente de imagen`);
            imageToProcess = question._imageData;
          } else if (question.image && question.image.startsWith('blob:')) {
            console.log(`Pregunta ${question.id}: Usando blob URL como fuente de imagen`);
            // El procesamiento de blob URL se maneja dentro de prepareQuestionWithImage
          }
          
          // Si no hay nueva imagen pero ya tiene imageId, mantener la pregunta como está
          if (!imageToProcess && !question.image?.startsWith('blob:') && question.imageId) {
            console.log(`Pregunta ${question.id}: Ya tiene imageId y no hay nueva imagen, manteniendo como está`);
            return question;
          }
          
          console.log(`Procesando pregunta de tipo clickArea (ID: ${question.id})`);
          return await prepareQuestionWithImage(question);
        }
        
        // Para otros tipos de preguntas, devolverlas sin cambios
        return question;
      })
    );
    
    // Actualizar las preguntas procesadas en el test
    processedTest.questions = processedQuestions;
    
    // Limpiar datos temporales o sensibles antes de enviar al servidor
    processedTest.questions = processedTest.questions.map(question => {
      const cleanedQuestion = { ...question };
      
      // Eliminar datos temporales o demasiado grandes para enviar
      if (cleanedQuestion._localFile) delete cleanedQuestion._localFile;
      if (cleanedQuestion._imageData) delete cleanedQuestion._imageData;
      
      return cleanedQuestion;
    });
    
    console.log('Todas las imágenes procesadas, enviando test al servidor');
    
    // URL del endpoint a usar para guardar tests
    const apiUrl = `${API_URL}/save-test`;

    console.log('Enviando test al servidor:', apiUrl);
    console.log('Preguntas procesadas:', processedTest.questions.length);

    // Guardar en el backend
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': typeof window !== 'undefined' ? window.location.origin : 'https://tests-system.vercel.app'
      },
      body: JSON.stringify(processedTest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error in saveTest:', response.status, errorText);
      throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
    }

    const savedTest = await response.json();
    console.log('Test guardado correctamente:', savedTest.id);
    
    // Proceso opcional: guardar copia en localStorage
    try {
      // Guardar en localStorage para acceso offline
      console.log('Guardando copia en localStorage');
      const tests = JSON.parse(localStorage.getItem('saved-tests') || '[]');
      const index = tests.findIndex((t: Test) => t.id === savedTest.id);
      if (index >= 0) {
        tests[index] = savedTest;
      } else {
        tests.push(savedTest);
      }
      localStorage.setItem('saved-tests', JSON.stringify(tests));
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
    }

    // Actualizar las preguntas con campos adicionales antes de devolverlas
    savedTest.questions = savedTest.questions.map((q: Question) => {
      // Añadir URLs alternativas para acceso a imágenes
      if (q.imageId) {
        // Construir URLs alternativas para cargar la imagen si no existen
        if (!q.blobUrl && q.imageId) {
          q.blobUrl = `${API_URL}/images?id=${q.imageId}&redirect=blob`;
        }
        if (!q.imageApiUrl && q.imageId) {
          q.imageApiUrl = `${API_URL}/images?id=${q.imageId}&redirect=data`;
        }
      }
      return q;
    });

    return savedTest;
  } catch (error) {
    console.error('Error in saveTest:', error);

    // Si hay un error, intentar guardar en localStorage
    try {
      console.log('Saving test to localStorage as fallback');
      const testToSave = {
        ...test,
        savedOffline: true,
        lastSaved: new Date().toISOString()
      };
      
      saveTestToLocalStorage(testToSave);
      
      return testToSave;
    } catch (localStorageError) {
      console.error('Error saving to localStorage:', localStorageError);
    }

    throw error;
  }
}

/**
 * Guarda un test en localStorage
 */
export const saveTestToLocalStorage = (test: Test): void => {
  try {
    const savedTests = JSON.parse(localStorage.getItem('saved-tests') || '[]');
    const existingIndex = savedTests.findIndex((t: Test) => t.id === test.id);
    
    if (existingIndex >= 0) {
      savedTests[existingIndex] = test;
    } else {
      savedTests.push(test);
    }
    
    localStorage.setItem('saved-tests', JSON.stringify(savedTests));
    console.log(`Test ${test.id} guardado en localStorage`);
  } catch (error) {
    console.error('Error guardando test en localStorage:', error);
  }
};

/**
 * Edita un test existente utilizando el endpoint dedicado
 */
export async function editTest(test: Test): Promise<Test> {
  try {
    console.log('Starting editTest function')

    // URL base del API
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickbooks-backend.vercel.app/api';

    // Crear una copia del test para no modificar el original
    let processedTest = { ...test };
    
    // Procesar todas las preguntas individualmente para asegurar que las imágenes estén gestionadas correctamente
    console.log('Procesando imágenes de preguntas individualmente...');
    const processedQuestions = await Promise.all(
      processedTest.questions.map(async (question) => {
        // Si es de tipo clickArea, procesarla con prepareQuestionWithImage
        if (question.type === 'clickArea') {
          let imageToProcess = null;
          
          // Determinar la fuente de la imagen a procesar
          if (typeof question._localFile === 'string' && question._localFile.startsWith('data:')) {
            console.log(`Pregunta ${question.id}: Usando _localFile como fuente de imagen`);
            imageToProcess = question._localFile;
          } else if (typeof question._imageData === 'string' && question._imageData.startsWith('data:')) {
            console.log(`Pregunta ${question.id}: Usando _imageData como fuente de imagen`);
            imageToProcess = question._imageData;
          } else if (question.image && question.image.startsWith('blob:')) {
            console.log(`Pregunta ${question.id}: Usando blob URL como fuente de imagen`);
            // El procesamiento de blob URL se maneja dentro de prepareQuestionWithImage
          }
          
          // Si no hay nueva imagen pero ya tiene imageId, mantener la pregunta como está
          if (!imageToProcess && !question.image?.startsWith('blob:') && question.imageId) {
            console.log(`Pregunta ${question.id}: Ya tiene imageId y no hay nueva imagen, manteniendo como está`);
            return question;
          }
          
          console.log(`Procesando pregunta de tipo clickArea (ID: ${question.id})`);
          return await prepareQuestionWithImage(question);
        }
        
        // Para otros tipos de preguntas, devolverlas sin cambios
        return question;
      })
    );
    
    // Actualizar las preguntas procesadas en el test
    processedTest.questions = processedQuestions;
    
    // Limpiar datos temporales o sensibles antes de enviar al servidor
    processedTest.questions = processedTest.questions.map(question => {
      const cleanedQuestion = { ...question };
      
      // Eliminar datos temporales o demasiado grandes para enviar
      if (cleanedQuestion._localFile) delete cleanedQuestion._localFile;
      if (cleanedQuestion._imageData) delete cleanedQuestion._imageData;
      
      return cleanedQuestion;
    });
    
    console.log('Todas las imágenes procesadas, enviando test al servidor');
    
    // URL del endpoint específico para editar tests
    const apiUrl = `${API_URL}/edit-test`;

    console.log('Enviando test al servidor:', apiUrl);
    console.log('Preguntas procesadas:', processedTest.questions.length);

    // Enviar al backend usando el endpoint específico para edición
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': typeof window !== 'undefined' ? window.location.origin : 'https://tests-system.vercel.app'
      },
      body: JSON.stringify(processedTest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error in editTest:', response.status, errorText);
      throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
    }

    const savedTest = await response.json();
    console.log('Test editado correctamente:', savedTest.id);
    
    // Proceso opcional: actualizar en localStorage
    try {
      // Actualizar en localStorage para acceso offline
      console.log('Actualizando copia en localStorage');
      const tests = JSON.parse(localStorage.getItem('saved-tests') || '[]');
      const index = tests.findIndex((t: Test) => t.id === savedTest.id);
      if (index >= 0) {
        tests[index] = savedTest;
      } else {
        tests.push(savedTest);
      }
      localStorage.setItem('saved-tests', JSON.stringify(tests));
    } catch (error) {
      console.error('Error actualizando en localStorage:', error);
    }

    // Actualizar las preguntas con campos adicionales antes de devolverlas
    savedTest.questions = savedTest.questions.map((q: Question) => {
      // Añadir URLs alternativas para acceso a imágenes
      if (q.imageId) {
        // Construir URLs alternativas para cargar la imagen si no existen
        if (!q.blobUrl && q.imageId) {
          q.blobUrl = `${API_URL}/images?id=${q.imageId}&redirect=blob`;
        }
        if (!q.imageApiUrl && q.imageId) {
          q.imageApiUrl = `${API_URL}/images?id=${q.imageId}&redirect=data`;
        }
      }
      return q;
    });

    return savedTest;
  } catch (error) {
    console.error('Error in editTest:', error);

    // Si hay un error, intentar guardar en localStorage
    try {
      console.log('Saving test to localStorage as fallback');
      const testToSave = {
        ...test,
        savedOffline: true,
        lastSaved: new Date().toISOString()
      };
      
      saveTestToLocalStorage(testToSave);
      
      return testToSave;
    } catch (localStorageError) {
      console.error('Error saving to localStorage:', localStorageError);
    }

    throw error;
  }
}