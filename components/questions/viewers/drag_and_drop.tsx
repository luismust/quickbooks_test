"use client"

import React from 'react'

interface DragAndDropProps {
  // Add proper props here
  options?: any[]
  onSelect?: (id: string) => void
  isAnswered?: boolean
}

export function DragAndDrop({ options = [], onSelect, isAnswered = false }: DragAndDropProps) {
  return (
    <div className="p-4 text-center">
      <p className="text-muted-foreground">Drag and drop component placeholder</p>
      <p className="text-xs text-muted-foreground">This component will be implemented later</p>
    </div>
  )
} 