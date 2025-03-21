"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void
  style?: React.CSSProperties
}

export function OptimizedImage({ 
  src, 
  alt, 
  className,
  onError,
  onLoad,
  style,
  ...props 
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false)
    if (onLoad) onLoad(e)
  }

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false)
    if (onError) onError(e)
  }

  return (
    <div className={cn(
      "relative w-full h-full",
      className
    )}>
      <img
        src={src}
        alt={alt}
        className={cn(
          "w-full h-full object-contain",
          isLoading && "animate-pulse bg-muted"
        )}
        onLoad={handleLoad}
        onError={handleError}
        style={style}
        {...props}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
    </div>
  )
} 