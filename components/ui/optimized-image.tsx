"use client"

import { useState, useEffect } from "react"
import { Button } from "./button"
import { Loader2 } from "lucide-react"

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void
}

const processGoogleDriveUrl = (url: string): string => {
  if (!url) return url
  
  if (!url.includes('drive.google.com')) {
    return url
  }

  try {
    let fileId = ''
    
    if (url.includes('/file/d/')) {
      const match = url.match(/\/file\/d\/([^/]+)/)
      if (match) {
        fileId = match[1].split('/')[0].split('?')[0]
        console.log('ID extraído:', fileId)
      }
    }

    if (!fileId) {
      console.warn('No se pudo extraer el ID del archivo:', url)
      return url
    }

    // Usar una combinación de servicios para mayor compatibilidad
    const baseUrl = `https://drive.google.com/uc?export=view&id=${fileId}`
    
    // Usar un servicio de proxy de imágenes para evitar problemas de CORS
    return `https://images.weserv.nl/?url=${encodeURIComponent(baseUrl)}&default=${encodeURIComponent(baseUrl)}&n=-1`

  } catch (error) {
    console.error('Error procesando URL:', error)
    return url
  }
}

export function OptimizedImage({ src, alt, className, onError, onLoad }: OptimizedImageProps) {
  const [currentSrc, setCurrentSrc] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (src.includes('drive.google.com')) {
      console.log('URL original:', src)
      const processedUrl = processGoogleDriveUrl(src)
      console.log('URL procesada:', processedUrl)
      setCurrentSrc(processedUrl)
    } else {
      setCurrentSrc(src)
    }
    setIsLoading(true)
    setHasError(false)
    setRetryCount(0)
  }, [src])

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!src) return
    
    setHasError(true)
    setIsLoading(false)
    console.warn(`Error cargando imagen: ${src}`)
    onError?.(e)
  }

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('Imagen cargada exitosamente:', currentSrc)
    setIsLoading(false)
    setHasError(false)
    onLoad?.(e)
  }

  const handleRetry = () => {
    setHasError(false)
    setIsLoading(true)
    setRetryCount(0)
    // Forzar recarga con timestamp
    setCurrentSrc(`${processGoogleDriveUrl(src)}&t=${Date.now()}`)
  }

  return (
    <div className={`relative ${className}`}>
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          loading="lazy"
          className={`w-full h-auto transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onError={handleError}
          onLoad={handleLoad}
        />
      )}

      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p className="text-sm text-muted-foreground">
            Cargando imagen...
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {src.includes('drive.google.com') ? 'Procesando imagen de Google Drive' : 'Optimizando imagen'}
          </p>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90 p-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              No se pudo cargar la imagen
            </p>
            <div className="text-sm text-muted-foreground mb-4">
              Verifica que:
            </div>
            <ul className="list-disc text-sm text-muted-foreground text-left pl-4 mb-4">
              <li>La URL sea válida</li>
              <li>La imagen sea pública</li>
              <li>El formato sea compatible</li>
            </ul>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRetry}
              className="gap-2"
            >
              <Loader2 className={`h-4 w-4 ${retryCount ? 'animate-spin' : ''}`} />
              Reintentar ({retryCount})
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 