"use client"

import { uploadImageToAirtable, deleteTestImages } from './airtable-utils'

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
  image?: string
  imageId?: string        // ID de la imagen en Vercel Blob
  originalImage?: string
  _localFile?: File | string   // Puede ser un objeto File o una string base64
  _imageData?: string          // Para almacenar datos base64 de la imagen
  isImageReference?: boolean   // Indica si la imagen es una referencia
  imageReference?: string      // Guarda la referencia original a la imagen
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

/**
 * Función para procesar una pregunta con imagen
 * Convierte Blob URLs a base64 y los guarda en _localFile
 */
async function prepareQuestionWithImage(question: Question): Promise<Question> {
  const processedQuestion = { ...question };
  
  // Verificar si hay una imagen y es un Blob URL
  if (question.image && question.image.startsWith('blob:')) {
    console.log(`Pregunta ${question.id}: Convirtiendo blob URL a base64`);
    
    // Convertir la imagen blob a base64
    const base64Data = await convertBlobUrlToBase64(question.image);
    
    if (base64Data) {
      // Guardar la versión base64 en _localFile como espera el backend
      processedQuestion._localFile = base64Data;
      console.log('Conversión exitosa, base64 guardado en _localFile');
    } else {
      console.warn('No se pudo convertir la imagen blob a base64');
    }
  } 
  // Si ya tenemos un _localFile base64, mantenerlo
  else if (question._localFile && typeof question._localFile === 'string' && 
          question._localFile.startsWith('data:')) {
    console.log(`Pregunta ${question.id}: Ya tiene _localFile en base64`);
  }
  
  return processedQuestion;
}

/**
 * Guarda un test en el backend, procesando correctamente las imágenes
 */
export async function saveTest(test: Test): Promise<Test> {
  try {
    console.log('Starting saveTest function')

    // Detectar si estamos en Vercel/producción (forzar a true en entorno desplegado)
    const isVercel = true; // Siempre usaremos la URL externa en la build de producción

    // URL base del API
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickbooks-backend.vercel.app/api';

    // Procesar todas las imágenes blob en el test usando el procesador de imágenes
    console.log('Procesando imágenes blob en el test...');
    let processedTest = test;
    
    // Verificar si el procesador de imágenes está disponible
    if (typeof window !== 'undefined' && window.BlobImageProcessor) {
      try {
        // Utilizar el procesador de imágenes recomendado por el backend
        console.log('Usando BlobImageProcessor para procesar las imágenes');
        processedTest = await window.BlobImageProcessor.processAllBlobImagesInTest(test);
        console.log('Procesamiento de imágenes completado');
      } catch (imageError) {
        console.error('Error al procesar imágenes con BlobImageProcessor:', imageError);
        // Si falla, seguimos con el test original
        processedTest = test;
      }
    } else {
      console.warn('BlobImageProcessor no está disponible, se usará el método anterior');
      // Usar el método anterior como fallback
      processedTest = { ...test };
      
      // Procesar cada pregunta con imagen siguiendo el método anterior
      for (let i = 0; i < processedTest.questions.length; i++) {
        const question = processedTest.questions[i];
        if (question.image) {
          console.log(`Procesando imagen para pregunta ${i+1}/${processedTest.questions.length}`);
          processedTest.questions[i] = await prepareQuestionWithImage(question);
        }
      }
    }
    
    // URL del endpoint a usar - usar /api/save-test
    const apiUrl = isVercel 
      ? `${API_BASE_URL}/save-test`  // La URL ya incluye /api/ en API_BASE_URL
      : '/api/save-test';  // URL local en desarrollo

    console.log('Enviando test al servidor:', apiUrl);
    console.log('Preguntas procesadas:', processedTest.questions.length);

    // Guardar en el backend a través del endpoint correspondiente
    const response = await fetch(apiUrl, {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': 'https://quickbooks-test-black.vercel.app'
      },
      body: JSON.stringify(processedTest),
    });

    let responseData;
    
    try {
      if (!response.ok) {
        responseData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error response:', responseData);
        throw new Error(`Failed to save test: ${responseData.error || response.statusText}`);
      } else {
        responseData = await response.json().catch(() => ({}));
      }
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      responseData = {};
    }

    // Crear un objeto de test válido basado en los datos enviados y la respuesta
    const savedTest = {
      ...processedTest,  // Usar los datos originales como base
      ...(responseData || {})  // Añadir datos de respuesta si existen
    };

    // Verificar y arreglar el ID si es necesario
    if (typeof savedTest.id !== 'string' || !savedTest.id) {
      console.warn('API response missing valid ID, generating temporary ID');
      // Generar un ID temporal compatible con el formato esperado
      savedTest.id = '_temp_' + Date.now();
    } else if (!savedTest.id.startsWith('_')) {
      // Asegúrate de que el ID tenga el formato correcto (empezando con _)
      savedTest.id = '_' + savedTest.id;
    }

    console.log('Test saved successfully with ID:', savedTest.id);
    // También guardamos en localStorage para tener una copia local
    try {
      const savedTests = localStorage.getItem('quickbook_tests') || '[]'
      const localTests = JSON.parse(savedTests) as Test[]

      // Actualizar o añadir el test
      const existingIndex = localTests.findIndex(t => t.id === savedTest.id)
      if (existingIndex >= 0) {
        localTests[existingIndex] = savedTest
      } else {
        localTests.push(savedTest)
      }

      // Guardar de vuelta en localStorage
      localStorage.setItem('quickbook_tests', JSON.stringify(localTests))
    } catch (e) {
      console.error('Error saving local copy:', e)
    }

    return savedTest;
  } catch (error) {
    console.error('Error saving test:', error)
    throw error
  }
}

