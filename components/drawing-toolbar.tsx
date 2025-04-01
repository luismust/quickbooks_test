"use client"

import { Button } from "@/components/ui/button"
import { Square, Circle, Trash } from "lucide-react"

export interface DrawingToolbarProps {
  selectedTool: "rect" | "circle" | "poly"
  onToolSelect: (tool: "rect" | "circle" | "poly") => void
  onClear: () => void
}

export function DrawingToolbar({
  selectedTool,
  onToolSelect,
  onClear
}: DrawingToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={selectedTool === "rect" ? "default" : "outline"}
        size="sm"
        onClick={() => onToolSelect("rect")}
        className="w-8 h-8 p-0"
        title="Rectangle"
      >
        <Square className="h-4 w-4" />
      </Button>
      <Button
        variant={selectedTool === "circle" ? "default" : "outline"}
        size="sm"
        onClick={() => onToolSelect("circle")}
        className="w-8 h-8 p-0"
        title="Circle"
      >
        <Circle className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onClear}
        className="w-8 h-8 p-0"
        title="Clear all areas"
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  )
} 