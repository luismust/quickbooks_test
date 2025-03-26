"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { processGoogleDriveUrl } from "@/lib/utils"

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  onLoad?: () => void
  onError?: () => void
}


export function OptimizedImage({ src, alt, className = "", onLoad, onError }: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true)
        setError(false)


        if (src.includes('drive.google.com')) {
          const processedUrl = processGoogleDriveUrl(src)
          setImageSrc(processedUrl)
        } else {
          setImageSrc(src)
        }
      } catch (err) {
        console.error('Error loading image:', err)
        setError(true)
        onError?.()
      }
    }

    loadImage()
  }, [src, onError])

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
      
      <img
        src={imageSrc}
        alt={alt}
        className={className}
        onLoad={() => {
          setIsLoading(false)
          onLoad?.()
        }}
        onError={() => {
          setIsLoading(false)
          setError(true)
          onError?.()
        }}
        style={{ 
          display: isLoading ? 'none' : 'block',
          objectFit: 'contain'
        }}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 text-destructive">
          Error al cargar la imagen
        </div>
      )}
    </div>
  )
} 