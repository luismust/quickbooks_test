"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, GripVertical, Target } from "lucide-react"
import { motion, Reorder } from "framer-motion"
import type { DragItem } from "@/lib/test-storage"

interface DropZone {
  id: string
  name: string
}

interface DragAndDropEditorProps {
  items: DragItem[]
  onChange: (items: DragItem[]) => void
}

export function DragAndDropEditor({ items, onChange }: DragAndDropEditorProps) {
  const [newItemText, setNewItemText] = useState("")
  const [zones, setZones] = useState<DropZone[]>([
    { id: "zone1", name: "Zona 1" },
    { id: "zone2", name: "Zona 2" }
  ])
  const [newZoneName, setNewZoneName] = useState("")

  const handleAddItem = () => {
    if (!newItemText.trim()) return

    const newItem: DragItem = {
      id: crypto.randomUUID(),
      text: newItemText,
      correctZone: zones[0]?.id || "",
      order: items.length
    }

    onChange([...items, newItem])
    setNewItemText("")
  }

  const handleDeleteItem = (id: string) => {
    onChange(items.filter(item => item.id !== id))
  }

  const handleUpdateText = (id: string, text: string) => {
    onChange(
      items.map(item =>
        item.id === id
          ? { ...item, text }
          : item
      )
    )
  }

  const handleUpdateZone = (itemId: string, zoneId: string) => {
    onChange(
      items.map(item =>
        item.id === itemId
          ? { ...item, correctZone: zoneId }
          : item
      )
    )
  }

  const handleAddZone = () => {
    if (!newZoneName.trim()) return
    
    const newZone: DropZone = {
      id: crypto.randomUUID(),
      name: newZoneName
    }

    setZones([...zones, newZone])
    setNewZoneName("")
  }

  const handleDeleteZone = (zoneId: string) => {
    setZones(zones.filter(zone => zone.id !== zoneId))
    // Actualizar los items que tenían esta zona como correcta
    onChange(
      items.map(item =>
        item.correctZone === zoneId
          ? { ...item, correctZone: zones[0]?.id || "" }
          : item
      )
    )
  }

  return (
    <div className="space-y-6">
      {/* Sección de Zonas */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Destination zones</h3>
        <div className="flex items-center gap-2">
          <Input
            placeholder="New zone name..."
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddZone()
              }
            }}
          />
          <Button
            onClick={handleAddZone}
            variant="outline"
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="flex items-center gap-2 bg-card p-2 rounded-lg border"
            >
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm">{zone.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteZone(zone.id)}
                className="text-destructive hover:text-destructive"
                disabled={zones.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Sección de Items */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Draggable elements</h3>
        <div className="flex items-center gap-2">
          <Input
            placeholder="New element..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddItem()
              }
            }}
          />
          <Button
            onClick={handleAddItem}
            variant="outline"
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Reorder.Group
          axis="y"
          values={items}
          onReorder={onChange}
          className="space-y-2"
        >
          {items.map((item) => (
            <Reorder.Item
              key={item.id}
              value={item}
              className="flex items-center gap-2 bg-card p-2 rounded-lg border"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
              <Input
                value={item.text}
                onChange={(e) => handleUpdateText(item.id, e.target.value)}
                className="flex-1"
              />
              <select
                value={item.correctZone}
                onChange={(e) => handleUpdateZone(item.id, e.target.value)}
                className="px-2 py-1 rounded border bg-background"
              >
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteItem(item.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No elements. Add some elements to drag.
          </p>
        )}
      </div>
    </div>
  )
}
