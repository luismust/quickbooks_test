"use client"

import { motion } from "framer-motion"
import { FileSpreadsheet, MousePointerClick, PenTool, ImageIcon, SplitSquareVertical } from "lucide-react"

export const FloatingEditorIcons = () => {
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
    }
  ]

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
    </div>
  )
} 