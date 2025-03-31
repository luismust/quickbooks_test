"use client"

import { useState } from "react"
import { DragItem } from "@/lib/test-storage"

interface DragAndDropProps {
  question: {
    items: DragItem[]
  }
  onAnswer: (answer: string[]) => void
  currentAnswer?: string[]
}

export function DragAndDrop({ question, onAnswer, currentAnswer = [] }: DragAndDropProps) {
  // Implementación del componente
  return (
    <div>
      <h3>Drag and Drop Component</h3>
      {/* Implementar la funcionalidad de drag and drop */}
    </div>
  )
} 