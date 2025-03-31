"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface Difference {
  id: string
  description: string
  x1: number
  y1: number
  x2: number
  y2: number
}

interface ImageComparisonEditorProps {
  imageUrl1: string
  imageUrl2: string
  question: string
  differences: Difference[]
  onChange: (data: {
    imageUrl1: string
    imageUrl2: string
    question: string
    differences: Difference[]
    localFile1?: File
    localFile2?: File
  }) => void
}

export function ImageComparisonEditor({
  imageUrl1,
  imageUrl2,
  question,
  differences,
  onChange
}: ImageComparisonEditorProps) {
  const [localFile1, setLocalFile1] = useState<File | null>(null)
  const [localFile2, setLocalFile2] = useState<File | null>(null)
  const fileInput1Ref = useRef<HTMLInputElement>(null)
  const fileInput2Ref = useRef<HTMLInputElement>(null)

  // Implementar la lógica de carga y manejo de imágenes
  // Similar a image_description_editor.tsx pero para dos imágenes
  
  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* UI para cargar y mostrar las dos imágenes */}
        {/* UI para marcar y editar diferencias */}
        {/* UI para editar la pregunta */}
      </div>
    </Card>
  )
} 