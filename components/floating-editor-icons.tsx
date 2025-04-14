"use client"

import { motion } from "framer-motion"
import { 
  FileSpreadsheet, 
  MousePointerClick, 
  PenTool, 
  ImageIcon, 
  SplitSquareVertical,
  Pencil,
  FileText,
  CheckSquare,
  Layout,
  Layers,
  Copy,
  Scissors,
  Move,
  ZoomIn,
  Edit,
  Save,
  Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Test } from "@/lib/test-storage"

interface FloatingEditorIconsProps {
  isDrawing: boolean
  onToggleDrawing: () => void
  onSave: () => void
  isSaving?: boolean
  test: Test
}

export function FloatingEditorIcons({ 
  isDrawing, 
  onToggleDrawing, 
  onSave, 
  isSaving,
  test 
}: FloatingEditorIconsProps) {
  const icons = [
    {
      icon: <FileSpreadsheet className="h-6 w-6 text-blue-500/50" />,
      position: { top: "10%", left: "5%" },
      animation: {
        y: [0, 15, 0],
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
      }
    },
    {
      icon: <MousePointerClick className="h-6 w-6 text-green-500/50" />,
      position: { top: "20%", right: "10%" },
      animation: {
        y: [0, -15, 0],
        transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
      }
    },
    {
      icon: <PenTool className="h-6 w-6 text-purple-500/50" />,
      position: { bottom: "30%", left: "8%" },
      animation: {
        y: [0, 20, 0],
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }
      }
    },
    {
      icon: <ImageIcon className="h-6 w-6 text-indigo-500/50" />,
      position: { bottom: "15%", right: "5%" },
      animation: {
        y: [0, -20, 0],
        transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }
      }
    },
    {
      icon: <SplitSquareVertical className="h-6 w-6 text-rose-500/50" />,
      position: { top: "40%", right: "15%" },
      animation: {
        y: [0, 15, 0],
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }
      }
    },
    {
      icon: <Pencil className="h-6 w-6 text-yellow-500/50" />,
      position: { top: "25%", left: "15%" },
      animation: {
        y: [0, -18, 0],
        transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.7 }
      }
    },
    {
      icon: <FileText className="h-6 w-6 text-cyan-500/50" />,
      position: { bottom: "25%", right: "12%" },
      animation: {
        y: [0, 18, 0],
        transition: { duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }
      }
    },
    {
      icon: <CheckSquare className="h-6 w-6 text-emerald-500/50" />,
      position: { top: "35%", left: "12%" },
      animation: {
        y: [0, -22, 0],
        transition: { duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1.8 }
      }
    },
    {
      icon: <Layout className="h-6 w-6 text-orange-500/50" />,
      position: { bottom: "40%", right: "8%" },
      animation: {
        y: [0, 22, 0],
        transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 2.2 }
      }
    },
    {
      icon: <Layers className="h-6 w-6 text-pink-500/50" />,
      position: { top: "15%", right: "20%" },
      animation: {
        y: [0, -16, 0],
        transition: { duration: 3.3, repeat: Infinity, ease: "easeInOut", delay: 1.6 }
      }
    },
    {
      icon: <Copy className="h-6 w-6 text-violet-500/50" />,
      position: { bottom: "20%", left: "18%" },
      animation: {
        y: [0, 16, 0],
        transition: { duration: 3.7, repeat: Infinity, ease: "easeInOut", delay: 0.9 }
      }
    },
    {
      icon: <Scissors className="h-6 w-6 text-red-500/50" />,
      position: { top: "45%", left: "20%" },
      animation: {
        y: [0, -20, 0],
        transition: { duration: 4.1, repeat: Infinity, ease: "easeInOut", delay: 1.4 }
      }
    },
    {
      icon: <Move className="h-6 w-6 text-teal-500/50" />,
      position: { bottom: "35%", right: "15%" },
      animation: {
        y: [0, 20, 0],
        transition: { duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: 2.1 }
      }
    },
    {
      icon: <ZoomIn className="h-6 w-6 text-blue-400/50" />,
      position: { top: "30%", right: "22%" },
      animation: {
        y: [0, -18, 0],
        transition: { duration: 3.9, repeat: Infinity, ease: "easeInOut", delay: 1.7 }
      }
    },
    {
      icon: <Edit className="h-6 w-6 text-lime-500/50" />,
      position: { bottom: "45%", left: "22%" },
      animation: {
        y: [0, 18, 0],
        transition: { duration: 3.1, repeat: Infinity, ease: "easeInOut", delay: 1.3 }
      }
    }
  ]

  const handleDownload = () => {
    // Crear un objeto blob con el contenido JSON
    const jsonString = JSON.stringify(test, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    
    // Crear una URL para el blob
    const url = URL.createObjectURL(blob)
    
    // Crear un elemento <a> temporal
    const link = document.createElement('a')
    link.href = url
    link.download = `${test.name || 'test'}.json`
    
    // Simular click para descargar
    document.body.appendChild(link)
    link.click()
    
    // Limpiar
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 pointer-events-none">
      {icons.map((item, index) => (
        <motion.div
          key={index}
          className="absolute"
          style={item.position}
          animate={item.animation}
        >
          {item.icon}
        </motion.div>
      ))}
      <div className="fixed bottom-4 right-4 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleDrawing}
          className={cn(
            "bg-white hover:bg-gray-100",
            isDrawing && "bg-blue-100 text-blue-600 hover:bg-blue-200"
          )}
        >
          <Pencil className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleDownload}
          className="bg-white hover:bg-gray-100"
        >
          <Download className="h-4 w-4" />
        </Button>

        <Button
          onClick={onSave}
          disabled={isSaving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
} 