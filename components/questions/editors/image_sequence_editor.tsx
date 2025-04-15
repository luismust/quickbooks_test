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
  images: SequenceImage[]
  onChange: (data: {
    question: string
    images: SequenceImage[]
  }) => void
}

export function ImageSequenceEditor({
  question,
  images,
  onChange
}: ImageSequenceEditorProps) {
  const [currentQuestion, setCurrentQuestion] = useState(question)
  const [currentImages, setCurrentImages] = useState<SequenceImage[]>(images || [])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)

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
        id: Math.random().toString(36).substr(2, 9),
        url: imageUrl,
        order: currentImages.length,
        description: ''
      }

      const updatedImages = [...currentImages, newImage]
      setCurrentImages(updatedImages)
      onChange({
        question: currentQuestion,
        images: updatedImages
      })

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
    const updatedImages = currentImages.filter(img => img.id !== id)
      .map((img, index) => ({
        ...img,
        order: index
      }))
    
    setCurrentImages(updatedImages)
    onChange({
      question: currentQuestion,
      images: updatedImages
    })
  }

  const handleMoveImage = (id: string, direction: 'up' | 'down') => {
    const currentIndex = currentImages.findIndex(img => img.id === id)
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === currentImages.length - 1)
    ) {
      return // Can't move up if first, or down if last
    }

    const imagesCopy = [...currentImages]
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
    
    setCurrentImages(updatedImages)
    onChange({
      question: currentQuestion,
      images: updatedImages
    })
  }

  const handleDescriptionChange = (id: string, description: string) => {
    const updatedImages = currentImages.map(img => 
      img.id === id ? { ...img, description } : img
    )
    
    setCurrentImages(updatedImages)
    onChange({
      question: currentQuestion,
      images: updatedImages
    })
  }

  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentQuestion(e.target.value)
    onChange({
      question: e.target.value,
      images: currentImages
    })
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="question">Question</Label>
          <Textarea
            id="question"
            value={currentQuestion}
            onChange={handleQuestionChange}
            placeholder="Write the question..."
            className="mt-1"
          />
        </div>

        <div>
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

        {currentImages.length > 0 && (
          <div className="space-y-3">
            {currentImages.map((image, index) => (
              <div
                key={image.id}
                className="border rounded-md p-3 bg-background flex flex-col gap-2"
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
                      disabled={index === currentImages.length - 1}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveImage(image.id)}
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

        {currentImages.length === 0 && (
          <div className="text-center py-8 border border-dashed rounded-lg">
            <p className="text-muted-foreground">No images added yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add images and arrange them in the correct sequence
            </p>
          </div>
        )}
      </div>
    </Card>
  )
} 