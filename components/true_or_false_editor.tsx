"use client"

import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface TrueOrFalseEditorProps {
  question: string
  answer: boolean
  onChange: (data: { question: string; answer: boolean }) => void
}

export function TrueOrFalseEditor({ question, answer, onChange }: TrueOrFalseEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Question
        </label>
        <Input
          placeholder="Write the question..."
          value={question}
          onChange={(e) => onChange({ question: e.target.value, answer })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          Correct answer
        </label>
        <RadioGroup
          value={answer.toString()}
          onValueChange={(value) => onChange({ question, answer: value === "true" })}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true" id="true" />
            <Label htmlFor="true">True</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="false" id="false" />
            <Label htmlFor="false">False</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  )
} 