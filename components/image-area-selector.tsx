"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ImageMap } from "./image-map"
import { DrawingToolbar } from "./drawing-toolbar"
import { processImageUrl, formatGoogleDriveUrl } from "@/lib/utils"
import { generateId } from "@/lib/test-storage"
import { toast } from "sonner"

interface ImageAreaSelectorProps {
  image: string
  areas: any[]
  onChange: (data: { image?: string; areas?: any[]; localFile?: File }) => void
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
      if (image.includes('drive.google.com')) {
        const formattedUrl = formatGoogleDriveUrl(image)
        console.log("Formatted URL:", formattedUrl)
        setCurrentImage(formattedUrl)
      } else if (image.startsWith('blob:')) {
        setCurrentImage(image)
      } else {
        setCurrentImage(image)
      }
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
      
      onChange({ 
        image: localUrl, 
        areas: areas,
        localFile: file
      })
      
      toast.success('Image loaded successfully')
    } catch (error) {
      console.error('Error handling image:', error)
      toast.error('Error processing image. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrawStart = (x: number, y: number) => {
    if (!isDrawingMode) return
    
    console.log('Draw start at:', x, y)
    
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
    
    console.log('Draw move to:', x, y)
    
    setDrawingArea((prev: any) => {
      if (!prev) return null
      
      return {
        ...prev,
        coords: [prev.x || 0, prev.y || 0, x, y],
        width: Math.abs(x - prev.x),
        height: Math.abs(y - prev.y)
      }
    })
  }

  const handleDrawEnd = () => {
    if (!drawingArea) return
    
    console.log('Draw end')
    
    const width = Math.abs(drawingArea.coords[2] - drawingArea.coords[0])
    const height = Math.abs(drawingArea.coords[3] - drawingArea.coords[1])
    
    if (width < 10 || height < 10) {
      toast.error('The area must be larger to be clickable.')
      setDrawingArea(null)
      return
    }

    const newArea = {
      ...drawingArea,
      coords: drawingArea.coords.map((coord: number) => Math.round(coord))
    }

    const updatedAreas = [...areas, newArea]
    onChange({ 
      areas: updatedAreas,
      localFile: localFile || undefined
    })
    
    setDrawingArea(null)
    
    toast.success('A new clickable area has been added')
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