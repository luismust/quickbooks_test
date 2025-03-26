import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function processGoogleDriveUrl(url: string): string {
  if (!url || !url.includes('drive.google.com')) return url
  
  try {
    let fileId = ''
    
    if (url.includes('/file/d/')) {
      const match = url.match(/\/file\/d\/([^/]+)/)
      if (match) {
        fileId = match[1].split('/')[0].split('?')[0]
      }
    } else {
      const match = url.match(/[-\w]{25,}(?!.*[-\w]{25,})/)
      if (match) {
        fileId = match[0]
      }
    }

    if (!fileId) {
      console.warn('No se pudo extraer el ID del archivo:', url)
      return url
    }

    // Usar un proxy de imágenes para evitar problemas de CORS
    return `https://images.weserv.nl/?url=${encodeURIComponent(
      `https://drive.google.com/uc?export=view&id=${fileId}`
    )}&default=${encodeURIComponent(
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`
    )}&n=-1`
  } catch (error) {
    console.error('Error procesando URL:', error)
    return url
  }
}

// Función auxiliar para validar y limpiar URLs de Google Drive
export const validateGoogleDriveUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'drive.google.com' && 
      (
        url.includes('/file/d/') ||
        url.includes('id=') ||
        url.includes('/uc?') ||
        url.includes('/view') ||
        url.includes('/open')
      )
    );
  } catch {
    return false;
  }
};

export async function downloadAndCacheImage(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('Error downloading image:', error)
    return url
  }
}

export const validateImageUrl = (url: string): boolean => {
  if (!url) return false

  try {
    const parsed = new URL(url)
    
    // Validar dominio de Google Drive
    if (url.includes('drive.google.com')) {
      return url.includes('/file/d/') && parsed.protocol === 'https:'
    }
    
    // Validar otros dominios de imágenes comunes
    const validDomains = ['imgur.com', 'cloudinary.com', 'res.cloudinary.com']
    return validDomains.some(domain => parsed.hostname.includes(domain))
  } catch {
    return false
  }
}

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remover tags HTML
    .trim()
}

export const validateImportedJson = (json: any): boolean => {
  try {
    if (!json.questions || !Array.isArray(json.questions)) return false
    
    return json.questions.every((q: any) => (
      typeof q.id === 'number' &&
      typeof q.title === 'string' &&
      typeof q.description === 'string' &&
      typeof q.question === 'string' &&
      typeof q.image === 'string' &&
      Array.isArray(q.areas) &&
      q.areas.every((a: any) => (
        typeof a.id === 'string' &&
        ['rect', 'circle', 'poly'].includes(a.shape) &&
        Array.isArray(a.coords) &&
        typeof a.isCorrect === 'boolean'
      ))
    ))
  } catch {
    return false
  }
}

export const generateId = (prefix: string = '') => {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`
}
