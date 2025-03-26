"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { motion, Reorder } from "framer-motion"
import { cn } from "@/lib/utils"

interface Option {
  id: string
  text: string
  isCorrect: boolean
}

interface MultipleChoiceEditorProps {
  options: Option[]
  onChange: (options: Option[]) => void
}

export function MultipleChoiceEditor({ options, onChange }: MultipleChoiceEditorProps) {
  const [newOptionText, setNewOptionText] = useState("")

  const handleAddOption = () => {
    if (!newOptionText.trim()) return

    const newOption: Option = {
      id: Date.now().toString(),
      text: newOptionText,
      isCorrect: false
    }

    onChange([...options, newOption])
    setNewOptionText("")
  }

  const handleDeleteOption = (id: string) => {
    onChange(options.filter(option => option.id !== id))
  }

  const handleToggleCorrect = (id: string) => {
    onChange(
      options.map(option => 
        option.id === id 
          ? { ...option, isCorrect: !option.isCorrect }
          : option
      )
    )
  }

  const handleUpdateText = (id: string, text: string) => {
    onChange(
      options.map(option =>
        option.id === id
          ? { ...option, text }
          : option
      )
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="New option..."
          value={newOptionText}
          onChange={(e) => setNewOptionText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAddOption()
            }
          }}
        />
        <Button
          onClick={handleAddOption}
          variant="outline"
          size="icon"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Reorder.Group
        axis="y"
        values={options}
        onReorder={onChange}
        className="space-y-2"
      >
        {options.map((option) => (
          <Reorder.Item
            key={option.id}
            value={option}
            className="flex items-center gap-2 bg-card p-2 rounded-lg border"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            <Checkbox
              checked={option.isCorrect}
              onCheckedChange={() => handleToggleCorrect(option.id)}
            />
            <Input
              value={option.text}
              onChange={(e) => handleUpdateText(option.id, e.target.value)}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteOption(option.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {options.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No options. Add some options for the question.
        </p>
      )}
    </div>
  )
}

  // Component separated for viewing
export function MultipleChoice({ options, onSelect, isAnswered = false }: {
  options: Option[]
  onSelect: (optionId: string) => void
  isAnswered?: boolean
}) {
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (optionId: string) => {
    if (isAnswered) return
    setSelected(optionId)
    onSelect(optionId)
  }

  return (
    <div className="space-y-4">
      {options.map((option) => (
        <Button
          key={option.id}
          variant={selected === option.id ? "default" : "outline"}
          onClick={() => handleSelect(option.id)}
          disabled={isAnswered}
          className={`
            w-full justify-start text-left
            ${isAnswered && option.isCorrect && "bg-green-500 hover:bg-green-500"}
            ${isAnswered && selected === option.id && !option.isCorrect && "bg-red-500 hover:bg-red-500"}
          `}
        >
          {option.text}
        </Button>
      ))}
    </div>
  )
}
