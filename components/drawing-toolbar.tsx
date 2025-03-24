"use client"

import { Button } from "@/components/ui/button"
import { Save, X, Check, Trash2, Undo, Eraser } from "lucide-react"

interface DrawingToolbarProps {
  onClear: () => void
  hasDrawing: boolean
  onConfirm: () => void
  isDrawingMode?: boolean
  onUndo?: () => void
  onDelete?: () => void
  canUndo?: boolean
  showSaveButton?: boolean
  hasUnsavedChanges?: boolean
  onSave?: () => void
  isPendingSave?: boolean
  onClearAllAreas?: () => void
  hasMarkedAreas?: boolean
}

export function DrawingToolbar({
  onClear,
  hasDrawing,
  onConfirm,
  onUndo,
  canUndo,
  showSaveButton,
  hasUnsavedChanges,
  onSave,
  isPendingSave,
  onClearAllAreas,
  hasMarkedAreas
}: DrawingToolbarProps) {
  return (
    <div className="flex items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 rounded-lg shadow-lg border">
      <Button
        variant="destructive"
        size="icon"
        onClick={() => {
          console.log('Limpiando áreas...'); // Para debug
          onClearAllAreas?.();
        }}
        disabled={!hasMarkedAreas}
        title="Limpiar todas las áreas marcadas"
        className="hover:bg-red-600 relative group"
      >
        <Eraser className="h-5 w-5" />
        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Borrar todo
        </span>
      </Button>

      <div className="w-px h-6 bg-border" />

      {canUndo && (
        <Button
          variant="outline"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo}
          title="Deshacer"
        >
          <Undo className="h-4 w-4" />
        </Button>
      )}

      <Button
        variant="destructive"
        size="icon"
        onClick={onClear}
        disabled={!hasDrawing}
        title="Limpiar área actual"
        className="hover:bg-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {hasDrawing && (
        <Button
          variant="default"
          size="icon"
          onClick={onConfirm}
          title="Confirmar área"
        >
          <Check className="h-4 w-4" />
        </Button>
      )}

      {showSaveButton && hasUnsavedChanges && (
        <Button
          variant="default"
          size="icon"
          onClick={onSave}
          disabled={isPendingSave}
          title="Guardar cambios"
        >
          <Save className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
} 