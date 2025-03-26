"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ImageMap } from "@/components/image-map"
import { DrawingToolbar } from "@/components/drawing-toolbar"
import { toast } from "@/components/ui/use-toast"
import { Link, Square, Pencil } from "lucide-react"
import { processGoogleDriveUrl, generateId } from "@/lib/utils"

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

interface ImageAreaSelectorProps {
  image: string
  areas: Area[]
  onChange: (data: { image?: string; areas?: Area[]; originalImage?: string }) => void
  isEditMode?: boolean
}

export function ImageAreaSelector({ image, areas, onChange, isEditMode = true }: ImageAreaSelectorProps) {
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [currentImage, setCurrentImage] = useState(image)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTool, setSelectedTool] = useState<"rect" | "circle" | "poly">("rect")
  const imageRef = useRef<HTMLImageElement>(null)
  const [drawingArea, setDrawingArea] = useState<Area | null>(null)

  // Procesar imagen al cargar
  useEffect(() => {
    if (image && image.includes('drive.google.com')) {
      const processedUrl = processGoogleDriveUrl(image)
      setCurrentImage(processedUrl)
    } else {
      setCurrentImage(image)
    }
  }, [image])

  const handleImageUrlChange = async (url: string) => {
    try {
      setIsLoading(true)
      
      if (url.includes('drive.google.com')) {
        const processedUrl = processGoogleDriveUrl(url)
        setCurrentImage(processedUrl)
        
        // Verificar que la imagen se pueda cargar
        const img = new Image()
        img.src = processedUrl
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = () => reject(new Error('Unable to load image'))
        })
        
        onChange({ 
          image: processedUrl,
          originalImage: url 
        })
      } else {
        // Verificar que la imagen se pueda cargar
        const img = new Image()
        img.src = url
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = () => reject(new Error('Unable to load image'))
        })
        
        setCurrentImage(url)
        onChange({ 
          image: url,
          originalImage: url 
        })
      }
    } catch (error) {
      console.error('Error loading image:', error)
      toast({
        title: "Error loading image",
        description: "Verify that the URL is correct and the image is accessible",
        variant: "destructive"
      })
      // Clean the image in case of error
      setCurrentImage('')
      onChange({ 
        image: '',
        originalImage: '' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrawStart = (x: number, y: number) => {
    if (!isDrawingMode) return
    
    setDrawingArea({
      id: generateId(),
      shape: selectedTool,
      isCorrect: true,
      coords: [x, y, x, y],
      x,
      y,
      width: 0,
      height: 0
    })
  }

  const handleDrawMove = (x: number, y: number) => {
    if (!drawingArea) return

    setDrawingArea(prev => {
      if (!prev) return null
      
      const width = x - (prev.x || 0)
      const height = y - (prev.y || 0)
      
      return {
        ...prev,
        coords: [prev.x || 0, prev.y || 0, x, y],
        width: Math.abs(width),
        height: Math.abs(height)
      }
    })
  }

  const handleDrawEnd = () => {
    if (!drawingArea) return

    // Validar tamaño mínimo
    const width = Math.abs(drawingArea.coords[2] - drawingArea.coords[0])
    const height = Math.abs(drawingArea.coords[3] - drawingArea.coords[1])
    
    if (width < 10 || height < 10) {
      toast({
        title: "Area too small",
        description: "The area must be larger to be clickable",
        variant: "destructive"
      })
      setDrawingArea(null)
      return
    }

    const newArea = {
      ...drawingArea,
      coords: drawingArea.coords.map(coord => Math.round(coord))
    }

    onChange({ areas: [...areas, newArea] })
    setDrawingArea(null)
    setIsDrawingMode(false)
    
    toast({
      title: "Area added",
      description: "A new clickable area has been added"
    })
  }

  const handleAreaClick = (areaId: string) => {
    if (!isEditMode) return
    
    const updatedAreas = areas.filter(area => area.id !== areaId)
    onChange({ areas: updatedAreas })
    toast({
      title: "Area deleted",
      description: "The selected area has been deleted"
    })
  }

  const handleClearAllAreas = () => {
    onChange({ areas: [] })
    toast({
      title: "Areas cleaned",
      description: "All marked areas have been deleted"
    })
  }

  return (
    <div className="space-y-4">
      {isEditMode && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Image URL (Google Drive)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="https://drive.google.com/file/d/..."
                value={image}
                onChange={(e) => handleImageUrlChange(e.target.value)}
                type="url"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => window.open('https://drive.google.com', '_blank')}
                title="Abrir Google Drive"
                disabled={isLoading}
              >
                <Link className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-1 space-y-1">
              <p>Ensure the image is public in Google Drive</p>
              <p>Supported URL formats:</p>
              <ul className="list-disc pl-4">
                <li>https://drive.google.com/file/d/ID_ARCHIVO/view</li>
                <li>https://drive.google.com/open?id=ID_ARCHIVO</li>
              </ul>
            </div>
          </div>

          {currentImage && (
            <div className="flex items-center gap-2">
              <Button
                variant={isDrawingMode ? "secondary" : "outline"}
                onClick={() => setIsDrawingMode(!isDrawingMode)}
                disabled={!currentImage || isLoading}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                {isDrawingMode ? "Cancel drawing" : "Draw area"}
              </Button>

              {isDrawingMode && (
                <DrawingToolbar
                  isDrawingMode={isDrawingMode}
                  selectedTool={selectedTool}
                  onToolChange={setSelectedTool}
                  onDrawingModeChange={setIsDrawingMode}
                  onClearAll={handleClearAllAreas}
                  hasAreas={areas.length > 0}
                  disabled={!currentImage || isLoading}
                />
              )}

              {!isDrawingMode && areas.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleClearAllAreas}
                  disabled={isLoading}
                >
                  Clean areas
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {currentImage && (
        <Card className="p-4">
          <div className="relative">
            <ImageMap
              ref={imageRef}
              src={currentImage}
              areas={areas}
              drawingArea={drawingArea}
              onAreaClick={handleAreaClick}
              alt="Image to mark areas"
              className="w-full h-auto border rounded-md"
              isDrawingMode={isDrawingMode}
              isEditMode={isEditMode}
              onDrawStart={handleDrawStart}
              onDrawMove={handleDrawMove}
              onDrawEnd={handleDrawEnd}
            />
          </div>
        </Card>
      )}
    </div>
  )
} 