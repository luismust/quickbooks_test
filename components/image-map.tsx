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

interface ImageMapProps {
  src: string
  areas: Area[]
  onAreaClick: (areaId: string) => void
  alt: string
  className?: string
  style?: React.CSSProperties
  isDrawingMode?: boolean
  isEditMode?: boolean
  onDrawingComplete?: (area: Area) => void
  onError?: () => void
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void
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
  onDrawingComplete,
  onError,
  onLoad,
}: ImageMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [hasDrawing, setHasDrawing] = useState(false)
  const [drawnArea, setDrawnArea] = useState<{x1: number, y1: number, x2: number, y2: number} | null>(null)
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [imgError, setImgError] = useState(false)
  const [currentCoords, setCurrentCoords] = useState<number[]>([])

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
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Verificar si el click está dentro de algún área
    for (const area of areas) {
      const scaledCoords = scaleCoords(area.coords)
      if (area.shape === "rect") {
        const [x1, y1, x2, y2] = scaledCoords
        if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
          onAreaClick(area.id)
          return
        }
      }
    }

    onAreaClick("none")
  }, [isDrawingMode, areas, scaleCoords, onAreaClick])

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
    const img = imageRef.current
    const canvas = canvasRef.current
    const container = containerRef.current
    
    if (!img || !canvas || !container) return

    // Establecer dimensiones
    const containerWidth = container.clientWidth
    const scale = containerWidth / img.naturalWidth
    const scaledHeight = img.naturalHeight * scale

    setDimensions({
      width: containerWidth,
      height: scaledHeight
    })

    // Inicializar canvas
    canvas.width = containerWidth
    canvas.height = scaledHeight
    
    setIsImageLoaded(true)
    onLoad?.(e)

    // Dibujar áreas existentes
    const ctx = canvas.getContext('2d')
    if (ctx) {
      areas.forEach(area => {
        drawArea(area, ctx, scale)
      })
    }
  }, [areas, onLoad])

  const drawArea = (area: Area, ctx: CanvasRenderingContext2D, scale: number) => {
    if (typeof area.x === 'number' && typeof area.y === 'number' && 
        typeof area.width === 'number' && typeof area.height === 'number') {
      ctx.beginPath()
      ctx.rect(
        area.x * scale,
        area.y * scale,
        area.width * scale,
        area.height * scale
      )
      ctx.strokeStyle = area.isCorrect ? '#22c55e' : '#ef4444'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !isEditMode) return // No permitir dibujo si no está en modo edición
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    setStartPos({ x, y })
    setDrawnArea(null) // Limpiar área anterior
  }

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !isEditMode) return
    if (!isDrawing || !canvasRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Dibujar área con efecto de resaltado
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)' // Azul semi-transparente
    ctx.strokeStyle = '#3b82f6' // Azul sólido
    ctx.lineWidth = 2

    const width = x - startPos.x
    const height = y - startPos.y

    ctx.fillRect(startPos.x, startPos.y, width, height)
    ctx.strokeRect(startPos.x, startPos.y, width, height)

    setDrawnArea({ x1: startPos.x, y1: startPos.y, x2: x, y2: y })
    setHasDrawing(true)
  }, [isDrawing, startPos, isDrawingMode, isEditMode])

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  const handleConfirmDrawing = () => {
    if (!drawnArea) return
    
    const coords = [
      Math.round(Math.min(drawnArea.x1, drawnArea.x2)),
      Math.round(Math.min(drawnArea.y1, drawnArea.y2)),
      Math.round(Math.max(drawnArea.x1, drawnArea.x2)),
      Math.round(Math.max(drawnArea.y1, drawnArea.y2))
    ];

    const newArea: Area = {
      id: "new_area",
      shape: "rect",
      coords,
      isCorrect: true,
      x: coords[0],
      y: coords[1],
      width: coords[2] - coords[0],
      height: coords[3] - coords[1]
    };

    onDrawingComplete?.(newArea);
    clearCanvas();
    setHasDrawing(false);
    setDrawnArea(null);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log('Error cargando imagen:', src)
    console.log('Error de carga:', e)
    setImageError(true)
    setIsLoading(false)
  }

  return (
    <div 
      ref={containerRef}
      className={`relative group ${className}`} 
      style={style}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <img
          ref={imageRef}
          alt={alt}
          className="w-full h-auto transition-transform duration-200 group-hover:scale-[1.01]"
          onLoad={handleImageLoad}
          onError={onError}
          style={{ visibility: isImageLoaded ? 'visible' : 'hidden' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full transition-all duration-200"
          style={{
            cursor: isDrawingMode && isEditMode ? 'crosshair' : 'pointer',
            pointerEvents: isDrawingMode ? 'auto' : 'none'
          }}
          onClick={isDrawingMode ? undefined : handleClick}
          onMouseDown={isDrawingMode ? startDrawing : undefined}
          onMouseMove={isDrawingMode ? draw : undefined}
          onMouseUp={isDrawingMode ? stopDrawing : undefined}
          onMouseLeave={isDrawingMode ? stopDrawing : undefined}
        />
      </motion.div>

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

      {/* Toolbar de dibujo con animaciones */}
      <AnimatePresence>
        {(isDrawingMode && isEditMode && hasDrawing) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-2 left-2 z-20"
          >
            <DrawingToolbar
              currentTool="rectangle"
              onToolChange={() => {}}
              onClear={clearCanvas}
              hasDrawing={hasDrawing}
              onConfirm={handleConfirmDrawing}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

