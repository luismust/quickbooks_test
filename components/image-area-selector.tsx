"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ImageMap } from "./image-map"
import { DrawingToolbar } from "./drawing-toolbar"
import { generateId } from "@/lib/test-storage"
import { toast } from "sonner"
import type { Area } from "@/lib/test-storage"

interface ImageAreaSelectorProps {
  image: string
  areas: Area[]
  onChange: (data: { image?: string; areas?: Area[]; localFile?: File | string }) => void
  isEditMode?: boolean
  onImageUpload?: (file: File) => Promise<string>
}

export function ImageAreaSelector({ 
  image, 
  areas, 
  onChange, 
  isEditMode = true,
  onImageUpload 
}: ImageAreaSelectorProps) {
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [currentImage, setCurrentImage] = useState('')
  const [localFile, setLocalFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTool, setSelectedTool] = useState<"rect" | "circle" | "poly">("rect")
  const [drawingArea, setDrawingArea] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    console.log("Image prop changed:", image)
    if (image) {
      setCurrentImage(image)
    }
  }, [image])

  useEffect(() => {
    return () => {
      if (currentImage && currentImage.startsWith('blob:')) {
        URL.revokeObjectURL(currentImage)
      }
    }
  }, [])

  const handleImageUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, GIF)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Maximum file size is 5MB')
      return
    }

    setIsLoading(true)

    try {
      const localUrl = URL.createObjectURL(file)
      setLocalFile(file)
      setCurrentImage(localUrl)

      // Convertir la imagen a base64 para preparar la subida a Vercel Blob
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64Data = reader.result as string
        
        // Actualizar el componente y preparar los datos para subir a Vercel Blob
        onChange({ 
          image: localUrl,  // URL temporal local para vista previa
          areas: areas,
          localFile: base64Data // Guardar la imagen en base64 para subirla a Vercel Blob
        })
        
        setIsLoading(false)
        toast.success('Image loaded successfully and ready for upload')
      }
      
      reader.onerror = () => {
        toast.error('Error reading image file. Please try again.')
        setIsLoading(false)
      }
      
      // Iniciar la lectura del archivo como base64
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error handling image:', error)
      toast.error('Error processing image. Please try again.')
      setIsLoading(false)
    }
  }

  const handleDrawStart = (x: number, y: number) => {
    if (!isDrawingMode) return
    
    console.log('Draw start at:', x, y)
    
    // Las coordenadas recibidas ya están normalizadas por ImageMap
    setDrawingArea({
      id: generateId(),
      shape: selectedTool,
      isCorrect: true,
      coords: [x, y, x, y], // Coordenadas iniciales (x1, y1, x1, y1)
      x, // Guardar el punto de inicio para referencia
      y,
      width: 0,
      height: 0
    })
  }

  const handleDrawMove = (x: number, y: number) => {
    if (!drawingArea) return

    // Solo registrar algunos movimientos para no saturar la consola
    if (Math.random() < 0.05) {
      console.log('Draw move to:', x, y);
    }
    
    // Usar el punto de inicio guardado para coordenadas consistentes
    setDrawingArea((prev: any) => {
      if (!prev) return null
      
      // Asegurarnos que las coordenadas están en el formato [x1, y1, x2, y2]
      // donde x1,y1 es el punto inicial y x2,y2 es el punto actual
      return {
        ...prev,
        coords: [prev.x, prev.y, x, y], // Usar el punto guardado para el inicio
        width: Math.abs(x - prev.x),
        height: Math.abs(y - prev.y)
      }
    })
  }

  const handleDrawEnd = () => {
    if (!drawingArea) return

    console.log('Draw end with final coords:', drawingArea.coords)
    
    const width = Math.abs(drawingArea.coords[2] - drawingArea.coords[0])
    const height = Math.abs(drawingArea.coords[3] - drawingArea.coords[1])
    
    // Reducir el umbral mínimo a 5 píxeles para permitir áreas más pequeñas
    if (width < 5 || height < 5) {
      toast.error('The selected area is too small. Please draw a larger area.')
      setDrawingArea(null)
      return
    }

    // Asegurarnos de ordenar las coordenadas para que x1,y1 sea la esquina superior izquierda
    // y x2,y2 sea la esquina inferior derecha (necesario para correcta detección de clics)
    const x1 = Math.min(drawingArea.coords[0], drawingArea.coords[2])
    const y1 = Math.min(drawingArea.coords[1], drawingArea.coords[3])
    const x2 = Math.max(drawingArea.coords[0], drawingArea.coords[2])
    const y2 = Math.max(drawingArea.coords[1], drawingArea.coords[3])
    
    // Valores finales redondeados para mejor precisión
    const normalizedCoords = [x1, y1, x2, y2].map((coord) => Math.round(coord))
    
    console.log('Normalized coords:', normalizedCoords)

    const newArea = {
      ...drawingArea,
      coords: normalizedCoords
    }

    const updatedAreas = [...areas, newArea]
    onChange({ 
      areas: updatedAreas,
      localFile: localFile || undefined
    })
    
    // Importante: limpiar el área de dibujo después de agregar
    setDrawingArea(null)
    
    // Cuando termine un área, mantener el modo de dibujo activo para facilitar
    // dibujar múltiples áreas consecutivas
    toast.success('A new clickable area has been added. You can continue drawing more areas.')
  }

  const handleAreaClick = (areaId: string) => {
    if (!isEditMode) return
    
    const updatedAreas = areas.filter(area => area.id !== areaId)
    onChange({ 
      areas: updatedAreas,
      localFile: localFile || undefined
    })
    toast.success('The selected area has been deleted')
  }

  const handleClearAllAreas = () => {
    onChange({ 
      areas: [],
      localFile: localFile || undefined
    })
    toast.success('All areas have been deleted')
  }

  return (
    <Card className="p-4">
    <div className="space-y-4">
        <div className="flex items-center gap-2">
              <Input
            type="file"
            accept="image/*"
            onChange={handleImageUrlChange}
            className="hidden"
            ref={fileInputRef}
              />
              <Button
                variant="outline"
            onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
            {isLoading ? 'Loading...' : 'Upload Image'}
              </Button>
              {isDrawingMode && (
                <DrawingToolbar
                  selectedTool={selectedTool}
              onToolSelect={setSelectedTool}
              onClear={handleClearAllAreas}
            />
          )}
        </div>

      {currentImage && (
          <div className="relative">
            <ImageMap
              key={`image-selector-${currentImage.slice(-20)}`}
              src={currentImage}
              areas={areas}
              drawingArea={drawingArea}
              onDrawStart={handleDrawStart}
              onDrawMove={handleDrawMove}
              onDrawEnd={handleDrawEnd}
              onAreaClick={handleAreaClick}
              isDrawingMode={isDrawingMode}
              isEditMode={isEditMode}
              onError={() => {
                console.error("Failed to load image in ImageAreaSelector:", currentImage)
                toast.error("Failed to load image. Please try uploading again.")
              }}
            />
            {isDrawingMode && isEditMode && (
              <div className="absolute bottom-2 left-2 right-2 bg-blue-100 p-2 rounded text-sm text-center">
                <p>Click and drag to draw an area. Release to finish.</p>
                <p className="text-xs text-gray-600 mt-1">To delete an area, click on it. To delete all areas, use the "Clear all" button in the toolbar.</p>
              </div>
            )}
            {!isDrawingMode && isEditMode && (
              <Button
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => setIsDrawingMode(true)}
              >
                Draw Area
              </Button>
            )}
            {isDrawingMode && isEditMode && (
              <Button
                variant="outline"
                className="absolute top-2 right-2 bg-green-100"
                onClick={() => setIsDrawingMode(false)}
              >
                Finish Drawing
              </Button>
            )}
          </div>
        )}
        
        {!currentImage && (
          <div className="flex items-center justify-center h-48 bg-gray-100 rounded-md">
            <p className="text-gray-500">No image selected. Upload an image to start.</p>
          </div>
      )}
    </div>
    </Card>
  )
} 