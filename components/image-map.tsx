"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"

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
}

export function ImageMap({ src, areas, onAreaClick, alt, className }: ImageMapProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(1)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateDimensions = () => {
      if (imgRef.current && containerRef.current) {
        const { naturalWidth, naturalHeight } = imgRef.current
        const containerWidth = containerRef.current.clientWidth

        // Calculate scale factor
        const newScale = containerWidth / naturalWidth

        setDimensions({
          width: containerWidth,
          height: naturalHeight * newScale,
        })
        setScale(newScale)
      }
    }

    // Update dimensions when image loads
    if (imgRef.current?.complete) {
      updateDimensions()
    } else {
      imgRef.current?.addEventListener("load", updateDimensions)
    }

    // Update dimensions on window resize
    window.addEventListener("resize", updateDimensions)

    return () => {
      imgRef.current?.removeEventListener("load", updateDimensions)
      window.removeEventListener("resize", updateDimensions)
    }
  }, [src])

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
    if (!imgRef.current) return

    const rect = imgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    for (const area of areas) {
      const scaledCoords = scaleCoords(area.coords)

      if (area.shape === "rect") {
        const [x1, y1, x2, y2] = scaledCoords
        if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
          onAreaClick(area.id)
          return
        }
      } else if (area.shape === "circle") {
        const [centerX, centerY, radius] = scaledCoords
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
        if (distance <= radius) {
          onAreaClick(area.id)
          return
        }
      } else if (area.shape === "poly") {
        if (isPointInPolygon(x, y, scaledCoords)) {
          onAreaClick(area.id)
          return
        }
      }
    }

    // If click is not on any area, consider it incorrect
    onAreaClick("none")
  }

  // Check if point is inside polygon using ray casting algorithm
  const isPointInPolygon = (x: number, y: number, polyCoords: number[]): boolean => {
    let inside = false
    for (let i = 0, j = polyCoords.length - 2; i < polyCoords.length; j = i, i += 2) {
      const xi = polyCoords[i]
      const yi = polyCoords[i + 1]
      const xj = polyCoords[j]
      const yj = polyCoords[j + 1]

      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

      if (intersect) inside = !inside
    }
    return inside
  }

  return (
    <div
      ref={containerRef}
      className={`relative cursor-pointer ${className || ""}`}
      style={{ height: dimensions.height }}
      onClick={handleClick}
    >
      <img ref={imgRef} src={src || "/placeholder.svg"} alt={alt} className="w-full h-auto" />

      {/* Debug visualization of clickable areas - remove in production */}
      {/* {areas.map(area => {
        const scaledCoords = scaleCoords(area.coords)
        
        if (area.shape === 'rect') {
          const [x1, y1, x2, y2] = scaledCoords
          return (
            <div
              key={area.id}
              className={`absolute border-2 ${area.isCorrect ? 'border-green-500' : 'border-red-500'}`}
              style={{
                left: `${x1}px`,
                top: `${y1}px`,
                width: `${x2 - x1}px`,
                height: `${y2 - y1}px`,
                opacity: 0.3
              }}
            />
          )
        }
        return null
      })} */}
    </div>
  )
}

