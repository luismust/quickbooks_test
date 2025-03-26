"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Area {
  id: string
  shape: "rect"
  coords: number[]
  isCorrect: boolean
  x?: number
  y?: number
  width?: number
  height?: number
}

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
  alt = "",
  className = "",
  isDrawingMode = false,
  isEditMode = true,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
  onError
}: ImageMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [scale, setScale] = useState(1)

  // Manejar la carga inicial de la imagen
  useEffect(() => {
    if (!src) {
      setIsLoading(false)
      setImageError(true)
      return
    }

    const img = new Image()
    img.src = src

    const handleLoad = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth
      const imageScale = containerWidth / img.naturalWidth
        setScale(imageScale)
      }
      setIsLoading(false)
    }

    const handleError = () => {
      console.error('Error loading image:', src)
      setIsLoading(false)
      setImageError(true)
      onError?.()
    }

    img.addEventListener('load', handleLoad)
    img.addEventListener('error', handleError)

    return () => {
      img.removeEventListener('load', handleLoad)
      img.removeEventListener('error', handleError)
    }
  }, [src, onError])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isDrawingMode || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    onDrawStart?.(x / scale, y / scale)
  }, [isDrawingMode, onDrawStart, scale])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawingMode || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    onDrawMove?.(x / scale, y / scale)
  }, [isDrawingMode, onDrawMove, scale])

  if (imageError) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-lg bg-muted">
        <p className="text-sm text-muted-foreground">Error loading image</p>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={onDrawEnd}
      onMouseLeave={onDrawEnd}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      
        <img
          ref={imageRef}
          src={src}
          alt={alt}
        className={cn(
          "max-w-full h-auto transition-opacity duration-200",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        draggable={false}
      />
      
      {!isLoading && areas.map((area) => (
        <div
          key={area.id}
          className={cn(
            "absolute border-2 cursor-pointer transition-colors",
            isEditMode ? "border-blue-500 hover:border-blue-600" : "border-transparent",
            !isEditMode && "hover:bg-blue-500/20"
          )}
          style={{
            left: area.coords[0] * scale,
            top: area.coords[1] * scale,
            width: (area.coords[2] - area.coords[0]) * scale,
            height: (area.coords[3] - area.coords[1]) * scale
          }}
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
  )
}