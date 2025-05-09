"use client"

import React, { 
  useState, 
  useRef, 
  useEffect, 
  useCallback, 
  useMemo,
  MouseEvent,
  SyntheticEvent 
} from 'react'
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Area as AreaType } from "@/lib/test-storage"
import { createProxyImage, getBestImageUrl } from "@/lib/image-utils"
import { clsx } from "clsx"

// Extender el tipo Area importado para incluir imageDimensions
declare module '@/lib/test-storage' {
  interface Area {
    imageDimensions?: {
      naturalWidth: number
      naturalHeight: number
    }
  }
}

interface ImageMapProps {
  src: string
  areas: AreaType[]
  drawingArea: AreaType | null
  onAreaClick: (areaId: string) => void
  alt?: string
  className?: string
  isDrawingMode?: boolean
  isEditMode?: boolean
  onDrawStart?: (x: number, y: number) => void
  onDrawMove?: (x: number, y: number) => void
  onDrawEnd?: () => void
  onError?: () => void
  onClick?: (e: React.MouseEvent) => void
  setDrawingArea?: (area: AreaType | null) => void
  selectedArea?: AreaType | null
  onAreaSelected?: (area: AreaType | null) => void
  onImageLoad?: (width: number, height: number) => void
  onImageLoadError?: (error: string) => void
  onImageLoadRetry?: () => void
  forceFallback?: boolean
}

