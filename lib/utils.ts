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
  if (!url) return '';
  
  // Si es una imagen base64, devolverla tal cual
  if (url.startsWith('data:image/')) {
    return url;
  }
  
  // Manejar URLs de blob (que pueden expirar)
  if (url.startsWith('blob:')) {
    console.log('getImageUrl: Detected blob URL that might be unstable:', url.substring(0, 40) + '...');
    // No podemos verificar aquí si es válida, el componente se encargará de manejar errores
    return url;
  }
  
  // Si es una referencia a una imagen, usar un placeholder
  if (url.startsWith('image_reference_')) {
    console.log('getImageUrl: Returning placeholder for image reference');
    // Un placeholder base64 más pequeño y con mejor diseño (cuadrícula gris con icono)
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAMAAABHPGVmAAAA21BMVEUAAAD///+/v7+ZmZmqqqqZmZmfn5+dnZ2ampqcnJycnJybm5ubm5uampqampqampqampqbm5uampqampqbm5uampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqamp///+YmJiZmZmampqbm5ucnJydnZ2enp6fnp6fn5+gn5+gn6CgoKChoKChoaGioaGioqKjoqKjo6Ojo6SkpKSlpaWmpqanp6eoqKiqqqpTU1MAAAB8A5ZEAAAARnRSTlMAAQIEBQUGBwcLDBMUFRYaGxwdNjxRVVhdYGRnaWptcXV2eHp7fX5/gISGiImKjI2OkJKTlZebnKCio6Slqq+2uL6/xdDfsgWO3gAAAWhJREFUeNrt1sdSwzAUBVAlkRJaGi33il2CYNvpvZP//6OEBVmWM+PIGlbhncWTcbzwNNb1ZwC8mqDZMaENiXBJVGsCE5KUKbE1GZNURlvLjfUTjC17JNvbgYzUW3qpKxJllJYwKyIw0mSsCRlWBkLhDGTJGE3WEF3KEnGdJYRGlrqKtJEn1A0hWp4w1xBNnlA3kFg5wlzD2o0M4a4j0jJEXEciZQh3A9HkCHMD0fOEuI7IyhGxhojyhLiG6HlCXUdYOcLdRER5Qt1AJDnC3MQ6ZQhxHWvJEu4GIsoR6jrWljKEu4VlP9eMeS5wt5CWpV2WNKqUlPMdKo7oa4jEd2qoqM1DpwVGWp0jmqd+7JQYa/oqsnQ4EfWdSsea8O/yCTgc/3FMSLnUwA8xJhQq44HQB1zySOBCZx8Y3H4mJF8XOJTEBELr8IfzXECYf+fQJ0LO16JvRA5PCK92GMP/FIB3YUC2pHrS/6AAAAAASUVORK5CYII=';
  }
  
  // Otras URLs, devolverlas tal cual
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
