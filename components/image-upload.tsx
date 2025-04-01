"use client"

import { Upload } from "lucide-react"
import { Button } from "./ui/button"
import { toast } from "sonner"

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void
  testId?: string  // Opcional: ID del test para asociar la imagen
}

export function ImageUpload({ onImageUpload, testId }: ImageUploadProps) {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Verificar que es una imagen
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecciona un archivo de imagen válido')
      return
    }

    try {
      // Convertir archivo a base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      // Subir a Airtable
      const response = await fetch('/api/airtable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: base64,
          testId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await response.json()
      
      // Usar la URL de Airtable
      onImageUpload(data.url)
      toast.success('Imagen subida correctamente')
      
      // Limpiar el input
      event.target.value = ''

    } catch (error) {
      console.error('Error subiendo imagen:', error)
      toast.error('Error al subir la imagen')
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