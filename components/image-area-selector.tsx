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

  // When isEditMode changes, ensure drawing mode is set appropriately
  useEffect(() => {
    if (!isEditMode) {
      setIsDrawingMode(false);
    }
  }, [isEditMode]);

  // Add debug logging for drawingArea state changes
  useEffect(() => {
    console.log("Drawing area changed:", drawingArea);
    
    // Depuración detallada cuando se cambia el área de dibujo
    if (drawingArea && drawingArea.coords && drawingArea.coords.length === 4) {
      // Verificar que todas las coordenadas son válidas
      const allValid = drawingArea.coords.every((coord: number) => 
        Number.isFinite(coord) && !Number.isNaN(coord)
      );
      
      if (allValid) {
        console.log("Valid drawing area coordinates:", {
          raw: drawingArea.coords,
          normalized: drawingArea.coords.map((coord: number) => Math.round(coord)),
          width: Math.abs(drawingArea.coords[2] - drawingArea.coords[0]),
          height: Math.abs(drawingArea.coords[3] - drawingArea.coords[1]),
          mode: "drawing"
        });
      } else {
        console.error("Invalid drawing area coordinates detected:", drawingArea.coords);
      }
    }
  }, [drawingArea]);

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

      // Automatically activate drawing mode after image load
      setIsDrawingMode(true)

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
        toast.success('Image loaded successfully. Click and drag to draw clickable areas.')
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
    
    // Validar que las coordenadas son números finitos
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      console.error('Invalid coordinates in handleDrawStart:', { x, y });
      return;
    }
    
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

    // Validar que las coordenadas son números finitos
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      console.error('Invalid coordinates in handleDrawMove:', { x, y });
      return;
    }

    // Solo registrar algunos movimientos para no saturar la consola
    if (Math.random() < 0.05) {
      console.log('Draw move to:', x, y);
    }
    
    // Usar el punto de inicio guardado para coordenadas consistentes
    setDrawingArea((prev: any) => {
      if (!prev) return null
      
      // Verificar que el punto inicial es válido
      if (!Number.isFinite(prev.x) || !Number.isFinite(prev.y)) {
        console.error('Invalid stored coordinates:', { prevX: prev.x, prevY: prev.y });
        return prev;
      }
      
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

  // Función para asegurar que las coordenadas son consistentes
  const normalizeAndValidateCoords = (coords: number[]): number[] => {
    if (!coords || coords.length < 4) {
      console.error('Cannot normalize invalid coordinates');
      return coords;
    }
    
    // Verificar valores inválidos
    const hasInvalidValues = coords.some(coord => 
      !Number.isFinite(coord) || Number.isNaN(coord)
    );
    
    if (hasInvalidValues) {
      console.error('Coordinates contain invalid values:', coords);
      return coords;
    }
    
    // Asegurar que x1,y1 es la esquina superior izquierda
    // y x2,y2 es la esquina inferior derecha
    const x1 = Math.min(coords[0], coords[2]);
    const y1 = Math.min(coords[1], coords[3]);
    const x2 = Math.max(coords[0], coords[2]);
    const y2 = Math.max(coords[1], coords[3]);
    
    // Redondear para precisión
    const normalizedCoords = [
      Math.round(x1), 
      Math.round(y1), 
      Math.round(x2), 
      Math.round(y2)
    ];
    
    // Verificar que el ancho y alto son suficientes
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    
    if (width < 5 || height < 5) {
      console.warn('Area too small, might be difficult to click:', { width, height });
    }
    
    return normalizedCoords;
  }

  const handleDrawEnd = () => {
    if (!drawingArea) return

    console.log('Draw end with final coords:', drawingArea.coords)
    
    // Verificar que las coordenadas son números válidos
    const hasInvalidCoords = drawingArea.coords.some((coord: number) => 
      !Number.isFinite(coord) || Number.isNaN(coord)
    );
    
    if (hasInvalidCoords) {
      console.error('Invalid coordinates in handleDrawEnd:', drawingArea.coords);
      toast.error('Invalid drawing coordinates. Please try again.');
      setDrawingArea(null);
      return;
    }
    
    // Calcular dimensiones
    const width = Math.abs(drawingArea.coords[2] - drawingArea.coords[0])
    const height = Math.abs(drawingArea.coords[3] - drawingArea.coords[1])
    
    // Verificar tamaño mínimo
    if (width < 5 || height < 5) {
      toast.error('The selected area is too small. Please draw a larger area.')
      setDrawingArea(null)
      return
    }

    // CRUCIAL: Asegurar coordenadas consistentes entre modos
    // Obtener valores ordenados para x1,y1 sea siempre esquina superior izquierda
    const x1 = Math.min(drawingArea.coords[0], drawingArea.coords[2]);
    const y1 = Math.min(drawingArea.coords[1], drawingArea.coords[3]);
    const x2 = Math.max(drawingArea.coords[0], drawingArea.coords[2]);
    const y2 = Math.max(drawingArea.coords[1], drawingArea.coords[3]);
    
    // IMPORTANTE: Redondear a ENTEROS para evitar diferencias de precisión
    const normalizedCoords = [
      Math.floor(x1), 
      Math.floor(y1), 
      Math.ceil(x2), 
      Math.ceil(y2)
    ];
    
    console.log('FINAL NORMALIZED COORDS:', normalizedCoords)

    // Crear ID único con timestamp para evitar colisiones y problemas de caché
    const uniqueId = `area_${generateId()}_${Date.now().toString(36)}`;
    
    // Crear área con datos normalizados
    const newArea = {
      ...drawingArea,
      id: uniqueId,
      coords: normalizedCoords,
      // Guardar dimensiones originales para referencia
      originalWidth: Math.round(width),
      originalHeight: Math.round(height),
      // Usar dimensiones calculadas con valores normalizados
      width: Math.ceil(x2) - Math.floor(x1),
      height: Math.ceil(y2) - Math.floor(y1)
    }

    // Limpiar el área de dibujo antes de actualizar estado
    setDrawingArea(null)
    
    // Usar más retraso para asegurar actualización correcta
    setTimeout(() => {
      // Crear nuevo array en vez de modificar el existente
      const updatedAreas = [...areas, newArea]
      
      // Log detallado para depuración
      console.log('ÁREAS ACTUALIZADAS:', {
        newArea,
        totalAreas: updatedAreas.length,
        normalizedCoords,
        mode: "edit"
      });
      
      // Actualizar estado
      onChange({ 
        areas: updatedAreas,
        localFile: localFile || undefined
      })
      
      toast.success('A new clickable area has been added. Continue drawing or click "Finish Drawing".')
    }, 100); // Retraso más largo para asegurar que todo se actualiza
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