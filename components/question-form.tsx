"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Plus, Link } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { processGoogleDriveUrl } from "@/lib/utils"

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
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    question: "",
    imageUrl: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newQuestion: Question = {
      id: Date.now(),
      title: formData.title,
      description: formData.description,
      question: formData.question,
      image: processGoogleDriveUrl(formData.imageUrl) || "/placeholder.svg",
      areas: [],
      scoring: {
        correct: 1,
        incorrect: 1,
        retain: 0
      }
    };

    onAddQuestion(newQuestion);
    setFormData({
      title: "",
      description: "",
      question: "",
      imageUrl: ""
    });
  };

  const handleGoogleDriveUrl = (url: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrl: url
    }));
    // Aquí podrías agregar validación del formato de la URL
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add new question</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title
            </label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ej: QuickBooks Dashboard"
              required
            />
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium mb-1">
              Image URL (Google Drive)
            </label>
            <div className="flex gap-2">
              <Input
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
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
              Ensure the image is public in Google Drive
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Ej: Identify the correct area to create a new invoice"
              required
            />
          </div>

          <div>
            <label htmlFor="question" className="block text-sm font-medium mb-1">
              Question
            </label>
            <Input
              id="question"
              name="question"
              value={formData.question}
              onChange={handleChange}
              placeholder="Ej: Where would you click to create a new invoice?"
              required
            />
          </div>

          <Button type="submit" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add question
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 