"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

interface Point {
  id: string
  text: string
  type: 'left' | 'right'
  correctMatch?: string
}

interface PointAPointProps {
  points: Point[]
  onSelect: (pointId: string, connection?: {start: string, end: string}) => void
  isAnswered?: boolean
  selectedPoint?: string
  existingConnections?: {start: string, end: string}[]
  className?: string
}

export function PointAPoint({
  points,
  onSelect,
  isAnswered = false,
  selectedPoint,
  existingConnections = [],
  className
}: PointAPointProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [connections, setConnections] = useState<{start: string, end: string}[]>(existingConnections)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const drawConnections = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    connections.forEach(conn => {
      const start = document.getElementById(conn.start)
      const end = document.getElementById(conn.end)

      if (start && end) {
        const startRect = start.getBoundingClientRect()
        const endRect = end.getBoundingClientRect()
        const canvasRect = canvas.getBoundingClientRect()

        const startX = startRect.right - canvasRect.left
        const startY = startRect.top + startRect.height/2 - canvasRect.top
        const endX = endRect.left - canvasRect.left
        const endY = endRect.top + endRect.height/2 - canvasRect.top

        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.strokeStyle = isAnswered ? '#22c55e' : '#0ea5e9'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    })
  }, [connections, isAnswered])

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      canvas.width = container.offsetWidth
      canvas.height = container.offsetHeight
      drawConnections()
    }

    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [drawConnections])

  useEffect(() => {
    drawConnections()
  }, [drawConnections])

  const handlePointClick = (pointId: string) => {
    if (isAnswered) return
    
    const clickedPoint = points.find(p => p.id === pointId)
    if (!clickedPoint) return

    // Permitir múltiples conexiones, solo verificar que no exista la misma conexión
    if (!selected) {
      setSelected(pointId)
    } else {
      const selectedPointData = points.find(p => p.id === selected)
      
      if (selectedPointData?.type === clickedPoint.type) {
        setSelected(pointId)
        return
      }

      let startPoint, endPoint
      if (selectedPointData?.type === 'left') {
        startPoint = selected
        endPoint = pointId
      } else {
        startPoint = pointId
        endPoint = selected
      }

      // Verificar si esta conexión específica ya existe
      const connectionExists = connections.some(
        conn => (conn.start === startPoint && conn.end === endPoint) ||
               (conn.start === endPoint && conn.end === startPoint)
      )

      if (!connectionExists) {
        const newConnection = {
          start: startPoint,
          end: endPoint
        }

        setConnections(prev => [...prev, newConnection])
        onSelect(endPoint, newConnection)
      }

      setSelected(null)
    }
  }

  const leftPoints = points.filter(p => p.type === 'left')
  const rightPoints = points.filter(p => p.type === 'right')

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      <div className="grid grid-cols-2 gap-8">
        {/* Columna izquierda */}
        <div className="space-y-4">
          {leftPoints.map((point) => (
            <div
              key={point.id}
              id={point.id}
              onClick={() => handlePointClick(point.id)}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-colors",
                selected === point.id && "border-blue-500 bg-blue-50",
                connections.some(c => c.start === point.id || c.end === point.id) && 
                  (isAnswered ? "border-green-500 bg-green-50" : "border-blue-500 bg-blue-50"),
                !selected && !connections.some(c => c.start === point.id || c.end === point.id) && 
                  "hover:border-blue-200"
              )}
            >
              {point.text}
            </div>
          ))}
        </div>

        {/* Columna derecha */}
        <div className="space-y-4">
          {rightPoints.map((point) => (
            <div
              key={point.id}
              id={point.id}
              onClick={() => handlePointClick(point.id)}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-colors",
                selected === point.id && "border-blue-500 bg-blue-50",
                connections.some(c => c.start === point.id || c.end === point.id) && 
                  (isAnswered ? "border-green-500 bg-green-50" : "border-blue-500 bg-blue-50"),
                !selected && !connections.some(c => c.start === point.id || c.end === point.id) && 
                  "hover:border-blue-200"
              )}
            >
              {point.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
