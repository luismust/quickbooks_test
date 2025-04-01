"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Plus } from "lucide-react"

interface Hotspot {
  id: string
  x: number
  y: number
  label: string
}

interface ImageHotspotsEditorProps {
  imageUrl: string
  question: string
  hotspots: Hotspot[]
  onChange: (data: { 
    imageUrl: string
    question: string
    hotspots: Hotspot[]
    localFile?: File 
  }) => void
}

export function ImageHotspotsEditor({ 
  imageUrl, 
  question, 
  hotspots, 
  onChange 
}: ImageHotspotsEditorProps) {
  const [currentImage, setCurrentImage] = useState(imageUrl)
  const [localFile, setLocalFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlacingHotspot, setIsPlacingHotspot] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isPlacingHotspot) return

    const rect = imageRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newHotspot: Hotspot = {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      label: ""
    }

    onChange({
      imageUrl: currentImage,
      question,
      hotspots: [...hotspots, newHotspot],
      localFile
    })

    setIsPlacingHotspot(false)
  }

  // ... resto del código similar a ImageAreaSelector para la carga de imágenes

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* ... código de carga de imagen ... */}

        {currentImage && (
          <div className="relative">
            <img
              ref={imageRef}
              src={currentImage}
              alt="Question image"
              className="w-full h-auto"
              onClick={handleImageClick}
              style={{ cursor: isPlacingHotspot ? 'crosshair' : 'default' }}
            />
            {hotspots.map((hotspot) => (
              <div
                key={hotspot.id}
                className="absolute w-4 h-4 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${hotspot.x}%`,
                  top: `${hotspot.y}%`
                }}
              />
            ))}
          </div>
        )}

        <Button
          variant="outline"
          onClick={() => setIsPlacingHotspot(true)}
          disabled={isPlacingHotspot}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Hotspot
        </Button>

        {/* Lista de hotspots con sus etiquetas */}
        <div className="space-y-2">
          {hotspots.map((hotspot) => (
            <div key={hotspot.id} className="flex gap-2">
              <Input
                placeholder="Hotspot label"
                value={hotspot.label}
                onChange={(e) => {
                  const updatedHotspots = hotspots.map(h =>
                    h.id === hotspot.id ? { ...h, label: e.target.value } : h
                  )
                  onChange({
                    imageUrl: currentImage,
                    question,
                    hotspots: updatedHotspots,
                    localFile
                  })
                }}
              />
              <Button
                variant="destructive"
                onClick={() => {
                  onChange({
                    imageUrl: currentImage,
                    question,
                    hotspots: hotspots.filter(h => h.id !== hotspot.id),
                    localFile
                  })
                }}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
} 