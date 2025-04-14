import type { Question } from './test-storage';

// Extender la interfaz de HTMLImageElement para incluir la propiedad _onloadCallback
declare global {
  interface HTMLImageElement {
    _onloadCallback?: (e: Event) => void;
  }
}

/**
 * Función para crear un elemento de imagen con manejo de CORS
 * Permite cargar imágenes desde diferentes fuentes con configuración apropiada
 */
export function createProxyImage(url: string | Question, element?: HTMLImageElement): HTMLImageElement {
  // Si ya tenemos un elemento proporcionado, usarlo. Si no, crear uno nuevo
  const img = element || new Image();
  
  // Agregar los atributos necesarios para CORS
  img.crossOrigin = "anonymous";
  
  // Agregar timestamp para evitar caché
  const timestamp = Date.now();
  
  // Verificar si nos pasaron un objeto Question en lugar de una URL
  if (url && typeof url === 'object') {
    // Priorizar la URL directa al blob si existe
    const blobUrl = url.blobUrl;
    if (blobUrl && typeof blobUrl === 'string') {
      // Verificar si la URL blob es válida intentando cargarla directamente
      try {
        const checkBlobPromise = new Promise<boolean>((resolve) => {
          const testImg = new Image();
          testImg.onload = () => {
            console.log('Blob URL is valid, using it:', blobUrl.substring(0, 40) + '...');
            img.src = `${blobUrl}${blobUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
            resolve(true);
          };
          
          testImg.onerror = () => {
            console.log('Blob URL is invalid (failed to load), using alternatives');
            resolve(false);
            
            // Si la blob URL falla, intenta la siguiente fuente
            if (url.imageApiUrl) {
              img.src = `${url.imageApiUrl}${url.imageApiUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
              console.log('Blob URL failed, using imageApiUrl instead:', url.imageApiUrl);
            } else if (url.image) {
              img.src = `${url.image}${url.image.includes('?') ? '&' : '?'}t=${timestamp}`;
              console.log('Blob URL failed, using standard image URL instead:', url.image);
            } else if (url.imageId) {
              const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickbooks-backend.vercel.app/api';
              const imageUrl = `${API_URL}/images?id=${url.imageId}&redirect=1&t=${timestamp}`;
              img.src = imageUrl;
              console.log('Blob URL failed, using imageId URL instead:', imageUrl);
            }
          };
          
          testImg.src = blobUrl;
          
          // Establecer un timeout para evitar esperas indefinidas
          setTimeout(() => {
            if (!testImg.complete) {
              console.log('Blob URL validation timed out');
              resolve(false);
              
              // Si hay un timeout, probar con alternativas
              if (url.imageApiUrl) {
                img.src = `${url.imageApiUrl}${url.imageApiUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
              }
            }
          }, 3000);
        });
      } catch (error) {
        console.error('Error checking blob URL:', error);
        // Si hay un error al verificar el blob, usar la siguiente fuente disponible
        if (url.imageApiUrl) {
          img.src = `${url.imageApiUrl}${url.imageApiUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
          console.log('Using imageApiUrl for image (blob check failed):', url.imageApiUrl);
        } else if (url.image) {
          img.src = `${url.image}${url.image.includes('?') ? '&' : '?'}t=${timestamp}`;
          console.log('Using standard image URL (blob check failed):', url.image);
        }
      }
    }
    // Si hay imageApiUrl como respaldo, usarla
    else if (url.imageApiUrl) {
      img.src = `${url.imageApiUrl}${url.imageApiUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
      console.log('Using imageApiUrl for image:', url.imageApiUrl);
    }
    // Como último recurso, usar el campo image
    else if (url.image) {
      img.src = `${url.image}${url.image.includes('?') ? '&' : '?'}t=${timestamp}`;
      console.log('Using standard image URL:', url.image);
    }
    // Si hay imageId pero no hay URLs, construir URL a partir del API_URL
    else if (url.imageId) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickbooks-backend.vercel.app/api';
      const imageUrl = `${API_URL}/images?id=${url.imageId}&redirect=1&t=${timestamp}`;
      img.src = imageUrl;
      console.log('Using API URL constructed from imageId:', imageUrl);
    }
  } else if (typeof url === 'string') {
    // Verificar si es una URL de blob
    if (url.startsWith('blob:')) {
      // Verificar si la URL blob es válida intentando cargarla directamente en una imagen
      // Evitamos fetch HEAD que está causando ERR_METHOD_NOT_SUPPORTED
      try {
        // Cargar directamente la URL y manejar los eventos de carga/error
        const blobValidationPromise = new Promise<boolean>((resolve) => {
          const testImg = new Image();
          testImg.onload = () => {
            console.log('Blob URL is valid, loading directly:', url.substring(0, 40) + '...');
            img.src = url;
            resolve(true);
          };
          
          testImg.onerror = () => {
            console.error('Blob URL is invalid (failed to load)');
            resolve(false);
            img.onerror?.(new ErrorEvent('error'));
          };
          
          testImg.src = url;
          
          // Establecer un timeout para evitar esperas indefinidas
          setTimeout(() => {
            if (!testImg.complete) {
              console.log('Blob URL validation timed out');
              resolve(false);
              img.onerror?.(new ErrorEvent('timeout'));
            }
          }, 3000);
        });
        
        // Si la validación falla, manejar el error
        blobValidationPromise.then(isValid => {
          if (!isValid) {
            console.log('Intentando cargar alternativas para URL blob inválida');
          }
        });
      } catch (error) {
        console.error('Exception checking blob URL:', error);
        img.onerror?.(new ErrorEvent('error'));
      }
    }
    // Para URLs base64, no agregar timestamp
    else if (url.startsWith('data:')) {
      img.src = url;
    } else {
      img.src = `${url}${url.includes('?') ? '&' : '?'}t=${timestamp}`;
    }
  }

  // Establecer un tiempo límite para cargar la imagen
  const timeoutId = setTimeout(() => {
    if (!img.complete) {
      console.error('Image load timed out after 10 seconds:', img.src);
      img.onerror?.(new ErrorEvent('timeout'));
    }
  }, 10000); // 10 segundos

  // Limpiar el timeout cuando la imagen se cargue o falle
  const originalOnload = img.onload;
  img.onload = (e: Event) => {
    clearTimeout(timeoutId);
    if (img._onloadCallback) {
      img._onloadCallback(e);
    }
    // Call original handler if it exists
    if (originalOnload) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (originalOnload as any).call(img, e);
      } catch (err) {
        console.error('Error calling original onload handler:', err);
      }
    }
  };

  // Store the original error handler
  const originalOnError = img.onerror;
  img.onerror = (evt: Event | string) => {
    clearTimeout(timeoutId);
    // Call original handler if it exists
    if (originalOnError) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (originalOnError as any).call(img, evt);
      } catch (err) {
        console.error('Error calling original onerror handler:', err);
      }
    }
  };
  
  return img;
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
export async function preloadQuestionImages(questions: Question[]): Promise<Record<string, HTMLImageElement>> {
  const preloadedImages: Record<string, HTMLImageElement> = {};
  
  // Crear un array de promesas para cargar todas las imágenes en paralelo
  const loadPromises = questions.map((question) => {
    return new Promise<void>((resolve) => {
      const imageUrl = getBestImageUrl(question);
      
      if (!imageUrl) {
        console.warn(`No valid image URL found for question ${question.id}`);
        resolve();
        return;
      }
      
      const img = createProxyImage(imageUrl);
      
      // Guardar la función de callback original
      img._onloadCallback = img.onload as ((e: Event) => void) | undefined;
      
      // Cuando la imagen se cargue, guardarla en el objeto
      img.onload = () => {
        preloadedImages[question.id] = img;
        console.log(`Image for question ${question.id} preloaded successfully`);
        resolve();
      };
      
      // Si hay error, resolver de todos modos para no bloquear
      img.onerror = () => {
        console.error(`Failed to preload image for question ${question.id}`);
        resolve();
      };
    });
  });
  
  // Esperar a que todas las imágenes se carguen (o fallen)
  await Promise.all(loadPromises);
  
  return preloadedImages;
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