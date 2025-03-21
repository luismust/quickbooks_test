"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { DrawingToolbar } from "./drawing-toolbar"
import { Button } from "./ui/button"
import { OptimizedImage } from "./ui/optimized-image"

type Area = {
  id: string
  shape: "rect" | "circle" | "poly"
  coords: number[]
  isCorrect: boolean
}

type ImageMapProps = {
  src: string
  areas: Area[]
  onAreaClick: (areaId: string) => void
  alt: string
  className?: string
  isDrawingMode?: boolean
  onDrawingComplete?: (coords: number[]) => void
  isEditMode?: boolean
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void
}

type DrawingTool = "pencil" | "rectangle" | "circle" | "eraser"

export function ImageMap({ 
  src, 
  areas, 
  onAreaClick, 
  alt, 
  className,
  isDrawingMode = false,
  onDrawingComplete,
  isEditMode = false,
  onError,
  onLoad,
}: ImageMapProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentTool, setCurrentTool] = useState<DrawingTool>("pencil")
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [hasDrawing, setHasDrawing] = useState(false)
  const [drawnArea, setDrawnArea] = useState<{x1: number, y1: number, x2: number, y2: number} | null>(null)
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [imgError, setImgError] = useState(false)
  const [currentCoords, setCurrentCoords] = useState<number[]>([])

  const scaleCoords = (coords: number[]): number[] => {
    if (coords.length === 4) {
      // rect: [x1, y1, x2, y2]
      return [coords[0] * scale, coords[1] * scale, coords[2] * scale, coords[3] * scale]
    } else if (coords.length === 3) {
      // circle: [x, y, radius]
      return [coords[0] * scale, coords[1] * scale, coords[2] * scale]
    } else {
      // poly: [x1, y1, x2, y2, ...]
      return coords.map((coord) => coord * scale)
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
  }

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

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, dimensions.width, dimensions.height)
      }
    }
    setHasDrawing(false)
    initCanvas()
  }, [src, dimensions.width, dimensions.height])

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

  const draw = useCallback((e: MouseEvent) => {
    if (!isDrawingMode || !isEditMode) return // No permitir dibujo si no está en modo edición
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

    // Mostrar dimensiones
    ctx.fillStyle = '#000'
    ctx.font = '12px sans-serif'
    ctx.fillText(`${Math.abs(width)}x${Math.abs(height)}`, x + 5, y + 5)

    setCurrentCoords([startPos.x, startPos.y, x, y])
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
    if (drawnArea && onDrawingComplete) {
      // Convertir coordenadas del canvas a coordenadas relativas a la imagen
      const coords = [
        Math.min(drawnArea.x1, drawnArea.x2) / scale,
        Math.min(drawnArea.y1, drawnArea.y2) / scale,
        Math.max(drawnArea.x1, drawnArea.x2) / scale,
        Math.max(drawnArea.y1, drawnArea.y2) / scale
      ]
      onDrawingComplete(coords)
      clearCanvas()
      setHasDrawing(false)
      setDrawnArea(null)
    }
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log('Error cargando imagen:', src)
    console.log('Error de carga:', e)
    setImageError(true)
    setIsLoading(false)
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth
      const { naturalWidth, naturalHeight } = img
      const newScale = containerWidth / naturalWidth
      setDimensions({
        width: containerWidth,
        height: naturalHeight * newScale,
      })
      setScale(newScale)
    }
    
    if (onLoad) {
      onLoad(e)
    }
  }

  const handleToolChange = (tool: DrawingTool) => {
    setCurrentTool(tool)
    clearCanvas()
    setDrawnArea(null)
    setHasDrawing(false)
  }

  return (
    <div className="relative">
      <div ref={containerRef} className="relative" style={{ height: dimensions.height }}>
        <OptimizedImage
          src={src}
          alt={alt}
          className={className}
          onError={onError}
          onLoad={handleImageLoad}
        />
        
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full z-10"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{ cursor: isDrawingMode && isEditMode ? 'crosshair' : 'pointer' }}
          onClick={handleClick}
        />

        {(isDrawingMode && isEditMode) && (
          <div className="absolute top-2 left-2 z-20">
            <DrawingToolbar
              currentTool={currentTool}
              onToolChange={handleToolChange}
              onClear={clearCanvas}
            />
            {hasDrawing && (
              <Button onClick={handleConfirmDrawing}>
                {isEditMode ? "Guardar área correcta" : "Confirmar área"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

