"use client"

import { Button } from "@/components/ui/button"
import { Pencil, Square, Circle, Eraser, Check } from "lucide-react"

type DrawingTool = "pencil" | "rectangle" | "circle" | "eraser"

interface DrawingToolbarProps {
  currentTool: DrawingTool
  onToolChange: (tool: DrawingTool) => void
  onClear: () => void
  hasDrawing: boolean
  onConfirm: () => void
}

export function DrawingToolbar({ 
  currentTool, 
  onToolChange, 
  onClear,
  hasDrawing,
  onConfirm 
}: DrawingToolbarProps) {
  return (
    <div className="flex gap-2 mb-4 p-2 bg-muted rounded-md items-center">
      <Button
        variant={currentTool === "rectangle" ? "default" : "outline"}
        size="icon"
        onClick={() => onToolChange("rectangle")}
        title="Rectángulo"
      >
        <Square className="h-4 w-4" />
      </Button>

      <Button 
        variant="destructive" 
        size="sm" 
        onClick={onClear}
      >
        Limpiar
      </Button>

      {hasDrawing && (
        <Button
          variant="default"
          size="sm"
          onClick={onConfirm}
          className="ml-auto bg-green-600 hover:bg-green-700"
        >
          <Check className="h-4 w-4 mr-2" />
          OK
        </Button>
      )}
    </div>
  )
} 