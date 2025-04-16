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

// Mapa global donde editor puede guardar los nombres de las zonas
declare global {
  interface Window {
    _dragAndDropZoneNames?: Record<string, string>;
  }
}

// Verificar si estamos en el navegador y crear el objeto si no existe
if (typeof window !== 'undefined') {
  window._dragAndDropZoneNames = window._dragAndDropZoneNames || {};
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
    
    // Agrupar items por zona para detectar patrones
    const itemsByZone: Record<string, DragItem[]> = {};
    items.forEach(item => {
      if (!itemsByZone[item.correctZone]) {
        itemsByZone[item.correctZone] = [];
      }
      itemsByZone[item.correctZone].push(item);
    });
    
    // Intentar determinar nombres de zona basados en los elementos
    const zoneNames: Record<string, string> = {};
    
    // 1. Primero verificar si hay nombres guardados en la variable global
    if (typeof window !== 'undefined' && window._dragAndDropZoneNames) {
      Object.keys(window._dragAndDropZoneNames).forEach(zoneId => {
        if (uniqueZoneIds.includes(zoneId)) {
          zoneNames[zoneId] = window._dragAndDropZoneNames?.[zoneId] || '';
        }
      });
    }
    
    // 2. Categorizar items por zona para inferir sus nombres
    uniqueZoneIds.forEach((zoneId, index) => {
      // Si ya tenemos un nombre de la variable global, usarlo
      if (zoneNames[zoneId]) return;
      
      const itemsInZone = itemsByZone[zoneId] || [];
      
      // Intentar inferir categoría por contenido
      if (itemsInZone.length > 0) {
        // Lista de categorías comunes y palabras clave asociadas
        const categories = [
          { name: "Software", keywords: ["excel", "word", "windows", "office", "powerpoint", "software", "program", "app"] },
          { name: "Hardware", keywords: ["mouse", "keyboard", "monitor", "printer", "hardware", "device"] },
          { name: "OS", keywords: ["windows", "linux", "macos", "ubuntu", "android", "ios"] },
          { name: "Peripherals", keywords: ["mouse", "keyboard", "monitor", "printer", "scanner", "speaker", "headphone"] }
        ];
        
        // Buscar coincidencias de categorías en los elementos de esta zona
        let bestCategory = null;
        let maxMatches = 0;
        
        categories.forEach(category => {
          let matches = 0;
          itemsInZone.forEach(item => {
            const lowercaseText = item.text.toLowerCase();
            category.keywords.forEach(keyword => {
              if (lowercaseText.includes(keyword.toLowerCase())) {
                matches++;
              }
            });
          });
          
          if (matches > maxMatches) {
            maxMatches = matches;
            bestCategory = category.name;
          }
        });
        
        if (bestCategory && maxMatches >= 1) {
          zoneNames[zoneId] = bestCategory;
        } else {
          // Si no hay coincidencias, usar nombres genéricos pero más descriptivos
          if (index === 0) {
            zoneNames[zoneId] = "Software";
          } else if (index === 1) {
            zoneNames[zoneId] = "Hardware";
          } else {
            zoneNames[zoneId] = `Group ${index + 1}`;
          }
        }
      } else {
        zoneNames[zoneId] = `Group ${index + 1}`;
      }
    });
    
    // Crear zonas con los nombres determinados
    const initialZones = uniqueZoneIds.map((zoneId) => ({
      id: zoneId,
      name: zoneNames[zoneId] || `Group ${uniqueZoneIds.indexOf(zoneId) + 1}`,
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
    
    // Debug: guardar los nombres detectados en la consola
    console.log("Zone names detected:", zoneNames);
    console.log("Unique zone IDs:", uniqueZoneIds);
    console.log("Global zone names:", window._dragAndDropZoneNames);
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