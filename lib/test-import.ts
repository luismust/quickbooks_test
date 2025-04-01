"use client"

import { Test, Question } from './test-storage'
import { generateId } from './utils'

// Función para importar tests desde un archivo JSON
export async function importTestFromFile(file: File): Promise<Test | null> {
  try {
    const fileContent = await readFile(file)
    const json = JSON.parse(fileContent)
    
    // Validar el formato básico
    if (!json.name || !Array.isArray(json.questions)) {
      throw new Error('Invalid test format: Missing name or questions array')
    }
    
    // Procesar las preguntas para asegurar que las imágenes se manejen correctamente
    const processedQuestions = json.questions.map((q: any) => {
      // Crear una pregunta con ID único si no tiene uno
      const question: Question = {
        id: q.id || generateId('question'),
        title: q.title || 'Untitled Question',
        description: q.description || '',
        question: q.question || 'No question text',
        type: q.type || 'clickArea',
        areas: q.areas || [],
        // Asegurar que la imagen es una cadena, puede ser base64 o URL
        image: typeof q.image === 'string' ? q.image : '',
        scoring: q.scoring || {
          correct: 1,
          incorrect: 0,
          retain: 0
        }
      }
      
      // Si la imagen es base64, asegurarnos de almacenarla también en _imageData y _localFile
      if (question.image && question.image.startsWith('data:image/')) {
        question._imageData = question.image
        question._localFile = question.image
      }
      
      return question
    })
    
    // Crear el test con los datos procesados
    const test: Test = {
      id: json.id || generateId('test'),
      name: json.name,
      description: json.description || '',
      questions: processedQuestions,
      maxScore: json.maxScore || 100,
      minScore: json.minScore || 60,
      passingMessage: json.passingMessage || "Congratulations!",
      failingMessage: json.failingMessage || "Try again"
    }
    
    return test
  } catch (error) {
    console.error('Error importing test:', error)
    return null
  }
}

// Función para leer un archivo como texto
async function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = () => reject(new Error('Error reading file'))
    reader.readAsText(file)
  })
}

// Función para exportar un test como archivo JSON
export function exportTestAsFile(test: Test): void {
  // Preparar los datos para exportación
  const testData = {
    ...test,
    // Si hay imágenes base64, asegurarse de que se incluyan
    questions: test.questions.map(q => ({
      ...q,
      // Si hay _imageData, asegurarse de usarlo como imagen principal
      image: q._imageData && typeof q._imageData === 'string' 
        ? q._imageData 
        : q.image
    }))
  }
  
  // Convertir a JSON
  const json = JSON.stringify(testData, null, 2)
  
  // Crear un archivo Blob y descargarlo
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  // Crear un enlace para descargar
  const a = document.createElement('a')
  a.href = url
  a.download = `${test.name.replace(/\s+/g, '_')}_${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  
  // Limpiar
  URL.revokeObjectURL(url)
  document.body.removeChild(a)
} 