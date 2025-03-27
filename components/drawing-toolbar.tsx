"use client"

import { Button } from "@/components/ui/button"
import { Save, X, Check, Trash2, Undo, Eraser } from "lucide-react"

interface DrawingToolbarProps {
  onClear: () => void
  hasDrawing: boolean
  onConfirm: () => void
  onCancel?: () => void
  onUndo?: () => void
  onDelete?: () => void
  canUndo?: boolean
  showSaveButton?: boolean
  hasUnsavedChanges?: boolean
  onSave: () => Promise<void>
  isPendingSave?: boolean
  onClearAllAreas?: () => void
  hasMarkedAreas?: boolean
  isConfirming?: boolean
  isSaving?: boolean
}

export function DrawingToolbar({
  onClear,
  hasDrawing,
  onConfirm,
  onCancel,
  onUndo,
  canUndo,
  showSaveButton,
  hasUnsavedChanges,
  onSave,
  isPendingSave,
  onClearAllAreas,
  hasMarkedAreas,
  isConfirming,
  isSaving
}: DrawingToolbarProps) {
  return (
    <div className="flex items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 rounded-lg shadow-lg border">
      <Button
        variant="destructive"
        size="icon"
        onClick={() => {
          console.log('Clearing marked areas...')
          onClearAllAreas?.()
        }}
        disabled={!hasMarkedAreas}
        title="Clear all marked areas"
        className="hover:bg-red-600 relative group"
      >
        <Eraser className="h-5 w-5" />
        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Clear all marked areas
        </span>
      </Button>

      <div className="w-px h-6 bg-border" />

      {canUndo && (
        <Button
          variant="outline"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
      )}

      <Button
        variant="destructive"
        size="icon"
        onClick={onClear}
        disabled={!hasDrawing}
        title="Clear current area"
        className="hover:bg-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {hasDrawing && (
        <Button
          variant="default"
          size="icon"
          onClick={onConfirm}
          disabled={isConfirming}
          title="Confirm area"
          className="relative"
        >
          {isConfirming ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
      )}

      {onCancel && (
        <Button
          variant="outline"
          size="icon"
          onClick={onCancel}
          title="Cancel drawing"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <Button
        variant="default"
        size="icon"
        onClick={onSave}
        disabled={isSaving || !hasUnsavedChanges}
        title={hasUnsavedChanges ? "Save changes" : "No changes to save"}
        className="relative"
      >
        {isSaving ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {hasUnsavedChanges && (
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
        )}
      </Button>
    </div>
  )
}