export function ImageMap({ 
  src, 
  areas, 
  drawingArea,
  onAreaClick, 
  alt = "Image with clickable areas",
  className = "",
  isDrawingMode = false,
  isEditMode = false,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
  onError,
  onClick,
  setDrawingArea,
  selectedArea,
  onAreaSelected,
  onImageLoad,
  onImageLoadError,
  onImageLoadRetry,
  forceFallback
}: ImageMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [usedFallback, setUsedFallback] = useState(false)
  const [imageDimensions, setImageDimensions] = useState({
    naturalWidth: 0,
    naturalHeight: 0
  })
  
  // Placeholder constante para imágenes que fallan
  const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAMAAABHPGVmAAAA21BMVEUAAAD///+/v7+ZmZmqqqqZmZmfn5+dnZ2ampqcnJycnJybm5ubm5uampqampqampqampqbm5uampqampqbm5uampqampqampqampqampqampqamp///+YmJiZmZmampqbm5ucnJydnZ2enp6fnp6fn5+gn5+gn6CgoKChoKChoaGioaGioqKjoqKjo6Ojo6SkpKSlpaWmpqanp6eoqKiqqqpTU1MAAAB8A5ZEAAAARnRSTlMAAQIEBQUGBwcLDBMUFRYaGxwdNjxRVVhdYGRnaWptcXV2eHp7fX5/gISGiImKjI2OkJKTlZebnKCio6Slqq+2uL6/xdDfsgWO3gAAAWhJREFUeNrt1sdSwzAUBVAlkRJaGi33il2CYNvpvZP//6OEBVmWM+PIGlbhncWTcbzwNNb1ZwC8mqDZMaENiXBJVGsCE5KUKbE1GZNURlvLjfUTjC17JNvbgYzUW3qpKxJllJYwKyIw0mSsCRlWBkLhDGTJGE3WEF3KEnGdJYRGlrqKtJEn1A0hWp4w1xBNnlA3kFg5wlzD2o0M4a4j0jJEXEciZQh3A9HkCHMD0fOEuI7IyhGxhojyhLiG6HlCXUdYOcLdRER5Qt1AJDnC3MQ6ZQhxHWvJEu4GIsoR6jrWljKEu4VlP9eMeS5wt5CWpV2WNKqUlPMdKo7oa4jEd2qoqM1DpwVGWp0jmqd+7JQYa/oqsnQ4EfWdSsea8O/yCTgc/3FMSLnUwA8xJhQq44HQB1zySOBCZx8Y3H4mJF8XOJTEBELr8IfzXECYf+fQJ0LO16JvRA5PCK92GMP/FIB3YUC2pHrS/6AAAAAASUVORK5CYII=';
  
  // Función que verifica si una URL de blob es válida
  const checkBlobValidity = async (blobUrl: string): Promise<boolean> => {
    if (!blobUrl || typeof blobUrl !== 'string' || !blobUrl.startsWith('blob:')) {
      return false;
    }
    
    try {
      return new Promise<boolean>((resolve) => {
        const img = new Image();
        
        // Establecer un timeout para evitar esperas infinitas
        const timeoutId = setTimeout(() => {
          console.error('Blob URL validation timed out');
          resolve(false);
        }, 5000);
        
        // Limpiar timeout si la imagen carga o falla
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
  };

  // Función para formatear la URL de la imagen según su tipo
  const formattedSrc = useMemo(() => {
    if (!src) {
      return '';
    }
    
    // Si es una referencia, devolverla sin cambios
    if (typeof src === 'string' && src.startsWith('image_reference_')) {
      return src;
    }
    
    // Si es una cadena vacía, devolver vacío
    if (src === '') {
      return '';
    }
    
    // Si ya es un blob URL, devolverlo como está
    if (typeof src === 'string' && src.startsWith('blob:')) {
      return src;
    }
    
        // Convertir URLs relativas de Airtable a absolutas
    if (typeof src === 'string' && src.startsWith('/v0/')) {
      const correctedUrl = `https://api.airtable.com${src}`;
        return correctedUrl;
      }
    
    // Para cualquier otra URL o formato
      return src;
  }, [src]);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event> | null) => {
    // For the div background approach, we need to use a different method to get natural dimensions
    // Create a temporary image to get the natural dimensions
    const tempImg = new Image();
    tempImg.onload = () => {
      const naturalWidth = tempImg.naturalWidth || 1200; // Default if not available
      const naturalHeight = tempImg.naturalHeight || 600; // Default if not available
      
      // Store the original dimensions for consistent coordinate mapping
      setImageDimensions({
        naturalWidth,
        naturalHeight
      });
      
      // Get a reference to the div container with background image
      const imgContainer = imageRef.current;
      const container = containerRef.current;
      
      if (imgContainer && container) {
        // Use getBoundingClientRect for more accurate dimensions
        const rect = container.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;
        
        // Calculate the scale factor between natural and rendered dimensions
        // We need to maintain aspect ratio while fitting in the container
        const containerRatio = containerWidth / containerHeight;
        const imageRatio = naturalWidth / naturalHeight;
        
        let renderedWidth, renderedHeight;
        
        // Determine if we're in test mode (not drawing or edit mode)
        const isTestMode = !isDrawingMode && !isEditMode;
        
        // In test mode, use a more stable calculation that's less affected by container dimensions
        if (isTestMode) {
          // Force aspect ratio preservation and calculate consistent scale
          if (containerRatio > imageRatio) {
            // Height-constrained (container is wider than image ratio)
            renderedHeight = containerHeight;
            renderedWidth = renderedHeight * imageRatio;
          } else {
            // Width-constrained (container is taller than image ratio)
            renderedWidth = containerWidth;
            renderedHeight = renderedWidth / imageRatio;
          }
          
          // Store calculated dimensions for styling the image precisely
          if (imgContainer) {
            // Set explicit width and height to ensure consistent rendering
            imgContainer.style.width = `${renderedWidth}px`;
            imgContainer.style.height = `${renderedHeight}px`;
          }
        } else {
          // In edit/drawing mode, use the existing approach
          if (containerRatio > imageRatio) {
            renderedHeight = containerHeight;
            renderedWidth = renderedHeight * imageRatio;
          } else {
            renderedWidth = containerWidth;
            renderedHeight = renderedWidth / imageRatio;
          }
        }
        
        // Calculate scale factors
        const scaleX = renderedWidth / naturalWidth;
        const scaleY = renderedHeight / naturalHeight;
        
        // Force identical scales for both modes to ensure consistency
        const effectiveScale = Math.min(scaleX, scaleY);
        
        // Only update if we have valid scale values
        if (effectiveScale > 0 && Number.isFinite(effectiveScale)) {
          setScale(effectiveScale);
        } else {
          console.error("Invalid scale calculated, using default:", effectiveScale);
          setScale(1); // Fallback to default scale
        }
        
        setIsLoading(false);
        setError(false);
        setErrorMessage("");
        setUsedFallback(false);
        setRetryCount(0);
        
        // Force a redraw to ensure areas are positioned correctly
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.opacity = "0.99";
            setTimeout(() => {
              if (containerRef.current) containerRef.current.style.opacity = "1";
            }, 50);
          }
        }, 100);
      } else {
        setIsLoading(false);
      }
    };
    
    tempImg.onerror = () => {
      console.error("Error loading image for dimension calculation");
      setIsLoading(false);
      setScale(1); // Fallback to default scale
    };
    
    tempImg.src = formattedSrc;
  }, [src, formattedSrc, isDrawingMode, isEditMode]);

  // Handler for div container's onLoad event
  const handleDivLoad = useCallback((e: React.SyntheticEvent<HTMLDivElement, Event>) => {
    // Any div-specific logic can go here
  }, []);

  // Intentar alternativas cuando la carga de imagen falla
  const tryAlternativeImage = useCallback(async () => {
    if (usedFallback || !src || typeof src !== 'string') {
      return false;
    }
    
    console.log('Trying alternative image sources for:', src.substring(0, 40) + '...');
    setUsedFallback(true);
    
    // Intentar encontrar una imagen alternativa si el componente está en un contexto de Question
    if (typeof src === 'object') {
      const alternativeUrl = getBestImageUrl(src);
      if (alternativeUrl && alternativeUrl !== formattedSrc) {
        console.log('Found alternative URL:', alternativeUrl);
        
        // Usar createProxyImage para cargar esta alternativa
        const proxyImg = createProxyImage(alternativeUrl);
        if (imageRef.current) {
          imageRef.current.style.backgroundImage = `url(${proxyImg.src})`;
          return true;
        }
      }
    }
    
    // Si es una URL de vercel blob que probablemente expiró, intentar reconstruir
    if (formattedSrc?.startsWith('blob:')) {
      // Primer intento: extraer UUID de la URL si está presente
      const matches = src.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
      
      if (matches && matches[1]) {
        // Encontramos un UUID, intentar usarlo directamente
        const imageId = matches[1];
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickbooks-backend.vercel.app/api';
        const alternativeUrl = `${API_URL}/images?id=${imageId}&redirect=1&t=${Date.now()}`;
        
        console.log('Reconstructed API URL from UUID in blob URL:', alternativeUrl);
        
        try {
          const proxyImg = createProxyImage(alternativeUrl);
          if (imageRef.current) {
            imageRef.current.style.backgroundImage = `url(${proxyImg.src})`;
            return true;
          }
        } catch (e) {
          console.error('Error loading reconstructed URL:', e);
        }
      } 
      
      // Segundo intento: buscar el identificador de testId en la URL
      // Ejemplo: si la URL es blob:https://tests-system.vercel.app/f1033d4-77b9-4f97-af53-6cce663518d0
      const testIdMatches = src.match(/test-([^\/]+)\.vercel/i);
      if (testIdMatches && testIdMatches[1]) {
        const testId = testIdMatches[1];
        console.log('Extracted test ID from blob URL:', testId);
        
        // Intentar reconstruir una URL basada en el servicio
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickbooks-backend.vercel.app/api';
        
        // Intentar usar una URL genérica para este test
        const fallbackUrl = `${API_URL}/assets/${testId}/images/question_${Date.now()}.jpg`;
        console.log('Trying fallback generic URL based on test ID:', fallbackUrl);
        
        try {
          const proxyImg = createProxyImage(fallbackUrl);
          if (imageRef.current) {
            imageRef.current.style.backgroundImage = `url(${proxyImg.src})`;
            return true;
          }
        } catch (e) {
          console.error('Error loading fallback URL:', e);
        }
      }
    }
    
    // Último recurso: simplemente mostrar un placeholder en vez de nada
    if (imageRef.current && formattedSrc?.startsWith('blob:')) {
      console.log('All alternatives failed, showing placeholder image');
      imageRef.current.style.backgroundImage = `url(${placeholderImage})`;
      handleImageLoad(null);
      return true;
    }
    
    return false;
  }, [formattedSrc, src, usedFallback, handleImageLoad]);

  const handleError = async () => {
    // Si la URL es un blob, verificar si sigue siendo válido
    if (formattedSrc?.startsWith('blob:')) {
      const isValid = await checkBlobValidity(formattedSrc);
      if (!isValid) {
        console.log('Blob URL failed, likely expired:', formattedSrc);
        setErrorMessage("Blob URL has expired. Trying alternatives...");
        
        // Intentar alternativas inmediatamente para URLs blob inválidas
        const foundAlternative = await tryAlternativeImage();
        if (foundAlternative) {
          console.log('Found and using alternative for expired blob URL');
          return; // Si encontramos alternativa, salir de la función
        }
      }
    }
    
    // Si la URL es de la API y no tiene redirect=1, intentar con redirect=1
    if (formattedSrc && typeof formattedSrc === 'string' && 
        formattedSrc.includes('quickbooks-backend') && 
        formattedSrc.includes('id=') && 
        !formattedSrc.includes('redirect=1')) {
      
      // Modificar para usar redirect=1, que evita problemas CORS
      const newUrl = `${formattedSrc}${formattedSrc.includes('?') ? '&' : '?'}redirect=1&t=${Date.now()}`;
      console.log('Retrying image with redirect=1 to avoid CORS issues:', newUrl);
      
      if (imageRef.current) {
        const img = createProxyImage(newUrl);
        img.onload = () => {
          if (imageRef.current) {
            // Actualizar el div de imagen con el nuevo src
            imageRef.current.style.backgroundImage = `url(${newUrl})`;
            handleImageLoad(null);
          }
        };
        return;
      }
    }
    
    // Error de CORS específico
    if (formattedSrc && 
       !formattedSrc.startsWith('data:') && 
       !formattedSrc.startsWith('blob:') &&
       !formattedSrc.includes('redirect=1')) {
      
      console.log('Possible CORS error, attempting with proxy:', formattedSrc);
      
      // Usar técnica alternativa para URL con posible error CORS
      const timestamp = Date.now();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickbooks-backend.vercel.app/api';
      
      // Si la URL tiene una forma que podemos convertir a petición de proxy
      const urlMatch = formattedSrc.match(/\/images\/([^\/\?]+)/i);
      if (urlMatch && urlMatch[1]) {
        const imageId = urlMatch[1];
        const proxyUrl = `${API_URL}/images?id=${imageId}&redirect=1&t=${timestamp}`;
        
        console.log('Trying to load image through proxy URL:', proxyUrl);
        
        if (imageRef.current) {
          const img = createProxyImage(proxyUrl);
          img.onload = () => {
            if (imageRef.current) {
              // Actualizar el div de imagen con el nuevo src
              imageRef.current.style.backgroundImage = `url(${proxyUrl})`;
              handleImageLoad(null);
            }
          };
          img.onerror = () => {
            // Continuar con los reintentos normales si esto no funciona
            continueWithRetries();
          };
          return;
        }
      }
    }
    
    // Proceso normal de reintentos
    continueWithRetries();
    
    function continueWithRetries() {
    // Aumentar el máximo de reintentos
      if (retryCount >= 2) {
        console.error('Error loading image after multiple attempts:', formattedSrc);
        
        // Intentar alternativas antes de rendirnos
        const foundAlternative = tryAlternativeImage();
        if (!foundAlternative) {
          setIsLoading(false);
          setError(true);
          setErrorMessage(`Could not load the image after multiple attempts.`);
      
      // Depurar la causa del error
      console.log('Source format analysis:', {
        isBase64: formattedSrc?.startsWith('data:image/'),
        isHttp: formattedSrc?.startsWith('http'),
        isBlob: formattedSrc?.startsWith('blob:'),
        isAirtable: formattedSrc?.includes('api.airtable.com'),
        sourceLength: formattedSrc?.length || 0,
        sourceStart: formattedSrc?.substring(0, 50) || 'empty'
      });
      
          onError?.();
      }
        return;
    }
    
      setRetryCount(prev => prev + 1);
      console.error(`Error loading image (attempt ${retryCount + 1}):`, formattedSrc);
    
    // Si es una URL relativa de Airtable, intentar corregirla
    if (formattedSrc?.includes('api.airtable.com') && !formattedSrc.startsWith('https://')) {
      const correctedUrl = `https://api.airtable.com/${formattedSrc.replace(/^\/+/, '')}`;
      console.log('Attempting with corrected Airtable URL:', correctedUrl);
        
        if (imageRef.current) {
          imageRef.current.style.backgroundImage = `url(${correctedUrl})`;
      return;
        }
      }
      
      setIsLoading(false);
      setError(true);
      setErrorMessage("Could not load the image. Trying alternatives...");
      
      // Intentar alternativas
      const foundAlternative = tryAlternativeImage();
      if (!foundAlternative) {
        toast.error("Could not load the image. Check the URL.");
        onError?.();
      }
    }
  }
  
  // Update the useEffect that loads the image
  useEffect(() => {
    if (formattedSrc) {
      setIsLoading(true);
        setError(false);
      setErrorMessage("");
      
      // For blob URLs, first verify they're still valid
      if (formattedSrc.startsWith('blob:')) {
        checkBlobValidity(formattedSrc).then(isValid => {
          if (isValid) {
            if (imageRef.current) {
              imageRef.current.style.backgroundImage = `url(${formattedSrc})`;
              
              // Trigger load dimensions manually
              const tempImg = new Image();
              tempImg.onload = () => handleImageLoad(null);
              tempImg.onerror = () => handleError();
              tempImg.src = formattedSrc;
            }
      } else {
            console.error('Blob URL is invalid, trying alternatives');
            setError(true);
            setErrorMessage("The image reference is no longer valid");
            tryAlternativeImage();
          }
        });
    } else {
        // For regular URLs or data URIs
        if (imageRef.current) {
          imageRef.current.style.backgroundImage = `url(${formattedSrc})`;
          
          // Trigger load dimensions manually
          const tempImg = new Image();
          tempImg.onload = () => handleImageLoad(null);
          tempImg.onerror = () => handleError();
          tempImg.src = formattedSrc;
        }
      }
    } else {
      setIsLoading(false);
      setError(true);
    }
  }, [formattedSrc, checkBlobValidity, handleImageLoad]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isDrawingMode || !containerRef.current) return;
    
    // Obtener las referencias del contenedor y la imagen
    const container = containerRef.current;
    const image = imageRef.current;
    
    if (!image) return;
    
    // Verificar que las dimensiones naturales existan
    if (imageDimensions.naturalWidth <= 0 || imageDimensions.naturalHeight <= 0) {
      console.error('Error: Natural dimensions are invalid', imageDimensions);
      toast.error('Error: Cannot draw - image dimensions are invalid');
      return;
    }
    
    // Obtener dimensiones del contenedor
    const containerRect = container.getBoundingClientRect();
    
    // Calcular posición del clic
    const clickX = e.clientX - containerRect.left;
    const clickY = e.clientY - containerRect.top;
    
    // Obtener dimensiones naturales de la imagen
    const naturalWidth = Math.max(imageDimensions.naturalWidth, 1);
    const naturalHeight = Math.max(imageDimensions.naturalHeight, 1);
    
    // Calcular dimensiones renderizadas
    const imageRatio = naturalWidth / naturalHeight;
    const containerRatio = containerRect.width / containerRect.height;
    
    let renderedWidth, renderedHeight;
    if (containerRatio > imageRatio) {
      // Limitado por altura
      renderedHeight = containerRect.height;
      renderedWidth = renderedHeight * imageRatio;
    } else {
      // Limitado por ancho
      renderedWidth = containerRect.width;
      renderedHeight = renderedWidth / imageRatio;
    }
    
    // Calcular márgenes para centrado
    const marginLeft = (containerRect.width - renderedWidth) / 2;
    const marginTop = (containerRect.height - renderedHeight) / 2;
    
    // Ajustar posición para considerar márgenes
    const adjustedX = clickX - marginLeft;
    const adjustedY = clickY - marginTop;
    
    // Convertir a coordenadas naturales
    let naturalX = Math.round((adjustedX / renderedWidth) * naturalWidth);
    let naturalY = Math.round((adjustedY / renderedHeight) * naturalHeight);
    
    // Limitar a los límites de la imagen
    naturalX = Math.max(0, Math.min(naturalWidth, naturalX));
    naturalY = Math.max(0, Math.min(naturalHeight, naturalY));
    
    console.log('MouseDown:', {
      click: { x: clickX, y: clickY },
      adjusted: { x: adjustedX, y: adjustedY },
      natural: { x: naturalX, y: naturalY },
      imageDimensions: {
        naturalWidth,
        naturalHeight
      }
    });
    
    // NUEVO: Crear el área de dibujo aquí mismo
    if (setDrawingArea) {
      const newDrawingArea: AreaType = {
        id: generateId(),
        shape: "rect" as const,
        coords: [naturalX, naturalY, naturalX, naturalY],
        isCorrect: true,
        x: naturalX,
        y: naturalY,
        width: 0,
        height: 0,
        // CRUCIAL: Guardar las dimensiones naturales con el área
        imageDimensions: {
          naturalWidth,
          naturalHeight
        }
      };
      
      // Verificar que las dimensiones son válidas
      if (!newDrawingArea.imageDimensions || 
          newDrawingArea.imageDimensions.naturalWidth <= 0 || 
          newDrawingArea.imageDimensions.naturalHeight <= 0) {
        console.error('Error: Created area with invalid dimensions', newDrawingArea.imageDimensions);
        toast.error('Error: Cannot create area - invalid dimensions');
        return;
      }
      
      console.log('Created drawing area with dimensions:', newDrawingArea.imageDimensions);
      setDrawingArea(newDrawingArea);
    }
    
    // Iniciar el arrastre y notificar
    setIsDragging(true);
    onDrawStart?.(naturalX, naturalY);
    
    // Prevenir comportamientos del navegador
    e.preventDefault();
  }, [isDrawingMode, onDrawStart, imageDimensions, setDrawingArea]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawingMode || !containerRef.current || !isDragging || !drawingArea) return;
    
    // Obtener referencias
    const container = containerRef.current;
    const image = imageRef.current;
    
    if (!image) return;
    
    // Verificar dimensiones
    if (!drawingArea.imageDimensions) {
      console.error('Error: Missing image dimensions in drawing area - using current dimensions');
      drawingArea.imageDimensions = {
        naturalWidth: imageDimensions.naturalWidth,
        naturalHeight: imageDimensions.naturalHeight
      };
    }
    
    // Verificar valores válidos
    if (drawingArea.imageDimensions.naturalWidth <= 0 || drawingArea.imageDimensions.naturalHeight <= 0) {
      console.error('Error: Invalid image dimensions for coordinate calculation', drawingArea.imageDimensions);
      return;
    }
    
    // Obtener dimensiones del contenedor
    const containerRect = container.getBoundingClientRect();
    
    // Calcular posición del clic
    const clickX = e.clientX - containerRect.left;
    const clickY = e.clientY - containerRect.top;
    
    // Obtener dimensiones naturales de la imagen
    const naturalWidth = Math.max(drawingArea.imageDimensions.naturalWidth, 1);
    const naturalHeight = Math.max(drawingArea.imageDimensions.naturalHeight, 1);
    
    // Calcular dimensiones renderizadas
    const imageRatio = naturalWidth / naturalHeight;
    const containerRatio = containerRect.width / containerRect.height;
    
    let renderedWidth, renderedHeight;
    if (containerRatio > imageRatio) {
      // Limitado por altura
      renderedHeight = containerRect.height;
      renderedWidth = renderedHeight * imageRatio;
    } else {
      // Limitado por ancho
      renderedWidth = containerRect.width;
      renderedHeight = renderedWidth / imageRatio;
    }
    
    // Calcular márgenes para centrado
    const marginLeft = (containerRect.width - renderedWidth) / 2;
    const marginTop = (containerRect.height - renderedHeight) / 2;
    
    // Ajustar posición para considerar márgenes
    const adjustedX = clickX - marginLeft;
    const adjustedY = clickY - marginTop;
    
    // Convertir a coordenadas naturales
    let naturalX = Math.round((adjustedX / renderedWidth) * naturalWidth);
    let naturalY = Math.round((adjustedY / renderedHeight) * naturalHeight);
    
    // Limitar a los límites de la imagen
    naturalX = Math.max(0, Math.min(naturalWidth, naturalX));
    naturalY = Math.max(0, Math.min(naturalHeight, naturalY));
    
    // Solo mostrar cada cierto tiempo para no saturar la consola
    if (Math.random() < 0.05) {
      console.log('MouseMove:', {
        click: { x: clickX, y: clickY },
        adjusted: { x: adjustedX, y: adjustedY },
        natural: { x: naturalX, y: naturalY }
      });
    }
    
    // Continuar con el proceso de dibujo
    const startX = drawingArea.x || 0;
    const startY = drawingArea.y || 0;
    
    // Actualizar el área de dibujo
    if (setDrawingArea) {
      setDrawingArea({
        ...drawingArea,
        coords: [startX, startY, naturalX, naturalY],
        width: Math.abs(naturalX - startX),
        height: Math.abs(naturalY - startY),
      });
    }
    
    if (onDrawMove) {
      onDrawMove(naturalX, naturalY);
    }
    
    // Prevenir comportamientos del navegador
    e.preventDefault();
  }, [isDrawingMode, isDragging, drawingArea, setDrawingArea, onDrawMove, imageDimensions]);
  
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDrawingMode || !isDragging || !containerRef.current || !drawingArea) return;
    
    // Verificar que el área tiene dimensiones válidas
    if (!drawingArea.coords || drawingArea.coords.length < 4) {
      console.error('Invalid drawing area coordinates on mouse up');
      setIsDragging(false);
      return;
    }
    
    // Calcular ancho y alto
    const width = Math.abs(drawingArea.coords[2] - drawingArea.coords[0]);
    const height = Math.abs(drawingArea.coords[3] - drawingArea.coords[1]);
    
    // Verificar si el área es demasiado pequeña
    if (width < 5 || height < 5) {
      console.log('Área demasiado pequeña, ignorando');
      toast.error('El área seleccionada es demasiado pequeña. Intenta arrastrar más.');
      
      // Limpiar el área de dibujo si es demasiado pequeña
      if (setDrawingArea) {
        setDrawingArea(null);
      }
      
      setIsDragging(false);
      return;
    }
    
    console.log('MouseUp: Finalizado dibujo de área', {
      coords: drawingArea.coords,
      width,
      height
    });
    
    // Mantener el área actual y notificar al componente padre
    setIsDragging(false);
    onDrawEnd?.();
    
    // Prevenir comportamientos del navegador
    e.preventDefault();
    
    // Force a component redraw
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.style.opacity = "0.99";
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.opacity = "1";
          }
        }, 10);
      }
    }, 10);
  }, [isDrawingMode, isDragging, drawingArea, setDrawingArea, onDrawEnd]);
  
  // Añadimos un manejador global para capturar cuando se suelta el botón del ratón fuera del componente
  useEffect(() => {
    if (isDrawingMode) {
      const handleGlobalMouseUp = () => {
        if (isDragging) {
          setIsDragging(false)
          onDrawEnd?.()
        }
      }
      
      window.addEventListener('mouseup', handleGlobalMouseUp)
      return () => {
        window.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isDrawingMode, isDragging, onDrawEnd])

  // Determinar el estilo de las áreas basado en el modo
  const getAreaStyle = (area: AreaType) => {
    // En modo edición, mostrar áreas correctas en verde e incorrectas en rojo
    if (isEditMode) {
      return area.isCorrect ? 'border-green-500' : 'border-red-500';
    }
    // En modo prueba, hacer las áreas muy sutiles pero detectables al hover
    return 'hover:bg-white/10';
  }

  // Determinar la clase de cursor basado en el modo
  const getCursorClass = (isDrawingMode: boolean, isEditMode: boolean) => {
    if (isDrawingMode) return "cursor-crosshair";
    if (isEditMode) return ""; // cursor normal
    return "cursor-pointer"; // cursor pointer en modo test para indicar que es clicable
  }

  // Helper function to calculate dimensions consistently
  const calculateDimension = (start: number, end: number, isXAxis: boolean): { size: number, min: number } => {
    // Get container and image references
    const container = containerRef.current;
    const imageElement = imageRef.current;
    
    // Make sure we have all the needed references
    if (!container || !imageElement) {
      console.error('Missing container or image element references');
      const min = Math.min(start, end);
      const size = Math.abs(end - start) * scale;
      return { size, min };
    }
    
    // Obtener las dimensiones del contenedor - MISMO QUE getConsistentAreaPosition
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // SOLUCIÓN FIJA: Usar valores constantes para las dimensiones naturales
    const naturalWidth = Math.max(imageDimensions.naturalWidth, 1);
    const naturalHeight = Math.max(imageDimensions.naturalHeight, 1);
    
    // Calcular la relación de aspecto
    const imageRatio = naturalWidth / naturalHeight;
    const containerRatio = containerWidth / containerHeight;
    
    // Calcular las dimensiones de renderizado reales
    let renderedWidth, renderedHeight;
    
    if (containerRatio > imageRatio) {
      // Limitado por altura
      renderedHeight = containerHeight;
      renderedWidth = renderedHeight * imageRatio;
    } else {
      // Limitado por ancho
      renderedWidth = containerWidth;
      renderedHeight = renderedWidth / imageRatio;
    }
    
    // Calcular el factor de escala basado en la dimensión
    // MISMO QUE en getConsistentAreaPosition
    const scaleFactor = isXAxis
      ? renderedWidth / naturalWidth
      : renderedHeight / naturalHeight;
    
    // Calcular tamaño final
    const min = Math.min(start, end);
    const size = Math.abs(end - start) * scaleFactor;
    
    return { size, min };
  };

  // Add a special function for test mode rendering that uses exact pixel positioning
  const renderTestModeArea = (area: AreaType) => {
    // Make sure we have valid coordinates and references
    if (!area.coords || area.coords.length < 4 || !containerRef.current || !imageRef.current) {
      console.error('Cannot render area without valid coordinates or references:', area);
      return null;
    }
    
    // Validar coordenadas
    const hasInvalidCoords = area.coords.some(coord => 
      !Number.isFinite(coord) || Number.isNaN(coord)
    );
    
    if (hasInvalidCoords) {
      console.error('Invalid coordinates for area rendering:', { id: area.id, coords: area.coords });
      return null;
    }
    
    // SOLUCIÓN: Usar directamente las coordenadas originales sin normalización
    const coords = area.coords;
    
    // Calcular posición con exactamente el mismo método que usamos para la detección de clics
    const pixelLeft = getConsistentAreaPosition(coords, 0);
    const pixelTop = getConsistentAreaPosition(coords, 1);
    
    // Calcular dimensiones con el mismo método exacto
    const { size: pixelWidth } = calculateDimension(coords[0], coords[2], true);
    const { size: pixelHeight } = calculateDimension(coords[1], coords[3], false);
    
    // Aplicar dimensiones mínimas para mejor clickabilidad
    const minDimension = 12;
    const finalWidth = Math.max(pixelWidth, minDimension);
    const finalHeight = Math.max(pixelHeight, minDimension);
    
    // Información de depuración para desarrollo
    const debugInfo = process.env.NODE_ENV === 'development' ? {
      outline: '1px solid rgba(255,0,0,0.7)',
      'data-debug-coords': `${coords.join(',')}`,
      'data-debug-position': `@${Math.round(pixelLeft)},${Math.round(pixelTop)}`,
      'data-debug-size': `${Math.round(finalWidth)}x${Math.round(finalHeight)}`
    } : {};
    
    // Retornar el área renderizada
    return (
      <div
        key={`area-${area.id}`}
        data-area-id={area.id}
        data-is-correct={area.isCorrect ? "true" : "false"}
        className="absolute transition-colors hover:bg-white/10 cursor-pointer"
        style={{
          left: pixelLeft,
          top: pixelTop,
          width: finalWidth,
          height: finalHeight,
          background: 'rgba(255,255,255,0.03)',
          border: 'none',
          ...(process.env.NODE_ENV === 'development' ? {
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)',
            outline: '1px dashed rgba(255,0,0,0.5)',
            ...debugInfo
          } : {})
        }}
      />
    );
  };

  // Restore the getConsistentAreaPosition function that was removed
  const getConsistentAreaPosition = (coords: number[], index: number): number => {
    // Make sure we have valid coordinates
    if (!coords || coords.length < 4 || !Number.isFinite(coords[index])) {
      console.error('Invalid coordinate at index', index);
      return 0;
    }
    
    // Get container and image references
    const container = containerRef.current;
    const imageElement = imageRef.current;
    
    if (!container || !imageElement) {
      console.error('Missing container or image element references');
      return coords[index] * scale;
    }
    
    // Obtener las dimensiones del contenedor
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // SOLUCIÓN FIJA: Usar valores constantes para las dimensiones naturales
    // En lugar de confiar en valores calculados que pueden variar
    const naturalWidth = Math.max(imageDimensions.naturalWidth, 1);
    const naturalHeight = Math.max(imageDimensions.naturalHeight, 1);
    
    // Calcular la relación de aspecto
    const imageRatio = naturalWidth / naturalHeight;
    const containerRatio = containerWidth / containerHeight;
    
    // Calcular las dimensiones de renderizado reales
    let renderedWidth, renderedHeight;
    
    if (containerRatio > imageRatio) {
      // Limitado por altura
      renderedHeight = containerHeight;
      renderedWidth = renderedHeight * imageRatio;
    } else {
      // Limitado por ancho
      renderedWidth = containerWidth;
      renderedHeight = renderedWidth / imageRatio;
    }
    
    // Calcular los márgenes para centrado
    const marginLeft = Math.max(0, (containerWidth - renderedWidth) / 2);
    const marginTop = Math.max(0, (containerHeight - renderedHeight) / 2);
    
    // Obtener la coordenada actual
    const coordValue = coords[index];
    
    // Calcular la posición final basada en el índice
    if (index % 2 === 0) { // Coordenada X
      // Transformación precisa de la coordenada X
      const scaleFactor = renderedWidth / naturalWidth;
      return marginLeft + (coordValue * scaleFactor);
    } else { // Coordenada Y
      // Transformación precisa de la coordenada Y
      const scaleFactor = renderedHeight / naturalHeight;
      return marginTop + (coordValue * scaleFactor);
    }
  };

  // Add data attributes for better debugging
  useEffect(() => {
    // Aplicar atributos de datos para depuración
    if (containerRef.current && imageRef.current) {
      const container = containerRef.current;
      
      // Agregar atributos de datos al contenedor para facilitar depuración
      if (imageDimensions.naturalWidth > 0 && imageDimensions.naturalHeight > 0) {
        container.setAttribute('data-natural-width', imageDimensions.naturalWidth.toString());
        container.setAttribute('data-natural-height', imageDimensions.naturalHeight.toString());
        container.setAttribute('data-mode', !isDrawingMode && !isEditMode ? "test" : "edit");
        container.setAttribute('data-scale', scale.toString());
      }
    }
  }, [imageDimensions, scale, isDrawingMode, isEditMode]);

  // Función simplificada para mapear coordenadas con un enfoque único
  const mapCoordToPixel = (coord: number, dimension: number, isWidth: boolean): number => {
    // Validar datos de entrada
    if (!Number.isFinite(coord) || !Number.isFinite(dimension) || dimension <= 0) {
      console.error('Invalid input to mapCoordToPixel:', { coord, dimension, isWidth });
      return 0;
    }
    
    // Si no hay referencias, devolver 0
    if (!containerRef.current || !imageRef.current) return 0;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Dimensiones naturales (siempre debe ser > 0)
    const naturalWidth = Math.max(imageDimensions.naturalWidth, 1);
    const naturalHeight = Math.max(imageDimensions.naturalHeight, 1);
    
    // Calcular relación de aspecto
    const imageRatio = naturalWidth / naturalHeight;
    
    // Calcular dimensiones del contenedor
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Calcular dimensiones de renderizado basadas en la relación de aspecto
    let renderedWidth, renderedHeight;
    
    if (containerWidth / containerHeight > imageRatio) {
      // Limitado por altura
      renderedHeight = containerHeight;
      renderedWidth = renderedHeight * imageRatio;
    } else {
      // Limitado por ancho
      renderedWidth = containerWidth;
      renderedHeight = renderedWidth / imageRatio;
    }
    
    // Calcular márgenes
    const marginLeft = (containerWidth - renderedWidth) / 2;
    const marginTop = (containerHeight - renderedHeight) / 2;
    
    // Calcular valor en píxeles
    const value = isWidth
      ? marginLeft + (coord / naturalWidth) * renderedWidth
      : marginTop + (coord / naturalHeight) * renderedHeight;
    
    return value;
  }

  // Función simplificada para renderizar áreas en cualquier modo
  const renderArea = (area: AreaType, mode: 'test' | 'edit' = 'edit') => {
    if (!area.coords || area.coords.length < 4) {
      console.error('Invalid area coordinates:', area.id);
      return null;
    }
    
    // Validar coordenadas
    const hasInvalidCoords = area.coords.some(coord => 
      !Number.isFinite(coord) || Number.isNaN(coord)
    );
    
    if (hasInvalidCoords) {
      console.error('Area has invalid coordinates:', area);
      return null;
    }
    
    // CRUCIAL: Validar que el área tiene dimensiones naturales asociadas
    if (!area.imageDimensions || 
        !area.imageDimensions.naturalWidth || 
        !area.imageDimensions.naturalHeight ||
        area.imageDimensions.naturalWidth <= 0 ||
        area.imageDimensions.naturalHeight <= 0) {
      
      console.error('Area is missing valid image dimensions, using current dimensions:', {
        areaId: area.id,
        missingDimensions: area.imageDimensions,
        usingCurrentDimensions: imageDimensions
      });
      
      // Añadir dimensiones si faltan
      area.imageDimensions = {
        naturalWidth: imageDimensions.naturalWidth,
        naturalHeight: imageDimensions.naturalHeight
      };
    }
    
    // Obtener coordenadas ordenadas
    const x1 = Math.min(area.coords[0], area.coords[2]);
    const y1 = Math.min(area.coords[1], area.coords[3]);
    const x2 = Math.max(area.coords[0], area.coords[2]);
    const y2 = Math.max(area.coords[1], area.coords[3]);
    
    // Calcular dimensiones
    const width = x2 - x1;
    const height = y2 - y1;
    
    // Obtener el contenedor y la imagen
    const container = containerRef.current;
    const image = imageRef.current;
    
    if (!container || !image) {
      console.error('Missing container or image references');
      return null;
    }
    
    // Obtener dimensiones del contenedor
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Usar dimensiones almacenadas en el área
    const referenceNaturalWidth = area.imageDimensions.naturalWidth;
    const referenceNaturalHeight = area.imageDimensions.naturalHeight;
    
    // Si hay diferencia entre dimensiones almacenadas y actuales, ajustar coordenadas
    const widthRatio = imageDimensions.naturalWidth / referenceNaturalWidth;
    const heightRatio = imageDimensions.naturalHeight / referenceNaturalHeight;
    
    // Calcular relación de aspecto
    const imageRatio = referenceNaturalWidth / referenceNaturalHeight;
    const containerRatio = containerWidth / containerHeight;
    
    // Calcular dimensiones de renderizado
    let renderedWidth, renderedHeight;
    if (containerRatio > imageRatio) {
      // Altura limitada
      renderedHeight = containerHeight;
      renderedWidth = renderedHeight * imageRatio;
    } else {
      // Ancho limitado
      renderedWidth = containerWidth;
      renderedHeight = renderedWidth / imageRatio;
    }
    
    // Calcular márgenes para centrado
    const marginLeft = (containerWidth - renderedWidth) / 2;
    const marginTop = (containerHeight - renderedHeight) / 2;
    
    // Calcular el factor de escala para convertir coordenadas naturales a píxeles
    const scaleX = renderedWidth / referenceNaturalWidth;
    const scaleY = renderedHeight / referenceNaturalHeight;
    
    // Convertir coordenadas naturales a píxeles
    const left = marginLeft + (x1 * scaleX);
    const top = marginTop + (y1 * scaleY);
    const areaWidth = width * scaleX;
    const areaHeight = height * scaleY;
    
    // Aplicar dimensiones mínimas para mejor clickabilidad
    const minDimension = 12;
    const finalWidth = Math.max(areaWidth, minDimension);
    const finalHeight = Math.max(areaHeight, minDimension);
    
    // Información de depuración
    const debugInfo = process.env.NODE_ENV === 'development' ? {
      outline: '1px solid rgba(255,0,0,0.7)',
      'data-coords': `${x1},${y1},${x2},${y2}`,
      'data-pixel-pos': `${Math.round(left)},${Math.round(top)},${Math.round(finalWidth)},${Math.round(finalHeight)}`,
      'data-reference-dims': `${referenceNaturalWidth}x${referenceNaturalHeight}`,
      'data-current-dims': `${imageDimensions.naturalWidth}x${imageDimensions.naturalHeight}`,
      'data-scales': `x:${scaleX.toFixed(4)},y:${scaleY.toFixed(4)}`,
      'data-ratios': `w:${widthRatio.toFixed(2)},h:${heightRatio.toFixed(2)}`
    } : {};
    
    // Retornar div del área
    return (
      <div
        key={`area-${area.id}-${mode}`}
        data-area-id={area.id}
        data-is-correct={area.isCorrect ? "true" : "false"}
        data-area-mode={mode}
        className={`absolute transition-colors ${
          mode === 'edit' 
            ? (area.isCorrect ? 'border-green-500' : 'border-red-500')
            : 'hover:bg-white/10'
        } ${mode === 'edit' ? 'hover:bg-primary/10' : ''} cursor-pointer`}
        style={{
      left,
      top,
      width: finalWidth,
          height: finalHeight,
          background: mode === 'edit' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
          border: mode === 'edit' ? '1px solid' : 'none',
          ...(process.env.NODE_ENV === 'development' ? {
            boxShadow: mode === 'edit' ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,0.2)',
            outline: mode !== 'edit' ? '1px dashed rgba(255,0,0,0.5)' : 'none',
            ...debugInfo
          } : {})
        }}
      />
    );
  }

  // Constante para corrección de margen
  const marginCorrection = 2;

  // Actualizar la sección de renderizado de áreas
  {!isLoading && areas.filter(area => {
    if (!area.coords || area.coords.length < 4) {
      console.error('Skipping area with invalid coords:', area.id);
      return false;
    }
    
    const hasInvalidCoords = area.coords.some(coord => 
      !Number.isFinite(coord) || Number.isNaN(coord)
    );
    
    if (hasInvalidCoords) {
      console.error('Skipping area with invalid coordinates:', area.id, area.coords);
      return false;
    }
    
    return true;
  }).map((area) => {
    // Usar la misma función para renderizar áreas en ambos modos
    return renderArea(area, !isDrawingMode && !isEditMode ? 'test' : 'edit');
  })}

  // Update the click detection to use the same mapping logic
  const isPointInArea = (x: number, y: number, area: AreaType): boolean => {
    if (!area.coords || area.coords.length < 4) return false;
    
    // Verificar coordenadas válidas
    const hasInvalidCoords = area.coords.some(coord => !Number.isFinite(coord) || Number.isNaN(coord));
    if (hasInvalidCoords) {
      console.error('Invalid area coordinates:', area.id, area.coords);
      return false;
    }
    
    // Obtener referencias
    if (!containerRef.current || !imageRef.current) {
      console.error('Missing container or image references');
      return false;
    }
    
    // Obtener el contenedor
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // SOLUCIÓN: Usar dimensiones almacenadas en el área si están disponibles
    const referenceNaturalWidth = area.imageDimensions?.naturalWidth || imageDimensions.naturalWidth;
    const referenceNaturalHeight = area.imageDimensions?.naturalHeight || imageDimensions.naturalHeight;
    
    // Obtener coordenadas ordenadas
    const x1 = Math.min(area.coords[0], area.coords[2]);
    const y1 = Math.min(area.coords[1], area.coords[3]);
    const x2 = Math.max(area.coords[0], area.coords[2]);
    const y2 = Math.max(area.coords[1], area.coords[3]);
    
    // Calcular dimensiones
    const width = x2 - x1;
    const height = y2 - y1;
    
    // Calcular relación de aspecto
    const imageRatio = referenceNaturalWidth / referenceNaturalHeight;
    const containerRatio = containerWidth / containerHeight;
    
    // Calcular dimensiones de renderizado
    let renderedWidth, renderedHeight;
    if (containerRatio > imageRatio) {
      // Altura limitada
      renderedHeight = containerHeight;
      renderedWidth = renderedHeight * imageRatio;
    } else {
      // Ancho limitado
      renderedWidth = containerWidth;
      renderedHeight = renderedWidth / imageRatio;
    }
    
    // Calcular márgenes para centrado
    const marginLeft = (containerWidth - renderedWidth) / 2;
    const marginTop = (containerHeight - renderedHeight) / 2;
    
    // Calcular el factor de escala para convertir coordenadas naturales a píxeles
    const scaleX = renderedWidth / referenceNaturalWidth;
    const scaleY = renderedHeight / referenceNaturalHeight;
    
    // Convertir coordenadas naturales a píxeles
    const left = marginLeft + (x1 * scaleX);
    const top = marginTop + (y1 * scaleY);
    const areaWidth = width * scaleX;
    const areaHeight = height * scaleY;
    
    // Aplicar dimensiones mínimas
    const minDimension = 12;
    const finalWidth = Math.max(areaWidth, minDimension);
    const finalHeight = Math.max(areaHeight, minDimension);
    
    // Calcular límites del área
    const right = left + finalWidth;
    const bottom = top + finalHeight;
    
    // Margen de error para facilitar el clic
    const errorMargin = 5;
    
    // Verificar si el punto está dentro del área
    const isInside = 
      x >= (left - errorMargin) && 
      x <= (right + errorMargin) && 
      y >= (top - errorMargin) && 
      y <= (bottom + errorMargin);
    
    return isInside;
  };
  
  // Función para manejar el clic en un área específica
  const handleAreaClick = useCallback((e: React.MouseEvent) => {
    if (isDrawingMode || !containerRef.current) return false;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Verificar qué área fue clickeada
    let clickedAreaId: string | null = null;
    let clickedArea: AreaType | null = null;
    
    // Revisar áreas en orden inverso (las últimas dibujadas están encima)
    for (let i = areas.length - 1; i >= 0; i--) {
      const area = areas[i];
      if (isPointInArea(clickX, clickY, area)) {
        clickedAreaId = area.id;
        clickedArea = area;
        break;
      }
    }
    
    if (clickedAreaId && clickedArea) {
      onAreaClick(clickedAreaId);
      
      // Solo mostrar feedback visual en modo edición
      if (isEditMode) {
        const clickedElement = document.querySelector(`[data-area-id="${clickedAreaId}"]`);
        if (clickedElement) {
          clickedElement.classList.add('bg-primary/20');
          setTimeout(() => {
            clickedElement.classList.remove('bg-primary/20');
          }, 300);
        }
      }
      
      return true;
    }
    
    // Si no se hizo clic en ningún área y hay un onClick definido, llamarlo
    if (onClick) {
      onClick(e);
      return true;
    }
    
    return false;
  }, [isDrawingMode, areas, isEditMode, onAreaClick, onClick, isPointInArea]);

  // Add a useEffect to monitor changes in the areas and force a re-render
  useEffect(() => {
    if (areas.length > 0) {
      // Forzar una actualización más agresiva para asegurar que las áreas se rendericen correctamente
      const forceRerender = () => {
        if (containerRef.current) {
          // Aplicar un pequeño cambio visual para forzar re-renderizado
          containerRef.current.style.opacity = "0.97";
          
          // Forzar reflow
          void containerRef.current.offsetHeight;
          
          // Restaurar opacidad
          requestAnimationFrame(() => {
            if (containerRef.current) {
              containerRef.current.style.opacity = "1";
            }
          });
        }
      };
      
      // Ejecutar inmediatamente y después de un pequeño retraso para cubrir diferentes escenarios
      forceRerender();
      setTimeout(forceRerender, 50);
      setTimeout(forceRerender, 200);
    }
  }, [areas, imageDimensions.naturalWidth, imageDimensions.naturalHeight]);

  // Agregar la función generateId si no existe
  const generateId = () => {
    return `area_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}
      {error && !src && (
        <div className="flex items-center justify-center h-48 bg-gray-100 rounded-md">
          <p className="text-gray-500">No image selected</p>
        </div>
      )}
      {error && src && (
        <div className="flex items-center justify-center h-48 bg-gray-100 rounded-md">
          <p className="text-gray-500">{errorMessage || "Error loading image"}</p>
        </div>
      )}
      {!error && src && (
        <div 
          ref={containerRef}
          className={cn(
            "relative border border-border rounded-md overflow-hidden image-map-container", 
            getCursorClass(isDrawingMode, isEditMode),
            !isDrawingMode && !isEditMode ? "image-map-test-mode" : ""
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={(e) => {
            if (!isDrawingMode) {
              // Primero intentar manejar el clic en un área específica
              const clickedArea = handleAreaClick(e);
              
              // Si no se hizo clic en un área y hay un manejador onClick personalizado, llamarlo
              if (!clickedArea && onClick) {
                onClick(e);
              }
            }
          }}
          style={{
            // Forzar un tamaño mínimo para el contenedor
            minHeight: "300px",
            // Asegurar contenedor dimensionado
            position: "relative",
            // In test mode, we want a fixed aspect ratio to ensure consistent rendering
            aspectRatio: !isDrawingMode && !isEditMode ? 
              (imageDimensions.naturalWidth && imageDimensions.naturalHeight) ? 
                `${imageDimensions.naturalWidth}/${imageDimensions.naturalHeight}` : 
                "1200/572" : 
              "1200/572", // Use actual image aspect ratio if available in test mode
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            // Add a subtle background in test mode to better see the image boundaries
            backgroundColor: !isDrawingMode && !isEditMode ? "rgba(0,0,0,0.02)" : "transparent"
          }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          
          {/* IMPORTANTE: Siempre usar div con background-image para evitar solicitudes HTTP */}
          <div 
            ref={imageRef as React.RefObject<HTMLDivElement>}
            style={{
              backgroundImage: `url(${formattedSrc})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              width: !isDrawingMode && !isEditMode ? undefined : '100%', // In test mode, width will be set dynamically
              height: !isDrawingMode && !isEditMode ? undefined : '100%', // In test mode, height will be set dynamically
              minHeight: "300px", // Altura mínima
              maxHeight: "none", // No limitar la altura en diferentes tipos - usar contención
              position: "relative" // Ensure position relative for area placement
            }}
            className={cn(
              "transition-opacity duration-200 image-map-image",
              isLoading ? "opacity-0" : "opacity-100",
              className
            )}
            onError={handleError}
          >
            {/* Imagen invisible para detectar eventos de carga/error */}
            <img 
              src={formattedSrc} 
              alt={alt}
              className="opacity-0 absolute w-0 h-0 pointer-events-none"
            onLoad={handleImageLoad}
            onError={handleError}
            />
          </div>
      
          {!isLoading && drawingArea && drawingArea.coords && 
           drawingArea.coords.length === 4 &&
           !drawingArea.coords.some(coord => !Number.isFinite(coord) || Number.isNaN(coord)) && (
            <div
              key={`drawing-area-${Date.now()}`}
              className="absolute border-2 border-blue-500 bg-blue-500/20 z-10"
              style={{
                left: (() => {
                  // Validar coordenadas y referencias
                  if (!drawingArea.coords || !containerRef.current || !imageRef.current) return 0;
                  
                  // Obtener coordenadas ordenadas
                  const x1 = Math.min(drawingArea.coords[0], drawingArea.coords[2]);
                  
                  // Obtener dimensiones naturales del área si existen
                  const naturalWidth = drawingArea.imageDimensions?.naturalWidth || imageDimensions.naturalWidth;
                  const naturalHeight = drawingArea.imageDimensions?.naturalHeight || imageDimensions.naturalHeight;
                  
                  // Obtener dimensiones del contenedor
                  const containerRect = containerRef.current.getBoundingClientRect();
                  const containerWidth = containerRect.width;
                  const containerHeight = containerRect.height;
                  
                  // Calcular relación de aspecto
                  const imageRatio = naturalWidth / naturalHeight;
                  const containerRatio = containerWidth / containerHeight;
                  
                  // Calcular dimensiones renderizadas
                  let renderedWidth, renderedHeight;
                  if (containerRatio > imageRatio) {
                    // Altura limitada
                    renderedHeight = containerHeight;
                    renderedWidth = renderedHeight * imageRatio;
                  } else {
                    // Ancho limitado
                    renderedWidth = containerWidth;
                    renderedHeight = renderedWidth / imageRatio;
                  }
                  
                  // Calcular márgenes para centrado
                  const marginLeft = (containerWidth - renderedWidth) / 2;
                  
                  // Calcular escala
                  const scaleX = renderedWidth / naturalWidth;
                  
                  // Convertir coordenada a píxeles
                  return marginLeft + (x1 * scaleX);
                })(),
                top: (() => {
                  // Validar coordenadas y referencias
                  if (!drawingArea.coords || !containerRef.current || !imageRef.current) return 0;
                  
                  // Obtener coordenadas ordenadas
                  const y1 = Math.min(drawingArea.coords[1], drawingArea.coords[3]);
                  
                  // Obtener dimensiones naturales del área si existen
                  const naturalWidth = drawingArea.imageDimensions?.naturalWidth || imageDimensions.naturalWidth;
                  const naturalHeight = drawingArea.imageDimensions?.naturalHeight || imageDimensions.naturalHeight;
                  
                  // Obtener dimensiones del contenedor
                  const containerRect = containerRef.current.getBoundingClientRect();
                  const containerWidth = containerRect.width;
                  const containerHeight = containerRect.height;
                  
                  // Calcular relación de aspecto
                  const imageRatio = naturalWidth / naturalHeight;
                  const containerRatio = containerWidth / containerHeight;
                  
                  // Calcular dimensiones renderizadas
                  let renderedWidth, renderedHeight;
                  if (containerRatio > imageRatio) {
                    // Altura limitada
                    renderedHeight = containerHeight;
                    renderedWidth = renderedHeight * imageRatio;
                  } else {
                    // Ancho limitado
                    renderedWidth = containerWidth;
                    renderedHeight = renderedWidth / imageRatio;
                  }
                  
                  // Calcular márgenes para centrado
                  const marginTop = (containerHeight - renderedHeight) / 2;
                  
                  // Calcular escala
                  const scaleY = renderedHeight / naturalHeight;
                  
                  // Convertir coordenada a píxeles
                  return marginTop + (y1 * scaleY);
                })(),
                width: (() => {
                  // Validar coordenadas y referencias
                  if (!drawingArea.coords || !containerRef.current || !imageRef.current) return 0;
                  
                  // Calcular el ancho
                  const width = Math.abs(drawingArea.coords[2] - drawingArea.coords[0]);
                  
                  // Obtener dimensiones naturales del área si existen
                  const naturalWidth = drawingArea.imageDimensions?.naturalWidth || imageDimensions.naturalWidth;
                  const naturalHeight = drawingArea.imageDimensions?.naturalHeight || imageDimensions.naturalHeight;
                  
                  // Obtener dimensiones del contenedor
                  const containerRect = containerRef.current.getBoundingClientRect();
                  const containerWidth = containerRect.width;
                  const containerHeight = containerRect.height;
                  
                  // Calcular relación de aspecto
                  const imageRatio = naturalWidth / naturalHeight;
                  const containerRatio = containerWidth / containerHeight;
                  
                  // Calcular dimensiones renderizadas
                  let renderedWidth, renderedHeight;
                  if (containerRatio > imageRatio) {
                    // Altura limitada
                    renderedHeight = containerHeight;
                    renderedWidth = renderedHeight * imageRatio;
                  } else {
                    // Ancho limitado
                    renderedWidth = containerWidth;
                    renderedHeight = renderedWidth / imageRatio;
                  }
                  
                  // Calcular escala
                  const scaleX = renderedWidth / naturalWidth;
                  
                  // Convertir dimensión a píxeles
                  return width * scaleX;
                })(),
                height: (() => {
                  // Validar coordenadas y referencias
                  if (!drawingArea.coords || !containerRef.current || !imageRef.current) return 0;
                  
                  // Calcular la altura
                  const height = Math.abs(drawingArea.coords[3] - drawingArea.coords[1]);
                  
                  // Obtener dimensiones naturales del área si existen
                  const naturalWidth = drawingArea.imageDimensions?.naturalWidth || imageDimensions.naturalWidth;
                  const naturalHeight = drawingArea.imageDimensions?.naturalHeight || imageDimensions.naturalHeight;
                  
                  // Obtener dimensiones del contenedor
                  const containerRect = containerRef.current.getBoundingClientRect();
                  const containerWidth = containerRect.width;
                  const containerHeight = containerRect.height;
                  
                  // Calcular relación de aspecto
                  const imageRatio = naturalWidth / naturalHeight;
                  const containerRatio = containerWidth / containerHeight;
                  
                  // Calcular dimensiones renderizadas
                  let renderedWidth, renderedHeight;
                  if (containerRatio > imageRatio) {
                    // Altura limitada
                    renderedHeight = containerHeight;
                    renderedWidth = renderedHeight * imageRatio;
                  } else {
                    // Ancho limitado
                    renderedWidth = containerWidth;
                    renderedHeight = renderedWidth / imageRatio;
                  }
                  
                  // Calcular escala
                  const scaleY = renderedHeight / naturalHeight;
                  
                  // Convertir dimensión a píxeles
                  return height * scaleY;
                })(),
                pointerEvents: 'none'
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}