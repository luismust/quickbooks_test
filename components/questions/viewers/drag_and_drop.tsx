"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DragControls, motion, Reorder, useDragControls } from "framer-motion"
import { DragItem } from "@/lib/test-storage"
import { GripVertical, Check, X } from "lucide-react"
import { toast } from "sonner"

interface Zone {
  id: string
  name: string
  items: DragItem[]
}

interface DragAndDropProps {
  items?: DragItem[]
  onAnswer?: (isCorrect: boolean) => void
  isAnswered?: boolean
}

export function DragAndDrop({ 
  items = [], 
  onAnswer, 
  isAnswered = false
}: DragAndDropProps) {
  // Extraer zonas únicas de los items
  const [zones, setZones] = useState<Zone[]>([])
  const [draggableItems, setDraggableItems] = useState<DragItem[]>([])
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  
  // Inicializar el estado en el primer render
  useEffect(() => {
    if (items.length === 0) return
    
    // Obtener todas las zonas únicas
    const uniqueZoneIds = Array.from(new Set(items.map(item => item.correctZone)))
    
    // Crear un mapa de nombres de zonas (usando el primer elemento como referencia para cada zona)
    const zoneNames: Record<string, string> = {};
    
    items.forEach(item => {
      if (item.correctZone && !zoneNames[item.correctZone]) {
        // Buscar un elemento que tenga esta zona como correcta para extraer su nombre
        const matchingItem = items.find(i => i.correctZone === item.correctZone);
        if (matchingItem) {
          // Intentar extraer un nombre descriptivo de la zona desde el item o el ID
          // Por ejemplo, si hay un pattern "zone:nombre" o simplemente usar el ID como nombre
          zoneNames[item.correctZone] = item.correctZone.includes(':') 
            ? item.correctZone.split(':')[1] 
            : `Zone ${Object.keys(zoneNames).length + 1}`;
        }
      }
    });
    
    // Crear zonas con nombres obtenidos o genéricos si no existen
    const initialZones = uniqueZoneIds.map((zoneId) => ({
      id: zoneId,
      name: zoneNames[zoneId] || `Zone ${uniqueZoneIds.indexOf(zoneId) + 1}`,
      items: [] as DragItem[]
    }));
    
    // Añadir una zona para items sin asignar
    const unassignedZone = {
      id: "unassigned",
      name: "Items to classify",
      items: [...items] // Todos los items comienzan sin asignar
    }
    
    setZones([unassignedZone, ...initialZones])
    setDraggableItems([...items])
  }, [items])
  
  const moveItemToZone = (itemId: string, targetZoneId: string) => {
    if (isAnswered || hasSubmitted) return
    
    const updatedZones = zones.map(zone => {
      // Eliminar el item de su zona actual
      const updatedItems = zone.items.filter(item => item.id !== itemId)
      
      // Si esta es la zona destino, agregar el item
      if (zone.id === targetZoneId) {
        const item = draggableItems.find(i => i.id === itemId)
        if (item) {
          return {
            ...zone,
            items: [...updatedItems, item]
          }
        }
      }
      
      return {
        ...zone,
        items: updatedItems
      }
    })
    
    setZones(updatedZones)
  }
  
  // Verificar si todas las respuestas son correctas
  const checkAnswers = () => {
    // Verificar que todos los items estén asignados y en la zona correcta
    let allCorrect = true
    let allAssigned = true
    
    // Verificar si hay items sin asignar
    const unassignedZone = zones.find(zone => zone.id === "unassigned")
    if (unassignedZone && unassignedZone.items.length > 0) {
      allAssigned = false
    }
    
    // Verificar si cada item está en su zona correcta
    zones.forEach(zone => {
      if (zone.id !== "unassigned") {
        zone.items.forEach(item => {
          if (item.correctZone !== zone.id) {
            allCorrect = false
          }
        })
      }
    })
    
    // No permitir enviar si no todos están asignados
    if (!allAssigned) {
      toast.error("You must classify all items")
      return
    }
    
    setHasSubmitted(true)
    setIsCorrect(allCorrect)
    
    // Notificar al componente padre
    if (onAnswer) {
      onAnswer(allCorrect)
    }
    
    // Mostrar feedback
    if (allCorrect) {
      toast.success("Correct! All items are in their right places.")
    } else {
      toast.error("Some items are not in their correct zones.")
    }
  }
  
  // Si no hay items, mostrar placeholder
  if (items.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">No items to drag and drop</p>
      </div>
    )
  }
  
  // Función auxiliar para renderizar los items arrastrables
  const renderDraggableItem = (item: DragItem, zoneId: string) => (
    <div 
      key={item.id}
      className={`flex items-center p-2 border rounded-md cursor-move 
        ${hasSubmitted 
          ? item.correctZone === zoneId 
            ? "bg-green-100 border-green-300" 
            : "bg-red-100 border-red-300"
          : "bg-white"}
      `}
      draggable={!hasSubmitted && !isAnswered}
      onDragStart={(e) => {
        if (hasSubmitted || isAnswered) {
          e.preventDefault()
          return
        }
        e.dataTransfer.setData("itemId", item.id)
      }}
    >
      <GripVertical className="h-4 w-4 mr-2 text-gray-400" />
      <span className="flex-1">{item.text}</span>
      
      {/* Mostrar indicador de correcto/incorrecto después de enviar */}
      {hasSubmitted && (
        item.correctZone === zoneId ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <X className="h-4 w-4 text-red-600" />
        )
      )}
    </div>
  )
  
  // Separar la zona de origen y las zonas de destino
  const sourceZone = zones.find(zone => zone.id === "unassigned");
  const targetZones = zones.filter(zone => zone.id !== "unassigned");
  
  return (
    <div className="space-y-6">
      {/* Zona de origen con items por clasificar */}
      {sourceZone && (
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-2">{sourceZone.name}</h3>
          
          <div 
            className="min-h-[100px] border-2 border-dashed border-gray-200 rounded-md p-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const itemId = e.dataTransfer.getData("itemId")
              moveItemToZone(itemId, sourceZone.id)
            }}
          >
            {sourceZone.items.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                All items have been classified
              </p>
            ) : (
              <div className="space-y-2">
                {sourceZone.items.map(item => 
                  renderDraggableItem(item, sourceZone.id)
                )}
              </div>
            )}
          </div>
        </Card>
      )}
      
      {/* Zonas de destino */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {targetZones.map(zone => (
          <Card key={zone.id} className="p-4">
            <h3 className="text-sm font-medium mb-2">{zone.name}</h3>
            
            <div 
              className={`min-h-[120px] border-2 rounded-md p-2 ${
                hasSubmitted 
                  ? isCorrect 
                    ? "border-green-200 bg-green-50" 
                    : "border-red-200 bg-red-50"
                  : "border-dashed border-gray-200"
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const itemId = e.dataTransfer.getData("itemId")
                moveItemToZone(itemId, zone.id)
              }}
            >
              {zone.items.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Drop items here
                </p>
              ) : (
                <div className="space-y-2">
                  {zone.items.map(item => 
                    renderDraggableItem(item, zone.id)
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
      
      {!hasSubmitted && !isAnswered && (
        <div className="flex justify-end">
          <Button onClick={checkAnswers}>Submit Answer</Button>
        </div>
      )}
      
      {hasSubmitted && !isCorrect && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm font-medium">Answer Key:</p>
          <ul className="mt-2 space-y-1">
            {items.map(item => {
              const correctZone = zones.find(z => z.id === item.correctZone)
              return (
                <li key={item.id} className="text-sm">
                  <span className="font-medium">{item.text}</span>: {correctZone?.name || "Unknown zone"}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
} 