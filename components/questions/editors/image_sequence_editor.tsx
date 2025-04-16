"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Plus, Trash2, MoveUp, MoveDown } from "lucide-react"

interface SequenceImage {
  id: string
  url: string
  order: number
  description: string
}

interface ImageSequenceEditorProps {
  question: string
  answer: SequenceImage[]
  onChange: (question: string, answer: SequenceImage[]) => void
  isEditMode?: boolean
}

export function ImageSequenceEditor({
  question,
  answer,
  onChange,
  isEditMode = true
}: ImageSequenceEditorProps) {
  const [newImageDescription, setNewImageDescription] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  if (!isEditMode) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">This component should only be used in edit mode</p>
        <p className="text-xs text-muted-foreground">Use the image sequence viewer component for testing</p>
      </div>
    )
  }

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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
      const imageUrl = URL.createObjectURL(file)
      const newImage: SequenceImage = {
        id: crypto.randomUUID(),
        url: imageUrl,
        order: answer.length,
        description: newImageDescription
      }

      const updatedImages = [...answer, newImage]
      onChange(question, updatedImages)
      setNewImageDescription("")
      toast.success('Image added successfully')
    } catch (error) {
      console.error('Error handling image:', error)
      toast.error('Error processing image. Please try again.')
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (id: string) => {
    const updatedImages = answer.filter(img => img.id !== id)
      .map((img, index) => ({
        ...img,
        order: index
      }))
    
    onChange(question, updatedImages)
  }

  const handleMoveImage = (id: string, direction: 'up' | 'down') => {
    const currentIndex = answer.findIndex(img => img.id === id)
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === answer.length - 1)
    ) {
      return // Can't move up if first, or down if last
    }

    const imagesCopy = [...answer]
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    // Swap the items
    const temp = imagesCopy[currentIndex]
    imagesCopy[currentIndex] = imagesCopy[swapIndex]
    imagesCopy[swapIndex] = temp
    
    // Update order properties
    const updatedImages = imagesCopy.map((img, idx) => ({
      ...img,
      order: idx
    }))
    
    onChange(question, updatedImages)
  }

  const handleDescriptionChange = (id: string, description: string) => {
    const updatedImages = answer.map(img => 
      img.id === id ? { ...img, description } : img
    )
    
    onChange(question, updatedImages)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Sequence Images</h3>
          <div className="text-xs text-muted-foreground">
            The order here determines the correct sequence
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col gap-2">
            <Input
              type="text"
              placeholder="Description for the new image..."
              value={newImageDescription}
              onChange={(e) => setNewImageDescription(e.target.value)}
              disabled={isLoading}
            />
            
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleAddImage}
                className="hidden"
                ref={fileInputRef}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isLoading ? 'Loading...' : 'Add Image'}
              </Button>
            </div>
          </div>
        </div>

        {answer.length > 0 && (
          <div className="space-y-3">
            {answer.map((image, index) => (
              <div
                key={image.id}
                className="border rounded-md p-3 bg-card flex flex-col gap-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Step {index + 1}</div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMoveImage(image.id, 'up')}
                      disabled={index === 0}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMoveImage(image.id, 'down')}
                      disabled={index === answer.length - 1}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveImage(image.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={`Sequence step ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                </div>
                
                <Textarea
                  value={image.description}
                  onChange={(e) => handleDescriptionChange(image.id, e.target.value)}
                  placeholder="Description for this step..."
                  className="mt-2"
                />
              </div>
            ))}
          </div>
        )}

        {answer.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground">
              No images added yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add images and arrange them in the correct sequence.
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 