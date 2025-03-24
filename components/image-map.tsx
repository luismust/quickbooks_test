"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { DrawingToolbar } from "./drawing-toolbar"
import { Button } from "./ui/button"
import { OptimizedImage } from "./ui/optimized-image"
import type { Area } from "@/lib/test-storage"
import { processGoogleDriveUrl, downloadAndCacheImage } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface ImageMapProps {
  src: string
  areas: Area[]
  onAreaClick: (areaId: string, x: number, y: number) => void
  alt: string
  className?: string
  style?: React.CSSProperties
  isDrawingMode?: boolean
  isEditMode?: boolean
  hideCorrectAreas?: boolean
  onDrawingComplete?: (area: Area) => void
  onError?: () => void
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void
  onModeChange?: (isDrawingMode: boolean) => void
  OptimizedImage?: React.ComponentType<any>
  onClearAllAreas?: () => void
  hasMarkedAreas?: boolean
}

type DrawingTool = "pencil" | "rectangle" | "circle" | "eraser"

export function ImageMap({ 
  src, 
  areas, 
  onAreaClick, 
  alt, 
  className = "",
  style = {},
  isDrawingMode = false,
  isEditMode = false,
  hideCorrectAreas = false,
  onDrawingComplete,
  onError,
  onLoad,
  onModeChange,
  OptimizedImage: ImageComponent = 'img' as any,
  onClearAllAreas,
  hasMarkedAreas
}: ImageMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [hasDrawing, setHasDrawing] = useState(false)
  const [drawnArea, setDrawnArea] = useState<Area | null>(null)
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [imgError, setImgError] = useState(false)
  const [currentCoords, setCurrentCoords] = useState<number[]>([])
  const [drawnAreas, setDrawnAreas] = useState<Area[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isPendingSave, setIsPendingSave] = useState(false)
  const [scale, setScale] = useState(1)

  const scaleCoords = useCallback((coords: number[]) => {
    if (!containerRef.current) return coords
    
    const clientWidth = containerRef.current.clientWidth || 1
    const clientHeight = containerRef.current.clientHeight || 1

    if (coords.length === 4) {
      // rect: [x1, y1, x2, y2]
      return [
        coords[0] * (dimensions.width / clientWidth),
        coords[1] * (dimensions.height / clientHeight),
        coords[2] * (dimensions.width / clientWidth),
        coords[3] * (dimensions.height / clientHeight)
      ]
    } else if (coords.length === 3) {
      // circle: [x, y, radius]
      return [
        coords[0] * (dimensions.width / clientWidth),
        coords[1] * (dimensions.height / clientHeight),
        coords[2] * (dimensions.width / clientWidth)
      ]
    } else {
      // poly: [x1, y1, x2, y2, ...]
      return coords.map((coord, i) => 
        coord * (dimensions.width / (i % 2 === 0 ? clientWidth : clientHeight))
      )
    }
  }, [dimensions])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawingMode) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convertir coordenadas de pantalla a coordenadas de imagen
    const imageX = x / scale
    const imageY = y / scale

    // Encontrar área clickeada usando coordenadas de imagen
    const clickedArea = areas.find(area => {
      if (!area.x || !area.y || !area.width || !area.height) return false
      return (
        imageX >= area.x &&
        imageX <= area.x + area.width &&
        imageY >= area.y &&
        imageY <= area.y + area.height
      )
    })

    onAreaClick(clickedArea?.id || "none", imageX, imageY)
  }, [areas, isDrawingMode, onAreaClick, scale])

  const initCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = dimensions.width
    canvas.height = dimensions.height
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.strokeStyle = "red"
      ctx.lineWidth = 2
    }
  }

  // Procesar la imagen cuando cambia la URL
  useEffect(() => {
    const img = imageRef.current
    if (!img) return

    const loadImage = async () => {
      try {
        if (src.includes('drive.google.com')) {
          const processedUrl = processGoogleDriveUrl(src)
          const cachedUrl = await downloadAndCacheImage(processedUrl)
          img.src = cachedUrl
        } else {
          img.src = src
        }
      } catch (error) {
        console.error('Error loading image:', error)
        onError?.()
      }
    }

    loadImage()
  }, [src, onError])

  // Manejar la carga de la imagen
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement
    const canvas = canvasRef.current
    const container = containerRef.current

    if (!img || !canvas || !container) return

    try {
      const containerWidth = container.clientWidth
      const imageScale = containerWidth / img.naturalWidth
      setScale(imageScale) // Guardamos el factor de escala

      const scaledHeight = img.naturalHeight * imageScale

      setDimensions({
        width: containerWidth,
        height: scaledHeight
      })

      canvas.width = containerWidth
      canvas.height = scaledHeight
      
      setIsImageLoaded(true)
      setIsLoading(false)
      onLoad?.(e)
    } catch (error) {
      console.error('Error en handleImageLoad:', error)
      setIsLoading(false)
      onError?.()
    }
  }, [onLoad, onError])

  const drawArea = (area: Area, ctx: CanvasRenderingContext2D) => {
    // Convertir coordenadas de imagen original a coordenadas de pantalla
    const screenX = area.x * scale
    const screenY = area.y * scale
    const screenWidth = area.width * scale
    const screenHeight = area.height * scale

    ctx.beginPath()
    ctx.strokeStyle = area.isCorrect ? '#22c55e' : '#ef4444'
    ctx.lineWidth = 2
    ctx.strokeRect(screenX, screenY, screenWidth, screenHeight)
    ctx.fillStyle = 'rgba(37, 99, 235, 0.1)'
    ctx.fillRect(screenX, screenY, screenWidth, screenHeight)
  }

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    setStartPos({ x, y })
    setCurrentPos({ x, y })
  }, [isDrawingMode])

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingMode) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setCurrentPos({ x, y })

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Dibujar áreas existentes primero
    areas.forEach(area => {
      if (!hideCorrectAreas || !area.isCorrect) {
        // Convertir coordenadas de la imagen original a coordenadas de pantalla
        const screenX = (area.x || 0) * scale
        const screenY = (area.y || 0) * scale
        const screenWidth = (area.width || 0) * scale
        const screenHeight = (area.height || 0) * scale

        ctx.beginPath()
        ctx.strokeStyle = area.isCorrect ? '#22c55e' : '#ef4444'
    ctx.lineWidth = 2
        ctx.strokeRect(screenX, screenY, screenWidth, screenHeight)
        ctx.fillStyle = 'rgba(37, 99, 235, 0.1)'
        ctx.fillRect(screenX, screenY, screenWidth, screenHeight)
      }
    })

    // Dibujar el área actual
    const width = x - startPos.x
    const height = y - startPos.y

    const drawX = Math.min(startPos.x, x)
    const drawY = Math.min(startPos.y, y)
    const drawWidth = Math.abs(width)
    const drawHeight = Math.abs(height)
    
    ctx.beginPath()
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 2
    ctx.strokeRect(drawX, drawY, drawWidth, drawHeight)
    ctx.fillStyle = 'rgba(37, 99, 235, 0.3)'
    ctx.fillRect(drawX, drawY, drawWidth, drawHeight)

    setHasDrawing(true)
  }, [isDrawing, isDrawingMode, areas, hideCorrectAreas, startPos, scale])

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return

    setIsDrawing(false)
    
    const width = Math.abs(currentPos.x - startPos.x)
    const height = Math.abs(currentPos.y - startPos.y)
    
    if (width > 10 && height > 10) {
      const x = Math.min(startPos.x, currentPos.x)
      const y = Math.min(startPos.y, currentPos.y)
      
      // Convertir las coordenadas de pantalla a coordenadas de imagen original
      const originalX = Math.round(x / scale)
      const originalY = Math.round(y / scale)
      const originalWidth = Math.round(width / scale)
      const originalHeight = Math.round(height / scale)

      const newArea: Area = {
        id: Date.now().toString(),
        shape: 'rect',
        isCorrect: true,
        x: originalX,
        y: originalY,
        width: originalWidth,
        height: originalHeight,
        coords: [
          originalX,
          originalY,
          originalX + originalWidth,
          originalY + originalHeight
        ]
      }

      setDrawnArea(newArea)
      setDrawnAreas(prev => [...prev, newArea])
      setHasUnsavedChanges(true)
    }
  }, [isDrawing, currentPos, startPos, scale])

  // Función para redibujar todas las áreas
  const redrawAreas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Dibujar todas las áreas existentes
    areas.forEach(area => {
      if (!hideCorrectAreas || !area.isCorrect) {
        const screenX = (area.x || 0) * scale
        const screenY = (area.y || 0) * scale
        const screenWidth = (area.width || 0) * scale
        const screenHeight = (area.height || 0) * scale

        ctx.beginPath()
        ctx.strokeStyle = area.isCorrect ? '#22c55e' : '#ef4444'
        ctx.lineWidth = 2
        ctx.strokeRect(screenX, screenY, screenWidth, screenHeight)
        ctx.fillStyle = 'rgba(37, 99, 235, 0.1)'
        ctx.fillRect(screenX, screenY, screenWidth, screenHeight)
      }
    })
  }, [areas, hideCorrectAreas, scale])

  // Efecto para redibujar áreas cuando cambien
  useEffect(() => {
    if (isImageLoaded) {
      redrawAreas()
    }
  }, [isImageLoaded, areas, redrawAreas])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Resetear estados
    setHasDrawing(false)
    setDrawnArea(null)
    setCurrentCoords([])
    setDrawnAreas([]) // Limpiar todas las áreas dibujadas
    setHasUnsavedChanges(false)

    // Redibujar solo las áreas existentes (no las dibujadas)
    if (!hideCorrectAreas) {
      areas.forEach(area => {
        drawArea(area, ctx)
      })
    }

    toast({
      title: "Áreas limpiadas",
      description: "Se han eliminado todas las áreas dibujadas",
    })
  }, [areas, hideCorrectAreas, drawArea])

  // Conectar el botón de la toolbar con la función de limpieza
  useEffect(() => {
    if (isDrawingMode && isEditMode) {
      const toolbar = document.querySelector('.drawing-toolbar')
      if (toolbar) {
        const clearButton = toolbar.querySelector('[title="Limpiar"]')
        if (clearButton) {
          clearButton.addEventListener('click', clearCanvas)
          return () => clearButton.removeEventListener('click', clearCanvas)
        }
      }
    }
  }, [isDrawingMode, isEditMode, clearCanvas])

  const handleUndo = useCallback(() => {
    if (drawnAreas.length > 0) {
      setDrawnAreas(prev => prev.slice(0, -1))
      setHasUnsavedChanges(true)
    }
  }, [drawnAreas])

  const handleConfirmDrawing = useCallback(() => {
    if (drawnArea) {
      setDrawnAreas(prev => [...prev, drawnArea])
      setHasUnsavedChanges(true)
      clearCanvas()
    }
  }, [drawnArea, clearCanvas])

  const handleSave = useCallback(async () => {
    setIsPendingSave(true)
    try {
      if (onDrawingComplete && drawnAreas.length > 0) {
        // Asegurarnos de que todas las áreas tengan las coordenadas correctas
        const formattedAreas = drawnAreas.map(area => ({
          ...area,
          coords: [
            Math.round(area.x || 0),
            Math.round(area.y || 0),
            Math.round((area.x || 0) + (area.width || 0)),
            Math.round((area.y || 0) + (area.height || 0))
          ]
        }))

        // Guardar cada área
        for (const area of formattedAreas) {
          await onDrawingComplete(area)
        }

        setDrawnAreas([])
        setHasUnsavedChanges(false)
        redrawAreas()

        toast({
          title: "Éxito",
          description: "Áreas guardadas correctamente",
        })
      }
    } catch (error) {
      console.error('Error guardando áreas:', error)
      toast({
        title: "Error",
        description: "No se pudieron guardar las áreas",
        variant: "destructive",
      })
    } finally {
      setIsPendingSave(false)
    }
  }, [drawnAreas, onDrawingComplete, redrawAreas])

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log('Error cargando imagen:', src)
    console.log('Error de carga:', e)
    setImageError(true)
    setIsLoading(false)
  }

  return (
    <div ref={containerRef} className={`relative group ${className}`}>
      <div className="relative">
        <ImageComponent
          ref={imageRef}
          src={src}
          alt={alt}
          className="w-full h-auto"
          onLoad={handleImageLoad}
          onError={onError}
          style={{ visibility: isImageLoaded ? 'visible' : 'hidden' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          style={{
            cursor: isDrawingMode ? 'crosshair' : 'pointer',
            pointerEvents: 'all',
            zIndex: 10
          }}
          onClick={handleClick}
          onMouseDown={isDrawingMode ? startDrawing : undefined}
          onMouseMove={isDrawingMode ? draw : undefined}
          onMouseUp={isDrawingMode ? stopDrawing : undefined}
          onMouseLeave={isDrawingMode ? stopDrawing : undefined}
        />
      </div>

      {/* Overlay de carga */}
      <AnimatePresence>
        {!isImageLoaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-background/80"
          >
            <Loader2 className="h-8 w-8 animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Solo un DrawingToolbar en la parte inferior */}
      {isDrawingMode && isEditMode && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <DrawingToolbar
            onClear={clearCanvas}
            hasDrawing={hasDrawing}
            onConfirm={handleConfirmDrawing}
            onUndo={handleUndo}
            canUndo={drawnAreas.length > 0}
            showSaveButton={true}
            hasUnsavedChanges={hasUnsavedChanges}
            onSave={handleSave}
            isPendingSave={isPendingSave}
            onClearAllAreas={onClearAllAreas}
            hasMarkedAreas={hasMarkedAreas}
          />
        </motion.div>
      )}

      {/* Indicador de cambios sin guardar */}
      <AnimatePresence>
        {hasUnsavedChanges && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-md shadow-lg"
          >
            Cambios sin guardar
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}