"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Point {
  id: string
  text: string
  type: 'left' | 'right'
  correctMatch?: string
}

interface PointAPointEditorProps {
  points: Point[]
  onChange: (points: Point[]) => void
}

export function PointAPointEditor({ points, onChange }: PointAPointEditorProps) {
  const [newLeftText, setNewLeftText] = useState("")
  const [newRightText, setNewRightText] = useState("")
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [selectedRight, setSelectedRight] = useState<string | null>(null)

  const handleAddPoint = (type: 'left' | 'right', text: string) => {
    if (!text.trim()) return

    const newPoint: Point = {
      id: Date.now().toString(),
      text: text.trim(),
      type
    }

    onChange([...points, newPoint])
    if (type === 'left') {
      setNewLeftText("")
    } else {
      setNewRightText("")
    }
  }

  const handleDeletePoint = (id: string) => {
    // También eliminar las conexiones asociadas
    const updatedPoints = points.map(point => {
      if (point.correctMatch === id) {
        return { ...point, correctMatch: undefined }
      }
      return point
    }).filter(p => p.id !== id)
    
    onChange(updatedPoints)
    setSelectedLeft(null)
    setSelectedRight(null)
  }

  const handleSetMatch = () => {
    if (!selectedLeft || !selectedRight) return

    // Eliminar conexiones previas si existen
    const updatedPoints = points.map(point => {
      if (point.id === selectedLeft || point.correctMatch === selectedLeft ||
          point.id === selectedRight || point.correctMatch === selectedRight) {
        return { ...point, correctMatch: undefined }
      }
      return point
    })

    // Crear nueva conexión
    onChange(updatedPoints.map(point => {
      if (point.id === selectedLeft) {
        return { ...point, correctMatch: selectedRight }
      }
      if (point.id === selectedRight) {
        return { ...point, correctMatch: selectedLeft }
      }
      return point
    }))

    setSelectedLeft(null)
    setSelectedRight(null)
  }

  const leftPoints = points.filter(p => p.type === 'left')
  const rightPoints = points.filter(p => p.type === 'right')

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium">Create connections between elements</h3>
        <p className="text-sm text-muted-foreground">
          Select an element from each column and click "Connect elements" to establish a correct connection
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Columna izquierda */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Left elements</h3>
            <div className="flex gap-2">
              <Input
                placeholder="New element..."
                value={newLeftText}
                onChange={(e) => setNewLeftText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddPoint('left', newLeftText)
                  }
                }}
                className="w-48"
              />
              <Button
                onClick={() => handleAddPoint('left', newLeftText)}
                variant="outline"
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {leftPoints.map((point) => (
            <div
              key={point.id}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border transition-colors",
                selectedLeft === point.id && "border-blue-500 bg-blue-50",
                point.correctMatch && "border-green-500 bg-green-50",
                !selectedLeft && !point.correctMatch && "hover:border-blue-200"
              )}
            >
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => setSelectedLeft(point.id)}
              >
                {point.text}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeletePoint(point.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Columna derecha */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Right elements</h3>
            <div className="flex gap-2">
              <Input
                placeholder="New element..."
                value={newRightText}
                onChange={(e) => setNewRightText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddPoint('right', newRightText)
                  }
                }}
                className="w-48"
              />
              <Button
                onClick={() => handleAddPoint('right', newRightText)}
                variant="outline"
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {rightPoints.map((point) => (
            <div
              key={point.id}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border transition-colors",
                selectedRight === point.id && "border-blue-500 bg-blue-50",
                point.correctMatch && "border-green-500 bg-green-50",
                !selectedRight && !point.correctMatch && "hover:border-blue-200"
              )}
            >
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => setSelectedRight(point.id)}
              >
                {point.text}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeletePoint(point.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Panel para establecer conexiones */}
      <div className="flex justify-center mt-4">
        {selectedLeft && selectedRight ? (
          <Button onClick={handleSetMatch} className="gap-2">
            Conectar elementos <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Select an element from each column to connect them
          </p>
        )}
      </div>

      {/* Mostrar conexiones establecidas */}
      <div className="mt-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-sm font-medium mb-4">Established connections</h3>
        {points.filter(p => p.type === 'left' && p.correctMatch).length > 0 ? (
          <div className="space-y-2">
            {points.filter(p => p.type === 'left' && p.correctMatch).map(point => {
              const matchedPoint = points.find(p => p.id === point.correctMatch)
              return (
                <div key={point.id} className="flex items-center gap-2 p-2 rounded bg-white">
                  <div className="flex-1">{point.text}</div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">{matchedPoint?.text}</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      onChange(points.map(p => {
                        if (p.id === point.id || p.id === point.correctMatch) {
                          return { ...p, correctMatch: undefined }
                        }
                        return p
                      }))
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            No established connections
          </p>
        )}
      </div>
    </div>
  )
} 