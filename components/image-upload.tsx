"use client"

import { Upload } from "lucide-react"
import { Button } from "./ui/button"

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void
}

export function ImageUpload({ onImageUpload }: ImageUploadProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Verificar que es una imagen
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecciona un archivo de imagen válido')
        return
      }

      const imageUrl = URL.createObjectURL(file)
      console.log("Creando URL para imagen:", imageUrl) // Para debugging
      onImageUpload(imageUrl)
      
      // Limpiar el input para permitir cargar la misma imagen nuevamente
      event.target.value = ''
    }
  }

  return (
    <div className="mb-4">
      <Button 
        variant="outline" 
        className="w-full" 
        onClick={() => document.getElementById('imageUpload')?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        Subir imagen
      </Button>
      <input
        id="imageUpload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
} 