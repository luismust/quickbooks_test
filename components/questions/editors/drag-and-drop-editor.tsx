"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, GripVertical, Target } from "lucide-react"
import { motion, Reorder } from "framer-motion"
import type { DragItem } from "@/lib/test-storage"
import { toast } from "sonner"

interface DropZone {
  id: string
  name: string
}

// Declarar una variable global para almacenar los nombres de las zonas
declare global {
  interface Window {
    _dragAndDropZoneNames?: Record<string, string>;
  }
}

// Verificar si estamos en el navegador y crear el objeto si no existe
if (typeof window !== 'undefined') {
  window._dragAndDropZoneNames = window._dragAndDropZoneNames || {};
}

// Mapa local para guardar los nombres de las zonas
let zoneNamesMap: Record<string, string> = {}

interface DragAndDropEditorProps {
  items: DragItem[]
  onChange: (items: DragItem[]) => void
}

export function DragAndDropEditor({ items, onChange }: DragAndDropEditorProps) {
  const [newItemText, setNewItemText] = useState("")
  const [zones, setZones] = useState<DropZone[]>([])
  const [newZoneName, setNewZoneName] = useState("")

  // Cargar zonas existentes a partir de los items al montar el componente
  useEffect(() => {
    // Si hay items pero no hay zonas, intentar reconstruir las zonas
    if (items.length > 0 && zones.length === 0) {
      const zoneIds = Array.from(new Set(items.map(item => item.correctZone)));
      
      // Intentar recuperar los nombres de zona de la variable global
      const existingZones = zoneIds.map(zoneId => {
        const zoneName = window._dragAndDropZoneNames?.[zoneId] || `Zone ${zoneIds.indexOf(zoneId) + 1}`;
        
        // Guardar en el mapa local
        zoneNamesMap[zoneId] = zoneName;
        
        return {
          id: zoneId,
          name: zoneName
        };
      });
      
      if (existingZones.length > 0) {
        setZones(existingZones);
      }
    }
  }, [items, zones.length]);

  const handleAddItem = () => {
    if (!newItemText.trim()) return
    if (zones.length === 0) {
      toast.error("Please create at least one destination zone first")
      return
    }

    const newItem: DragItem = {
      id: crypto.randomUUID(),
      text: newItemText,
      correctZone: zones[0]?.id || "",
      order: items.length
    }

    // Guardar el nombre de la zona en el mapa local y global
    if (zones[0]) {
      zoneNamesMap[zones[0].id] = zones[0].name;
      if (typeof window !== 'undefined') {
        window._dragAndDropZoneNames = window._dragAndDropZoneNames || {};
        window._dragAndDropZoneNames[zones[0].id] = zones[0].name;
      }
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
    const selectedZone = zones.find(z => z.id === zoneId);
    if (selectedZone) {
      // Guardar en mapa local
      zoneNamesMap[zoneId] = selectedZone.name;
      
      // Guardar en variable global
      if (typeof window !== 'undefined') {
        window._dragAndDropZoneNames = window._dragAndDropZoneNames || {};
        window._dragAndDropZoneNames[zoneId] = selectedZone.name;
      }
    }
    
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

    const updatedZones = [...zones, newZone];
    setZones(updatedZones)
    setNewZoneName("")
    
    // Guardar el nombre de la zona en el mapa local y global
    zoneNamesMap[newZone.id] = newZone.name;
    
    if (typeof window !== 'undefined') {
      window._dragAndDropZoneNames = window._dragAndDropZoneNames || {};
      window._dragAndDropZoneNames[newZone.id] = newZone.name;
      console.log("Added zone to global map:", window._dragAndDropZoneNames);
    }
    
    // Actualizar los items para que tengan la referencia a la nueva zona si no tienen ninguna
    if (zones.length === 0) {
      onChange(
        items.map(item => ({
          ...item,
          correctZone: item.correctZone || newZone.id
        }))
      )
    }
  }

  const handleUpdateZoneName = (zoneId: string, newName: string) => {
    const updatedZones = zones.map(zone => 
      zone.id === zoneId ? { ...zone, name: newName } : zone
    );
    
    setZones(updatedZones);
    
    // Actualizar el nombre en el mapa local y global
    zoneNamesMap[zoneId] = newName;
    
    if (typeof window !== 'undefined') {
      window._dragAndDropZoneNames = window._dragAndDropZoneNames || {};
      window._dragAndDropZoneNames[zoneId] = newName;
      console.log("Updated zone name in global map:", window._dragAndDropZoneNames);
    }
  }

  const handleDeleteZone = (zoneId: string) => {
    // No permitir eliminar la última zona si hay elementos
    if (zones.length <= 1 && items.length > 0) {
      toast.error("Cannot delete the last zone when there are items. Create a new zone first.")
      return
    }
    
    const remainingZones = zones.filter(zone => zone.id !== zoneId);
    setZones(remainingZones)
    
    // Eliminar del mapa local
    delete zoneNamesMap[zoneId];
    
    // Eliminar de la variable global
    if (typeof window !== 'undefined' && window._dragAndDropZoneNames) {
      delete window._dragAndDropZoneNames[zoneId];
      console.log("Deleted zone from global map:", window._dragAndDropZoneNames);
    }
    
    // Determinar a qué zona mover los elementos de la zona eliminada
    const fallbackZone = remainingZones[0];
    
    // Actualizar los items que tenían esta zona como correcta
    if (fallbackZone) {
      onChange(
        items.map(item =>
          item.correctZone === zoneId
            ? { ...item, correctZone: fallbackZone.id }
            : item
        )
      )
    }
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

        {zones.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground">
              No destination zones defined.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add at least one zone where items can be dropped.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="flex items-center gap-2 bg-card p-2 rounded-lg border"
              >
                <Target className="h-4 w-4 text-muted-foreground" />
                <Input
                  className="flex-1 h-7 text-sm"
                  value={zone.name}
                  onChange={(e) => handleUpdateZoneName(zone.id, e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteZone(zone.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
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
            disabled={zones.length === 0}
          />
          <Button
            onClick={handleAddItem}
            variant="outline"
            size="icon"
            disabled={zones.length === 0}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {zones.length === 0 && (
          <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm">
              Please create at least one destination zone before adding items.
            </p>
          </div>
        )}

        {zones.length > 0 && items.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground">
              No draggable elements.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add elements that users will drag to their correct zones.
            </p>
          </div>
        )}

        {items.length > 0 && (
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
        )}
      </div>
    </div>
  )
}
