/**
 * Carga una imagen a partir de su referencia
 * @param reference Referencia en formato 'image_reference__ID'
 * @returns URL o datos de la imagen, o null si hay un error
 */
export async function loadImageFromReference(reference: string): Promise<string | null> {
  try {
    console.log('Loading image from reference:', reference);
    
    // Extraer el ID de la referencia
    const imageId = reference.replace('image_reference_', '');
    
    if (!imageId) {
      console.error('Invalid image reference:', reference);
      return null;
    }
    
    // URL del backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    
    // Hacer la solicitud al backend
    const response = await fetch(`${backendUrl}/api/images/${imageId}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching image: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Verificar si la respuesta contiene la URL de la imagen
    if (data.url) {
      return data.url;
    } else {
      console.error('Backend response does not contain image URL:', data);
      return null;
    }
  } catch (error) {
    console.error('Error loading image:', error);
    return null;
  }
} 