export async function getTests(): Promise<Test[]> {
  try {
    console.log('Starting getTests function')

    // Detectar si estamos en Vercel/producción (forzar a true en entorno desplegado)
    const isVercel = true; // Siempre usaremos la URL externa en la build de producción

    // URL base del API
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickbooks-backend.vercel.app/api';

    // URL del endpoint a usar
    const apiUrl = isVercel
      ? `${API_BASE_URL}/tests`  // La URL ya incluye /api/ en API_BASE_URL
      : '/api/tests';  // URL local en desarrollo

    console.log('Fetching tests from API:', apiUrl)
    
    // Configurar los headers según lo que acepta Vercel en su configuración
    const response = await fetch(apiUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include', // Incluir cookies según la configuración del backend
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': 'https://quickbooks-test-black.vercel.app' // Usar Origin como lo especifica el servidor
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch tests: ${response.status} ${response.statusText}`)
    }

    const { tests } = await response.json()

    // Verificar la estructura de los datos recibidos
    console.log('Retrieved tests:', tests.length)
    if (tests.length > 0) {
      console.log('Sample test fields:', Object.keys(tests[0]))
    }

    // Procesar las imágenes en cada test
    const processedTests = tests.map((test: Test) => {
      // Procesar cada pregunta para verificar las imágenes
      const processedQuestions = test.questions.map((question: Question) => {
        // Crear un objeto limpio
        const cleanQuestion = { ...question };

        // Las imágenes ahora son URLs directas desde el backend o imageId
        // Si la imagen ya es una URL completa, la mantenemos
        if (question.image && question.image.startsWith('http')) {
          console.log('Using direct image URL from API');
          cleanQuestion.image = question.image;
        }

        // Si tenemos _imageData, podemos usarlo como copia local
        if (question._imageData && typeof question._imageData === 'string' &&
          question._imageData.startsWith('data:')) {
          console.log('Found _imageData, using it as local backup');
          // Solo usar _imageData como fallback si no hay una URL válida
          if (!cleanQuestion.image || !cleanQuestion.image.startsWith('http')) {
            cleanQuestion.image = question._imageData;
          }
        }

        return cleanQuestion;
      });

      return {
        ...test,
        questions: processedQuestions
      };
    });

    // También guardamos en localStorage para tener una copia local
    try {
      localStorage.setItem('quickbook_tests', JSON.stringify(processedTests))
    } catch (e) {
      console.error('Error saving local copy:', e)
    }

    return processedTests;

  } catch (error) {
    console.error('Error in getTests:', error)

    // Si hay un error, intentar devolver los tests desde localStorage
    try {
      const savedTests = localStorage.getItem('quickbook_tests') || '[]'
      const localTests = JSON.parse(savedTests) as Test[]
      console.log('Returning tests from localStorage as fallback:', localTests.length)
      return localTests
    } catch (e) {
      console.error('Error reading from localStorage:', e)
      return []
    }
  }
}

// URL base de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickbooks-backend.vercel.app/api';

/**
 * Carga un test específico desde la API
 */
export const loadTestFromAPI = async (testId: string): Promise<Test | null> => {
  try {
    // Configurar los headers según lo que acepta Vercel en su configuración
    const response = await fetch(`${API_BASE_URL}/tests?id=${testId}`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include', // Incluir cookies según la configuración del backend
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': 'https://quickbooks-test-black.vercel.app' // Usar Origin como lo especifica el servidor
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
        // Si la imagen es una URL HTTP, está lista para usar
        if (question.image && question.image.startsWith('http')) {
          console.log(`Question ${question.id}: Using direct image URL`);
        }
        return question;
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
    // Usar el nuevo endpoint específico para cargar tests
    const apiUrl = 'https://quickbooks-backend.vercel.app/api/load-tests';
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Error cargando tests desde API:', response.statusText);
      return loadTestsFromLocalStorage();
    }

    const data = await response.json();
    const tests = data.tests || [];
    
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
 * Función principal para cargar todos los tests
 */
export const loadTests = async (): Promise<Test[]> => {
  // Intentar primero desde la API, si falla usa localStorage
  return await loadTestsFromAPI();
};

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
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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