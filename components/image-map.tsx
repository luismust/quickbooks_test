"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Area } from "@/lib/test-storage"

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
  onError
}: ImageMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [scale, setScale] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  
  // Placeholder constante para imágenes que fallan
  const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAMAAABHPGVmAAAA21BMVEUAAAD///+/v7+ZmZmqqqqZmZmfn5+dnZ2ampqcnJycnJybm5ubm5uampqampqampqampqbm5uampqampqbm5uampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqamp///+YmJiZmZmampqbm5ucnJydnZ2enp6fnp6fn5+gn5+gn6CgoKChoKChoaGioaGioqKjoqKjo6Ojo6SkpKSlpaWmpqanp6eoqKiqqqpTU1MAAAB8A5ZEAAAARnRSTlMAAQIEBQUGBwcLDBMUFRYaGxwdNjxRVVhdYGRnaWptcXV2eHp7fX5/gISGiImKjI2OkJKTlZebnKCio6Slqq+2uL6/xdDfsgWO3gAAAWhJREFUeNrt1sdSwzAUBVAlkRJaGi33il2CYNvpvZP//6OEBVmWM+PIGlbhncWTcbzwNNb1ZwC8mqDZMaENiXBJVGsCE5KUKbE1GZNURlvLjfUTjC17JNvbgYzUW3qpKxJllJYwKyIw0mSsCRlWBkLhDGTJGE3WEF3KEnGdJYRGlrqKtJEn1A0hWp4w1xBNnlA3kFg5wlzD2o0M4a4j0jJEXEciZQh3A9HkCHMD0fOEuI7IyhGxhojyhLiG6HlCXUdYOcLdRER5Qt1AJDnC3MQ6ZQhxHWvJEu4GIsoR6jrWljKEu4VlP9eMeS5wt5CWpV2WNKqUlPMdKo7oa4jEd2qoqM1DpwVGWp0jmqd+7JQYa/oqsnQ4EfWdSsea8O/yCTgc/3FMSLnUwA8xJhQq44HQB1zySOBCZx8Y3H4mJF8XOJTEBELr8IfzXECYf+fQJ0LO16JvRA5PCK92GMP/FIB3YUC2pHrS/6AAAAAASUVORK5CYII=';
  
  const formattedSrc = useMemo(() => {
    // Si no hay imagen, devolver vacío
    if (!src) {
      return '';
    }
    
    // Si ya es una URL de imagen base64, devolverla directamente
    if (src.startsWith('data:image/')) {
      return src;
    }
    
    // Si es una referencia a imagen (formato especial usado en Airtable)
    if (src.startsWith('image_reference_')) {
      console.log('Found image reference:', src);
      // Usar un placeholder para referencias a imágenes
      return placeholderImage;
    }
    
    // Manejo de URLs blob (que pueden expirar)
    if (src.startsWith('blob:')) {
      console.log('Detected blob URL in ImageMap:', src.substring(0, 40) + '...');
      return src;
    }
    
    // Para URLs de Airtable, asegurarse de que tengan el formato correcto
    if (src.includes('api.airtable.com')) {
      if (!src.startsWith('http')) {
        // Convertir URLs relativas de Airtable a absolutas
        return `https://api.airtable.com/${src.replace(/^\/+/, '')}`;
      }
      return src;
    }
    
    // Para otras URLs HTTP normales
    if (src.startsWith('http')) {
      return src;
    }
    
    // Para otros casos desconocidos, intentar como una referencia o usar placeholder
    console.log('Unknown image source format:', src);
    return placeholderImage;
  }, [src])

  useEffect(() => {
    if (src) {
      setIsLoading(true)
      setError(false)
      setErrorMessage("")
      setRetryCount(0)
    } else {
      setIsLoading(false)
      setError(true)
    }
  }, [src])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isDrawingMode || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    console.log('MouseDown event:', { x, y, scaled: { x: x / scale, y: y / scale } })
    
    setIsDragging(true)
    onDrawStart?.(x / scale, y / scale)
  }, [isDrawingMode, onDrawStart, scale])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawingMode || !containerRef.current || !isDragging) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Solo registramos cada 5 movimientos para no saturar la consola
    if (Math.random() < 0.05) {
      console.log('MouseMove event:', { x, y, scaled: { x: x / scale, y: y / scale }, isDragging })
    }

    onDrawMove?.(x / scale, y / scale)
  }, [isDrawingMode, onDrawMove, scale, isDragging])
  
  const handleMouseUp = useCallback(() => {
    if (!isDrawingMode || !isDragging) return
    
    console.log('MouseUp event, ending drag operation')
    
    setIsDragging(false)
    onDrawEnd?.()
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

  const handleError = () => {
    // Aumentar el máximo de reintentos
    if (retryCount >= 4) {
      console.error('Error loading image after multiple attempts:', formattedSrc)
      setIsLoading(false)
      setError(true)
      setErrorMessage(`Could not load the image after multiple attempts.`)
      
      // Depurar la causa del error
      console.log('Source format analysis:', {
        isBase64: formattedSrc?.startsWith('data:image/'),
        isHttp: formattedSrc?.startsWith('http'),
        isBlob: formattedSrc?.startsWith('blob:'),
        isAirtable: formattedSrc?.includes('api.airtable.com'),
        sourceLength: formattedSrc?.length || 0,
        sourceStart: formattedSrc?.substring(0, 50) || 'empty'
      });
      
      // Intentar corregir URLs de Airtable como último intento
      if (formattedSrc?.includes('api.airtable.com') && !formattedSrc.startsWith('https://')) {
        const correctedUrl = `https://api.airtable.com/${formattedSrc.replace(/^\/+/, '')}`;
        console.log('Attempting with corrected Airtable URL:', correctedUrl);
        
        if (imageRef.current) {
          imageRef.current.src = correctedUrl;
          return;
        }
      }
      
      onError?.()
      return
    }
    
    setRetryCount(prev => prev + 1)
    console.error(`Error loading image (attempt ${retryCount + 1}):`, formattedSrc)
    
    // Si es una URL relativa de Airtable, intentar corregirla
    if (formattedSrc?.includes('api.airtable.com') && !formattedSrc.startsWith('https://')) {
      const correctedUrl = `https://api.airtable.com/${formattedSrc.replace(/^\/+/, '')}`;
      console.log('Attempting with corrected Airtable URL:', correctedUrl);
      
      if (imageRef.current) {
        imageRef.current.src = correctedUrl;
        return;
      }
    }
    
    // Si es una URL blob que falló, reportar el error
    if (formattedSrc?.startsWith('blob:')) {
      console.log('Blob URL failed, likely expired');
      setIsLoading(false)
      setError(true)
      setErrorMessage("Image URL has expired. Please refresh the test.")
      toast.error("Image URL has expired. Please refresh the test.")
      onError?.()
      return;
    }
    
    setIsLoading(false)
    setError(true)
    setErrorMessage("Could not load the image.")
    toast.error("Could not load the image. Check the URL.")
    onError?.()
  }

  const handleImageLoad = () => {
    if (imageRef.current && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth
      const imageScale = containerWidth / imageRef.current.naturalWidth
      
      console.log('Image loaded successfully:', {
        src: formattedSrc,
        naturalWidth: imageRef.current.naturalWidth,
        naturalHeight: imageRef.current.naturalHeight,
        containerWidth,
        scale: imageScale,
        wasLoading: isLoading,
        hadError: error
      })
      
      setScale(imageScale)
    }
    setIsLoading(false)
    setError(false)
  }

  // Determinar el estilo de las áreas basado en el modo
  const getAreaStyle = (area: Area) => {
    // En modo edición, mostrar áreas correctas en verde e incorrectas en rojo
    if (isEditMode) {
      return area.isCorrect ? 'border-green-500' : 'border-red-500';
    }
    // En modo prueba, hacer las áreas completamente invisibles (sin borde, sin fondo, sin hover)
    return 'border-0 bg-transparent';
  }

  // Determinar la clase de cursor basado en el modo
  const getCursorClass = (isDrawingMode: boolean, isEditMode: boolean) => {
    if (isDrawingMode) return "cursor-crosshair";
    if (isEditMode) return ""; // cursor normal
    return ""; // cursor normal en modo test
  }

  // Asegurar que las áreas sean lo suficientemente grandes para que se puedan clickear
  const getAreaDimensions = (area: Area) => {
    const left = area.coords[0] * scale;
    const top = area.coords[1] * scale;
    const width = (area.coords[2] - area.coords[0]) * scale;
    const height = (area.coords[3] - area.coords[1]) * scale;
    
    // Asegurar dimensiones mínimas en píxeles para interacción
    const minDimension = 20;
    const finalWidth = Math.max(width, minDimension);
    const finalHeight = Math.max(height, minDimension);
    
    return {
      left,
      top,
      width: finalWidth,
      height: finalHeight
    };
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
          className={cn("relative border border-border rounded-md overflow-hidden", getCursorClass(isDrawingMode, isEditMode))}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
        <img
          ref={imageRef}
            src={formattedSrc}
          alt={alt}
        className={cn(
          "max-w-full h-auto transition-opacity duration-200",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        draggable={false}
            onLoad={handleImageLoad}
            onError={handleError}
            key={`img-${src.substring(0, 20)}`}
      />
      
      {!isLoading && areas.map((area) => (
        <div
          key={area.id}
              className={`absolute transition-colors ${
                getAreaStyle(area)
              } ${isDrawingMode ? 'pointer-events-none' : ''} ${
                !isEditMode ? 'cursor-default' : 'cursor-pointer'
              }`}
              style={getAreaDimensions(area)}
          onClick={() => onAreaClick(area.id)}
        />
      ))}

      {!isLoading && drawingArea && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/20"
          style={{
            left: drawingArea.coords[0] * scale,
            top: drawingArea.coords[1] * scale,
            width: (drawingArea.coords[2] - drawingArea.coords[0]) * scale,
            height: (drawingArea.coords[3] - drawingArea.coords[1]) * scale
          }}
        />
          )}
        </div>
      )}
    </div>
  )
}