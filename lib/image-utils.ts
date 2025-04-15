import type { Question } from './test-storage';

// Extender la interfaz de HTMLImageElement para incluir la propiedad _onloadCallback
declare global {
  interface HTMLImageElement {
    _onloadCallback?: (e: Event) => void;
  }
}

/**
 * Crea un elemento de imagen con soporte CORS
 * Esta función es útil para cargar imágenes desde un origen diferente
 */
export function createProxyImage(imageUrl: string | null | undefined): HTMLImageElement {
  // Si no hay URL, devolver una imagen vacía con fallback
  if (!imageUrl) {
    console.warn('createProxyImage called with empty URL');
    const fallbackImg = new Image();
    fallbackImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    return fallbackImg;
  }
  
  // A partir de aquí, sabemos que imageUrl es una cadena no nula
  const url: string = imageUrl;
  
  // Si es una URL de blob, usarla directamente para evitar duplicación innecesaria
  if (url.startsWith('blob:')) {
    // Para URLs blob, primero verificar validez
    checkBlobValidity(url).then(isValid => {
      if (!isValid) {
        console.warn('Detected invalid blob URL:', url.substring(0, 40) + '...');
      }
    });
    
    const img = new Image();
    img.src = url;
    return img;
  }
  
  // Si es una URL API pero sin redirect=1, añadirla para evitar problemas CORS
  let finalUrl = url;
  if (finalUrl.includes('/api/images') && finalUrl.includes('id=') && !finalUrl.includes('redirect=1')) {
    finalUrl = `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}redirect=1`;
  }
  
  // Añadir timestamp para evitar caché en imágenes de API
  if (finalUrl.includes('/api/')) {
    finalUrl = `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
  }
  
  // Para imágenes base64, usarlas directamente
  if (finalUrl.startsWith('data:')) {
    const img = new Image();
    img.src = finalUrl;
    return img;
  }
  
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = finalUrl;
  
  return img;
}

/**
 * Verifica si una URL de blob sigue siendo válida
 * @param blobUrl URL del blob a verificar
 * @param timeout Tiempo máximo de espera en ms (por defecto 3000)
 * @returns Promesa que resuelve a true si el blob es válido, false si no
 */
export async function checkBlobValidity(blobUrl: string): Promise<boolean> {
  if (!blobUrl || typeof blobUrl !== 'string' || !blobUrl.startsWith('blob:')) return false;
  
  try {
    return new Promise<boolean>((resolve) => {
      const img = new Image();
      
      // Configurar un timeout para evitar esperas indefinidas
      const timeoutId = setTimeout(() => {
        console.error('Blob URL validation timed out');
        resolve(false);
      }, 3000);
      
      img.onload = () => {
        clearTimeout(timeoutId);
        resolve(true);
      };
      
      img.onerror = () => {
        clearTimeout(timeoutId);
        console.error('Blob URL is invalid (failed to load)');
        resolve(false);
      };
      
      img.src = blobUrl;
    });
  } catch (error) {
    console.error('Error checking blob URL:', error);
    return false;
  }
}

/**
 * Función para obtener la mejor URL de imagen de una pregunta
 * Prioriza las diferentes fuentes disponibles
 */
export function getBestImageUrl(question: Question): string | null {
  // Priorizar blobUrl si está disponible
  if (question.blobUrl && typeof question.blobUrl === 'string' && question.blobUrl.startsWith('http')) {
    return question.blobUrl;
  }
  
  // Si hay imageApiUrl como respaldo, usarla
  if (question.imageApiUrl && typeof question.imageApiUrl === 'string' && question.imageApiUrl.startsWith('http')) {
    return question.imageApiUrl;
  }
  
  // Si hay una URL de imagen estándar, usarla
  if (question.image && typeof question.image === 'string') {
    // Si es base64 o URL normal, usarla directamente
    return question.image;
  }
  
  // Si hay imageId pero no hay URLs, construir URL a partir del API_URL
  if (question.imageId) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickbooks-backend.vercel.app/api';
    return `${API_URL}/images?id=${question.imageId}&redirect=1`;
  }
  
  // Si no hay ninguna fuente de imagen, devolver null
  return null;
}

/**
 * Función para precargar imágenes de un conjunto de preguntas
 * @returns Un objeto con las imágenes precargadas, usando el ID de la pregunta como clave
 */
export async function preloadQuestionImages(questions: any[]): Promise<Record<string, HTMLImageElement>> {
  const images: Record<string, HTMLImageElement> = {};
  const promises: Promise<void>[] = [];
  
  // Para cada pregunta, crear una promesa para cargar su imagen
  for (const question of questions) {
    if (!question.id) continue;
    
    // Obtener la mejor URL disponible
    const imageUrl = getBestImageUrl(question);
    if (!imageUrl) continue;

    // Crear una promesa para cargar la imagen
    const promise = new Promise<void>((resolve) => {
      const img = createProxyImage(imageUrl);
      
      img.onload = () => {
        // Almacenar la imagen cargada usando el ID de la pregunta como clave
        images[question.id] = img;
        resolve();
      };
      
      img.onerror = () => {
        console.error(`Failed to preload image for question ${question.id}`);
        resolve();
      };
    });
    
    promises.push(promise);
  }
  
  // Cargar todas las imágenes en paralelo
  await Promise.all(promises);
  return images;
}

/**
 * Función para optimizar una imagen base64
 */
export function optimizeImage(
  imageData: string, 
  maxWidth = 1200, 
  maxHeight = 1200, 
  quality = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    if (!imageData || typeof imageData !== 'string' || !imageData.startsWith('data:')) {
      // Si no es base64 válido, devolver la entrada original
      resolve(imageData);
      return;
    }
    
    const img = new Image();
    
    img.onload = function() {
      let width = img.width;
      let height = img.height;
      
      // Si ya está dentro de los límites, devolver sin cambios
      if (width <= maxWidth && height <= maxHeight && quality >= 1) {
        resolve(imageData);
        return;
      }
      
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
        
        // Obtener tipo MIME de la imagen original
        const mimeType = imageData.split(';')[0].split(':')[1] || 'image/jpeg';
        
        // Convertir a formato comprimido
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