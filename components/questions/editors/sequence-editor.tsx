"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, GripVertical, ArrowDown } from "lucide-react"
import { motion, Reorder } from "framer-motion"

interface SequenceItem {
  id: string
  text: string
  order: number
}

interface SequenceEditorProps {
  question: string
  answer: SequenceItem[]
  onChange: (question: string, answer: SequenceItem[]) => void
  isEditMode: boolean
}

export function SequenceEditor({ question, answer, onChange, isEditMode = true }: SequenceEditorProps) {
  const [newItemText, setNewItemText] = useState("")

  if (!isEditMode) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">This component should only be used in edit mode</p>
        <p className="text-xs text-muted-foreground">Use the sequence viewer component for testing</p>
      </div>
    )
  }

  const handleAddItem = () => {
    if (!newItemText.trim()) return

    const newItem: SequenceItem = {
      id: crypto.randomUUID(),
      text: newItemText,
      order: answer.length // New item goes at the end
    }

    onChange(question, [...answer, newItem])
    setNewItemText("")
  }

  const handleDeleteItem = (id: string) => {
    const updatedSequence = answer
      .filter(item => item.id !== id)
      .map((item, index) => ({ ...item, order: index }))
    onChange(question, updatedSequence)
  }

  const handleUpdateText = (id: string, text: string) => {
    onChange(
      question,
      answer.map(item =>
        item.id === id
          ? { ...item, text }
          : item
      )
    )
  }

  const handleReorder = (reorderedItems: SequenceItem[]) => {
    // Update order after reordering
    const updatedSequence = reorderedItems.map((item, index) => ({
      ...item,
      order: index
    }))
    onChange(question, updatedSequence)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Elements of the sequence</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowDown className="h-4 w-4" />
            <span>Drag to order</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="New element of the sequence..."
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
          values={answer}
          onReorder={handleReorder}
          className="space-y-2"
        >
          {answer.map((item) => (
            <Reorder.Item
              key={item.id}
              value={item}
              className="flex items-center gap-2 bg-card p-2 rounded-lg border group"
            >
              <div className="flex items-center gap-2 bg-muted px-2 py-1 rounded text-sm">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                <span className="font-mono">{item.order + 1}</span>
              </div>
              
              <Input
                value={item.text}
                onChange={(e) => handleUpdateText(item.id, e.target.value)}
                className="flex-1"
              />
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {answer.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground">
              No elements in the sequence.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add elements and drag them to order them in the correct sequence.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
