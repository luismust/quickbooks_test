"use client"

import React from 'react'

interface SequenceProps {
  // Add proper props here
  items?: any[]
  onSelect?: (id: string) => void
  isAnswered?: boolean
}

export function Sequence({ items = [], onSelect, isAnswered = false }: SequenceProps) {
  return (
    <div className="p-4 text-center">
      <p className="text-muted-foreground">Sequence component placeholder</p>
      <p className="text-xs text-muted-foreground">This component will be implemented later</p>
    </div>
  )
} 