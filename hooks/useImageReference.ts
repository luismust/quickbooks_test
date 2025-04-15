import { useState, useEffect } from 'react';
import { loadImageFromReference } from '../utils/image-loader';

/**
 * Hook personalizado para cargar imágenes desde referencias
 * @param reference Referencia de la imagen
 * @returns Un objeto con la imagen cargada y el estado de carga
 */
export function useImageReference(reference: string | undefined) {
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    // Si no hay referencia, no hacemos nada
    if (!reference || !reference.startsWith('image_reference_')) {
      return;
    }
    
    async function fetchImage() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Ensure reference exists before calling loadImageFromReference
        if (reference) {
          const imageUrl = await loadImageFromReference(reference);
          setImage(imageUrl);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        console.error('Error in useImageReference:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchImage();
  }, [reference]);
  
  return { image, isLoading, error };
} 