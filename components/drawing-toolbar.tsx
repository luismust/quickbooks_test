"use client"

import { Button } from "@/components/ui/button"
import { Pencil, Square, Circle, Eraser } from "lucide-react"

type DrawingTool = "pencil" | "rectangle" | "circle" | "eraser"

interface DrawingToolbarProps {
  currentTool: DrawingTool
  onToolChange: (tool: DrawingTool) => void
  onClear: () => void
}

export function DrawingToolbar({ currentTool, onToolChange, onClear }: DrawingToolbarProps) {
  return (
    <div className="flex gap-2 mb-4 p-2 bg-muted rounded-md">
      <Button
        variant={currentTool === "pencil" ? "default" : "outline"}
        size="icon"
        onClick={() => onToolChange("pencil")}
        title="Lápiz"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant={currentTool === "rectangle" ? "default" : "outline"}
        size="icon"
        onClick={() => onToolChange("rectangle")}
        title="Rectángulo"
      >
        <Square className="h-4 w-4" />
      </Button>
      <Button
        variant={currentTool === "circle" ? "default" : "outline"}
        size="icon"
        onClick={() => onToolChange("circle")}
        title="Círculo"
      >
        <Circle className="h-4 w-4" />
      </Button>
      <Button
        variant={currentTool === "eraser" ? "default" : "outline"}
        size="icon"
        onClick={() => onToolChange("eraser")}
        title="Borrador"
      >
        <Eraser className="h-4 w-4" />
      </Button>
      <Button variant="destructive" size="sm" onClick={onClear}>
        Limpiar
      </Button>
    </div>
  )
} 