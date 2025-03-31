"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

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
  // ... implementación del editor de secuencia
} 