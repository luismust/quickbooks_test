"use client"

export async function uploadImageToAirtable(file: File, testId?: string): Promise<string> {
  try {
    // Convertir el archivo a base64
    const base64 = await fileToBase64(file)
    
    console.log('Uploading image to Airtable with testId:', testId)
    
    // Detectar si estamos en Vercel (producción)
    const isVercel = typeof window !== 'undefined' && (
      window.location.hostname.includes('vercel.app') || 
      process.env.NODE_ENV === 'production'
    )
    
    // URL base del API
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickbooks-backend.vercel.app';
    
    // URL del endpoint a usar
    const apiUrl = isVercel 
      ? `${API_BASE_URL}/airtable`  // URL del API serverless
      : '/api/airtable';  // URL local en desarrollo
    
    // Subir a Airtable
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        file: base64,
        testId: testId || 'temp' // Usar 'temp' si no hay testId
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('Error response from API:', errorData)
      throw new Error(`Failed to upload image to Airtable: ${errorData.error || response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.url) {
      throw new Error('No URL returned from Airtable')
    }
    
    return data.url // URL de la imagen en Airtable
  } catch (error) {
    console.error('Error uploading to Airtable:', error)
    throw error
  }
}

// Función para convertir un archivo a base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

// Función para eliminar imágenes de un test
export async function deleteTestImages(testId: string): Promise<boolean> {
  try {
    // Detectar si estamos en Vercel (producción)
    const isVercel = typeof window !== 'undefined' && (
      window.location.hostname.includes('vercel.app') || 
      process.env.NODE_ENV === 'production'
    )
    
    // URL base del API
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickbooks-backend.vercel.app';
    
    // URL del endpoint a usar
    const apiUrl = isVercel 
      ? `${API_BASE_URL}/airtable`  // URL del API serverless
      : '/api/airtable';  // URL local en desarrollo
    
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ testId }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(`Failed to delete images: ${errorData.error || response.statusText}`)
    }

    return true
  } catch (error) {
    console.error('Error deleting images:', error)
    return false
  }
} 