"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Plus, Link } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

interface QuestionFormProps {
  onAddQuestion: (question: {
    id: number
    title: string
    description: string
    question: string
    image: string
    areas: Array<{
      id: string
      shape: "rect"
      coords: number[]
      isCorrect: boolean
    }>
  }) => void
}

export function QuestionForm({ onAddQuestion }: QuestionFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [question, setQuestion] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Convertir URL de Google Drive si es necesario
    const processedImageUrl = imageUrl.includes('drive.google.com/file/d/') 
      ? imageUrl.replace(/\/file\/d\/(.+?)\/view.+/, '/uc?id=$1')
      : imageUrl

    const newQuestion = {
      id: Date.now(),
      title,
      description,
      question,
      image: processedImageUrl || "/placeholder.svg?height=600&width=800",
      areas: []
    }

    onAddQuestion(newQuestion)
    
    // Limpiar el formulario
    setTitle("")
    setDescription("")
    setQuestion("")
    setImageUrl("")
  }

  const handleGoogleDriveUrl = (url: string) => {
    setImageUrl(url)
    // Aquí podrías agregar validación del formato de la URL
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Agregar nueva pregunta</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Título
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: QuickBooks Dashboard"
              required
            />
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium mb-1">
              URL de la imagen (Google Drive)
            </label>
            <div className="flex gap-2">
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => handleGoogleDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                type="url"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => window.open('https://drive.google.com', '_blank')}
              >
                <Link className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Asegúrate de que la imagen sea pública en Google Drive
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Descripción
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Identify the correct area to create a new invoice"
              required
            />
          </div>

          <div>
            <label htmlFor="question" className="block text-sm font-medium mb-1">
              Pregunta
            </label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ej: ¿Dónde harías clic para crear una nueva factura?"
              required
            />
          </div>

          <Button type="submit" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Agregar pregunta
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 