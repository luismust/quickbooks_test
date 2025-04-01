import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function processImageUrl(url: string): string {
  if (!url) return url
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
      'cloudinary.com',
      'res.cloudinary.com',
      'api.airtable.com'
    ]
    return validDomains.some(domain => parsed.hostname.includes(domain))
  } catch {
    return false
  }
}

export async function downloadAndCacheImage(url: string): Promise<string> {
  try {
    const response = await fetch(url)
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

export function getImageUrl(url: string): string {
  if (!url) return url;
  return url;
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
