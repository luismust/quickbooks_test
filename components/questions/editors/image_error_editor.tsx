"use client"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

interface ImageErrorEditorProps {
  imageUrl: string
  question: string
  errors: string[]
  onChange: (data: { imageUrl: string; question: string; errors: string[]; localFile?: File }) => void
}

export function ImageErrorEditor({ imageUrl, question, errors, onChange }: ImageErrorEditorProps) {
  const [currentImage, setCurrentImage] = useState(imageUrl)
  const [localFile, setLocalFile] = useState<File | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const localUrl = URL.createObjectURL(file)
      setLocalFile(file)
      setCurrentImage(localUrl)
      onChange({ 
        imageUrl: localUrl, 
        question, 
        errors,
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

  const handleAddError = () => {
    onChange({ imageUrl: currentImage, question, errors: [...errors, ""], localFile })
  }

  const handleRemoveError = (index: number) => {
    const newErrors = errors.filter((_, i) => i !== index)
    onChange({ imageUrl: currentImage, question, errors: newErrors, localFile })
  }

  const handleErrorChange = (index: number, value: string) => {
    const newErrors = errors.map((error, i) => i === index ? value : error)
    onChange({ imageUrl: currentImage, question, errors: newErrors, localFile })
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
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
        </div>

        {currentImage && (
          <div className="relative aspect-video rounded-lg overflow-hidden">
            <img
              src={currentImage}
              alt="Question image"
              className="object-cover w-full h-full"
              onError={() => {
                toast.error("Failed to load image. Please try uploading again.")
              }}
            />
          </div>
        )}

        {!currentImage && (
          <div className="flex items-center justify-center h-48 bg-gray-100 rounded-md">
            <p className="text-gray-500">No image selected. Upload an image to start.</p>
          </div>
        )}

        <div>
          <Label>Question</Label>
          <Textarea
            placeholder="Write the question..."
            value={question}
            onChange={(e) => onChange({ 
              imageUrl: currentImage, 
              question: e.target.value, 
              errors,
              localFile 
            })}
          />
        </div>

        <div className="space-y-2">
          <Label>Errors to find</Label>
          {errors.map((error, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder={`Error ${index + 1}`}
                value={error}
                onChange={(e) => handleErrorChange(index, e.target.value)}
              />
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleRemoveError(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={handleAddError}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Error
          </Button>
        </div>
      </div>
    </Card>
  )
} 