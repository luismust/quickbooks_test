import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function processImageUrl(url: string): string {
  if (!url) return url

  // Procesar URLs de Google Drive
  if (url.includes('drive.google.com')) {
    return processGoogleDriveUrl(url)
  }

  return url
}

export function processGoogleDriveUrl(url: string): string {
  if (!url) return url
  
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

    if (fileId) {
      return `https://drive.google.com/uc?export=view&id=${fileId}`
    }
  } catch (error) {
    console.error('Error procesando URL:', error)
  }

  return url
}

export const validateImageUrl = (url: string): boolean => {
  if (!url) return false

  try {
    const parsed = new URL(url)
    
    // Validar dominios de imágenes comunes
    const validDomains = [
      'imgur.com',
      'i.imgur.com',
      'drive.google.com',
      'cloudinary.com',
      'res.cloudinary.com'
    ]
    return validDomains.some(domain => parsed.hostname.includes(domain))
  } catch {
    return false
  }
}

export async function downloadAndCacheImage(url: string): Promise<string> {
  try {
    const processedUrl = processImageUrl(url)
    const response = await fetch(processedUrl)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('Error downloading image:', error)
    return url
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

export function formatGoogleDriveUrl(url: string): string {
  if (!url) return url;
  
  try {
    // Verificar si es una URL de Google Drive
    if (url.includes('drive.google.com')) {
      // Extraer el ID del archivo
      let fileId = '';
      
      // Formato https://drive.google.com/file/d/ID/view
      if (url.includes('/file/d/')) {
        fileId = url.split('/file/d/')[1].split('/')[0];
      } 
      // Formato https://drive.google.com/uc?id=ID
      else if (url.includes('id=')) {
        fileId = url.split('id=')[1].split('&')[0];
      }
      
      if (fileId) {
        // Add a timestamp to prevent caching issues
        const timestamp = Date.now();
        
        // Use direct link to the Google Drive view-only format (more reliable)
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000&t=${timestamp}`;
      }
    }
    
    return url;
  } catch (error) {
    console.error('Error formatting Google Drive URL:', error);
    return url;
  }
}

export function getProxiedImageUrl(url: string): string {
  if (!url) return url;
  
  // Si ya es una URL proxy o no es de Google Drive, devolver tal cual
  if (!url.includes('drive.google.com') || url.includes('cors-anywhere')) {
    return url;
  }

  // Usar un servicio proxy para resolver problemas de CORS
  // Nota: Este es un servicio público y podría tener limitaciones de uso
  return `https://cors-anywhere.herokuapp.com/${url}`;
}

// Función para probar si una imagen se puede cargar
export function testImageLoading(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}
