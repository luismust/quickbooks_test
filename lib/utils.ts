import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const processGoogleDriveUrl = (url: string): string => {
  if (!url || !url.includes('drive.google.com')) return url

  try {
    let fileId = ''
    if (url.includes('/file/d/')) {
      const match = url.match(/\/file\/d\/([^/]+)/)
      if (match) {
        fileId = match[1].split('/')[0].split('?')[0]
      }
    }

    if (!fileId) return url

    const baseUrl = `https://drive.google.com/uc?export=view&id=${fileId}`
    return `https://images.weserv.nl/?url=${encodeURIComponent(baseUrl)}&default=${encodeURIComponent(baseUrl)}&n=-1`
  } catch (error) {
    return url
  }
}

export const downloadAndCacheImage = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('Error descargando imagen:', error)
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
