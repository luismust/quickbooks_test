"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Area } from "@/lib/test-storage"
import { createProxyImage, getBestImageUrl } from "@/lib/image-utils"

interface ImageMapProps {
  src: string
  areas: Area[]
  drawingArea: Area | null
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
  onClick
}: ImageMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [scale, setScale] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [usedFallback, setUsedFallback] = useState(false)
  
  // Placeholder constante para imágenes que fallan
  const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAMAAABHPGVmAAAA21BMVEUAAAD///+/v7+ZmZmqqqqZmZmfn5+dnZ2ampqcnJycnJybm5ubm5uampqampqampqampqbm5uampqampqbm5uampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqamp///+YmJiZmZmampqbm5ucnJydnZ2enp6fnp6fn5+gn5+gn6CgoKChoKChoaGioaGioqKjoqKjo6Ojo6SkpKSlpaWmpqanp6eoqKiqqqpTU1MAAAB8A5ZEAAAARnRSTlMAAQIEBQUGBwcLDBMUFRYaGxwdNjxRVVhdYGRnaWptcXV2eHp7fX5/gISGiImKjI2OkJKTlZebnKCio6Slqq+2uL6/xdDfsgWO3gAAAWhJREFUeNrt1sdSwzAUBVAlkRJaGi33il2CYNvpvZP//6OEBVmWM+PIGlbhncWTcbzwNNb1ZwC8mqDZMaENiXBJVGsCE5KUKbE1GZNURlvLjfUTjC17JNvbgYzUW3qpKxJllJYwKyIw0mSsCRlWBkLhDGTJGE3WEF3KEnGdJYRGlrqKtJEn1A0hWp4w1xBNnlA3kFg5wlzD2o0M4a4j0jJEXEciZQh3A9HkCHMD0fOEuI7IyhGxhojyhLiG6HlCXUdYOcLdRER5Qt1AJDnC3MQ6ZQhxHWvJEu4GIsoR6jrWljKEu4VlP9eMeS5wt5CWpV2WNKqUlPMdKo7oa4jEd2qoqM1DpwVGWp0jmqd+7JQYa/oqsnQ4EfWdSsea8O/yCTgc/3FMSLnUwA8xJhQq44HQB1zySOBCZx8Y3H4mJF8XOJTEBELr8IfzXECYf+fQJ0LO16JvRA5PCK92GMP/FIB3YUC2pHrS/6AAAAAASUVORK5CYII=';
  
  // Función para verificar si una blob URL sigue siendo válida
  const checkBlobValidity = useCallback(async (blobUrl: string): Promise<boolean> => {
    if (!blobUrl || !blobUrl.startsWith('blob:')) return false;
    
    try {
      // En lugar de usar fetch HEAD (que está fallando con ERR_METHOD_NOT_SUPPORTED),
      // probamos a crear una imagen y cargar la URL directamente
      return new Promise((resolve) => {
        const testImg = new Image();
        testImg.onload = () => {
          console.log('Blob URL is valid (loaded successfully):', blobUrl.substring(0, 40) + '...');
          resolve(true);
        };
        testImg.onerror = () => {
          console.error('Blob URL is invalid (failed to load)');
          resolve(false);
        };
        testImg.src = blobUrl;
        
        // Añadir un timeout para evitar esperas indefinidas
        setTimeout(() => {
          if (!testImg.complete) {
            console.log('Blob URL validation timed out');
            resolve(false);
          }
        }, 3000);
      });
    } catch (error) {
      console.error('Error checking blob URL:', error);
      return false;
    }
  }, []);
  
  const formattedSrc = useMemo(() => {
    // Si no hay imagen, devolver vacío
    if (!src) {
      console.log('ImageMap: No source provided');
      return '';
    }
    
    // Si ya es una URL de imagen base64, devolverla directamente
    if (src.startsWith('data:image/')) {
      console.log('ImageMap: Using base64 image directly');
      return src;
    }
    
    // Si es una referencia a imagen (formato especial usado en Airtable)
    if (src.startsWith('image_reference_')) {
      console.log('ImageMap: Found image reference:', src);
      // NO intentar cargar la referencia, usar un placeholder
      return placeholderImage;
    }
    
    // Manejar strings vacíos explícitamente (que podrían no ser capturados por !src)
    if (src.trim() === '') {
      console.log('ImageMap: Empty string source');
      return '';
    }
    
    // Manejo de URLs blob (que pueden expirar)
    if (src.startsWith('blob:')) {
      console.log('ImageMap: Detected blob URL:', src.substring(0, 40) + '...');
      return src;
    }
    
    // Para URLs de Airtable, asegurarse de que tengan el formato correcto
    if (src.includes('api.airtable.com')) {
      if (!src.startsWith('http')) {
        // Convertir URLs relativas de Airtable a absolutas
        const correctedUrl = `https://api.airtable.com/${src.replace(/^\/+/, '')}`;
        console.log('ImageMap: Converting Airtable URL:', correctedUrl);
        return correctedUrl;
      }
      return src;
    }
    
    // Para otras URLs HTTP normales
    if (src.startsWith('http')) {
      return src;
    }
    
    // Para otros casos desconocidos, loguear y usar placeholder
    console.log('ImageMap: Unknown image source format:', src);
    return placeholderImage;
  }, [src])

  // Definir handleImageLoad y handleError antes de usarlos en useEffect
  const handleImageLoad = () => {
    if (imageRef.current && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth
      
      // Para imágenes cargadas a través de un div con background-image, 
      // obtenemos el ancho desde la imagen oculta que se usa para los eventos
      const hiddenImg = document.querySelector(`img[src="${formattedSrc}"]`) as HTMLImageElement
      
      // Si tenemos la imagen oculta, usar su tamaño natural
      let imageNaturalWidth = 300; // valor por defecto
      
      if (hiddenImg && hiddenImg.naturalWidth) {
        imageNaturalWidth = hiddenImg.naturalWidth;
        console.log('Using naturalWidth from hidden image:', imageNaturalWidth);
      } else {
        // Si no tenemos la imagen oculta, intentar con el backgroundImage
        const backgroundDiv = imageRef.current as HTMLDivElement;
        const computedStyle = window.getComputedStyle(backgroundDiv);
        const bgWidth = parseInt(computedStyle.width);
        
        if (!isNaN(bgWidth) && bgWidth > 0) {
          console.log('Using computed backgroundImage width:', bgWidth);
          imageNaturalWidth = bgWidth;
        } else {
          console.log('Using default width:', imageNaturalWidth);
        }
      }
      
      // Calcular la escala basada en el ancho del contenedor y el ancho natural de la imagen
      const imageScale = containerWidth / imageNaturalWidth || 1;
      
      console.log('Image loaded successfully:', {
        src: formattedSrc.substring(0, 50) + '...',
        naturalWidth: imageNaturalWidth,
        containerWidth,
        scale: imageScale,
        wasLoading: isLoading
      });
      
      setScale(imageScale);
    }
    setIsLoading(false);
    setError(false);
  }

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
          imageRef.current.src = proxyImg.src;
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
            imageRef.current.src = proxyImg.src;
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
            imageRef.current.src = proxyImg.src;
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
      imageRef.current.src = placeholderImage;
      handleImageLoad();
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
            (imageRef.current as HTMLDivElement).style.backgroundImage = `url(${newUrl})`;
            handleImageLoad();
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
              (imageRef.current as HTMLDivElement).style.backgroundImage = `url(${proxyUrl})`;
              handleImageLoad();
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
          (imageRef.current as HTMLDivElement).style.backgroundImage = `url(${correctedUrl})`;
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
  
  // Ahora definimos el useEffect después de las funciones que usa
  useEffect(() => {
    if (formattedSrc) {
      setIsLoading(true);
      setError(false);
      setErrorMessage("");
      setUsedFallback(false);
      setRetryCount(0);
      
      // Para URLs blob, verificar validez primero
      if (formattedSrc.startsWith('blob:')) {
        checkBlobValidity(formattedSrc).then(isValid => {
          if (!isValid) {
            console.log('Blob URL is invalid, trying alternatives');
        handleError();
            return;
          }
          
          // Si el blob es válido, continuar normalmente
          loadImage();
        });
      } else {
        // Para otras URLs, cargar normalmente
        loadImage();
      }
      
      function loadImage() {
        // Utilizar createProxyImage para cargar la imagen con manejo de CORS
        try {
          // Si ya estamos usando una imagen base64, cargarla directamente
      if (formattedSrc.startsWith('data:')) {
        // Para imágenes data:, confiar en que son correctas
            if (imageRef.current) {
              imageRef.current.src = formattedSrc;
            }
            
        setTimeout(() => {
          handleImageLoad();
          setIsLoading(false);
          setError(false);
        }, 100);
            return;
          }
          
          // Para URLs normales, usar createProxyImage
          const proxyImg = createProxyImage(formattedSrc);
          
          proxyImg.onload = () => {
            // Cuando la imagen carga con éxito, asignarla al elemento de referencia
            if (imageRef.current) {
              imageRef.current.src = proxyImg.src;
            }
            
            handleImageLoad();
            setIsLoading(false);
            setError(false);
          };
          
          proxyImg.onerror = () => {
            console.error('Error loading image with createProxyImage:', formattedSrc);
            handleError();
          };
        } catch (e) {
          console.error('Exception in image loading:', e);
          handleError();
        }
      }
    } else {
      setIsLoading(false);
      setError(true);
    }
  }, [formattedSrc, checkBlobValidity]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isDrawingMode || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Importante: normalizar las coordenadas inmediatamente al comenzar a dibujar
    const normalizedX = x / scale
    const normalizedY = y / scale

    console.log('MouseDown event:', { 
      raw: { x, y }, 
      normalized: { x: normalizedX, y: normalizedY },
      scale,
      containerRect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      }
    })
    
    setIsDragging(true)
    onDrawStart?.(normalizedX, normalizedY)
    
    // Evitar comportamientos del navegador como arrastrar la imagen
    e.preventDefault()
  }, [isDrawingMode, onDrawStart, scale])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawingMode || !containerRef.current || !isDragging) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Normalizar las coordenadas según la escala para mantener consistencia
    const normalizedX = x / scale
    const normalizedY = y / scale
    
    // Solo registramos cada 5 movimientos para no saturar la consola
    if (Math.random() < 0.05) {
      console.log('MouseMove event:', { 
        raw: { x, y }, 
        normalized: { x: normalizedX, y: normalizedY },
        scale, 
        isDragging,
        containerRect: {
          top: rect.top,
          left: rect.left
        }
      })
    }

    onDrawMove?.(normalizedX, normalizedY)
    
    // Evitar comportamientos del navegador
    e.preventDefault()
  }, [isDrawingMode, onDrawMove, scale, isDragging])
  
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDrawingMode || !isDragging) return
    
    console.log('MouseUp event, ending drag operation')
    
    setIsDragging(false)
    onDrawEnd?.()
    
    // Evitar comportamientos del navegador
    e.preventDefault()
  }, [isDrawingMode, onDrawEnd, isDragging])
  
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
  const getAreaStyle = (area: Area) => {
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

  // Asegurar que las áreas sean lo suficientemente grandes para que se puedan clickear
  const getAreaDimensions = (area: Area) => {
    if (!area.coords || area.coords.length < 4) {
      console.error('Invalid area coordinates:', area);
      return { left: 0, top: 0, width: 20, height: 20 };
    }
    
    // Primero normalizar las coordenadas para asegurar que x1,y1 sea la esquina superior izquierda
    // y x2,y2 sea la esquina inferior derecha
    const x1 = Math.min(area.coords[0], area.coords[2]);
    const y1 = Math.min(area.coords[1], area.coords[3]);
    const x2 = Math.max(area.coords[0], area.coords[2]);
    const y2 = Math.max(area.coords[1], area.coords[3]);
    
    // Aplicar escala a las coordenadas normalizadas
    const left = x1 * scale;
    const top = y1 * scale;
    const width = (x2 - x1) * scale;
    const height = (y2 - y1) * scale;
    
    // Asegurar dimensiones mínimas en píxeles para interacción
    const minDimension = 15; // Reducido de 20 a 15 para permitir áreas un poco más pequeñas
    
    // Si el área es muy pequeña en ambas dimensiones, aumentarla para facilitar el clic
    let finalWidth = Math.max(width, minDimension);
    let finalHeight = Math.max(height, minDimension);
    
    // Registro para debug (aumentamos probabilidad a 20% para más información)
    if (Math.random() < 0.2) {
      console.log('Area dimensions calculated:', { 
        id: area.id,
        isCorrect: area.isCorrect,
        original: { x1, y1, x2, y2 },
        scaled: { left, top, width, height },
        final: { 
          left, 
          top, 
          width: finalWidth, 
          height: finalHeight 
        },
        scale
      });
    }
    
    return {
      left,
      top,
      width: finalWidth,
      height: finalHeight
    };
  };
  
  // Función para verificar si un punto está dentro de un área
  const isPointInArea = (x: number, y: number, area: Area): boolean => {
    if (!area.coords || area.coords.length < 4) return false;
    
    // Coordenadas originales sin escalar
    const left = Math.min(area.coords[0], area.coords[2]);
    const right = Math.max(area.coords[0], area.coords[2]);
    const top = Math.min(area.coords[1], area.coords[3]);
    const bottom = Math.max(area.coords[1], area.coords[3]);
    
    // Coordenadas del clic sin escalar (dividimos por escala para normalizarlas)
    const clickX = x / scale;
    const clickY = y / scale;
    
    const isInside = clickX >= left && clickX <= right && clickY >= top && clickY <= bottom;
    
    console.log('Click check:', { 
      clickX, 
      clickY, 
      area: {
        id: area.id,
        isCorrect: area.isCorrect,
        coords: `(${left},${top}) to (${right},${bottom})`
      },
      scale,
      result: isInside
    });
    
    return isInside;
  };
  
  // Función para manejar el clic en un área específica
  const handleAreaClick = useCallback((e: React.MouseEvent) => {
    if (isDrawingMode || !containerRef.current) return false;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    console.log('Image clicked at:', { clickX, clickY, scale, areasCount: areas.length });
    
    // Debug: imprimir todas las áreas disponibles
    if (areas.length > 0) {
      console.log('Available areas:', areas.map(a => ({
        id: a.id,
        isCorrect: a.isCorrect,
        coords: a.coords && a.coords.length >= 4 ? 
          `(${a.coords[0]},${a.coords[1]}) to (${a.coords[2]},${a.coords[3]})` : 'invalid coords'
      })));
    }
    
    // Verificar qué área fue clickeada
    let clickedAreaId: string | null = null;
    let clickedArea: Area | null = null;
    
    // Revisar áreas en orden inverso (las últimas dibujadas están encima)
    for (let i = areas.length - 1; i >= 0; i--) {
      const area = areas[i];
      if (isPointInArea(clickX, clickY, area)) {
        console.log(`Area ${area.id} was clicked - isCorrect: ${area.isCorrect}`);
        clickedAreaId = area.id;
        clickedArea = area;
        break;
      }
    }
    
    if (clickedAreaId && clickedArea) {
      console.log('Area clicked:', clickedAreaId, 'isCorrect:', clickedArea.isCorrect);
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
      console.log('No area clicked, calling general onClick handler');
      onClick(e);
      return true;
    }
    
    return false;
  }, [isDrawingMode, areas, isEditMode, onAreaClick, onClick, isPointInArea]);

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
          className={cn("relative border border-border rounded-md overflow-hidden image-map-container", getCursorClass(isDrawingMode, isEditMode))}
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
              width: '100%',
              height: formattedSrc.startsWith('data:') ? '300px' : '400px'
            }}
            className={cn(
              "transition-opacity duration-200 image-map-image",
              isLoading ? "opacity-0" : "opacity-100",
              className
            )}
            onLoad={handleImageLoad}
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
      
          {!isLoading && areas.map((area) => {
            const dimensions = getAreaDimensions(area);
            return (
            <div
              key={area.id}
              data-area-id={area.id}
              className={`absolute transition-colors ${
                getAreaStyle(area)
              } ${isDrawingMode ? 'pointer-events-none' : ''} ${
                  !isEditMode ? 'cursor-pointer' : 'cursor-pointer hover:bg-primary/10'
                }`}
              style={{
                left: dimensions.left,
                top: dimensions.top,
                width: dimensions.width,
                height: dimensions.height,
                // En modo test las áreas deben ser casi invisibles pero receptivas a clics
                background: isEditMode ? 'rgba(0,0,0,0.03)' : 'transparent',
                border: isEditMode ? '1px solid' : 'none',
                // Solo en desarrollo, añadir un sutil borde en hover para testing
                // Puedes quitar esto en producción
                ...(process.env.NODE_ENV === 'development' && !isEditMode ? {
                  transition: 'all 0.2s',
                  ':hover': {
                    outline: '1px solid rgba(255,255,255,0.5)'
                  }
                } : {})
              }}
            />
            );
          })}

          {!isLoading && drawingArea && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-500/20"
              style={{
                left: Math.min(drawingArea.coords[0], drawingArea.coords[2]) * scale,
                top: Math.min(drawingArea.coords[1], drawingArea.coords[3]) * scale,
                width: Math.abs(drawingArea.coords[2] - drawingArea.coords[0]) * scale,
                height: Math.abs(drawingArea.coords[3] - drawingArea.coords[1]) * scale
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}