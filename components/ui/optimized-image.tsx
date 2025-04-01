"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  onClick?: () => void
}

export function OptimizedImage({ src, alt, width = 800, height = 600, className, onClick }: OptimizedImageProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [imageSrc, setImageSrc] = useState<string>(src)

  useEffect(() => {
    setImageSrc(src)
    setLoading(true)
    setError(false)
  }, [src])

  const handleError = () => {
    setError(true)
    setLoading(false)
  }

  const handleLoad = () => {
    setLoading(false)
  }

  return (
    <div className={cn("relative", className)} onClick={onClick}>
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse z-10">
          <span className="sr-only">Loading...</span>
        </div>
      )}
      {error ? (
        <div className="flex items-center justify-center h-full border border-dashed border-gray-300 rounded-md">
          <span className="text-gray-500">Failed to load image</span>
        </div>
      ) : (
        <img
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          onError={handleError}
          onLoad={handleLoad}
          className={cn(
            "object-contain max-w-full transition-opacity duration-300",
            loading ? "opacity-0" : "opacity-100"
          )}
        />
      )}
    </div>
  )
} 