"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface PhraseCompleteEditorProps {
  question: string
  answer: string
  onChange: (data: { question: string; answer: string }) => void
}

export function PhraseCompleteEditor({ 
  question, 
  answer, 
  onChange 
}: PhraseCompleteEditorProps) {
  // Render preview with highlighted blanks
  const renderPreview = () => {
    if (!question) return "";
    
    const highlighted = question.replace(
      /___/g, 
      '<span class="bg-primary/20 text-primary px-2 py-0.5 rounded font-medium">___</span>'
    );
    return highlighted;
  };

  const handleQuestionChange = (newQuestion: string) => {
    onChange({
      question: newQuestion,
      answer
    });
  };

  const handleAnswerChange = (newAnswer: string) => {
    onChange({
      question,
      answer: newAnswer
    });
  };

  const validateQuestion = () => {
    if (!question.includes('___')) {
      toast.warning("Your phrase doesn't contain any blanks. Add '___' (three underscores) to mark where students should complete the phrase.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-2">
            Phrase with blanks
          </Label>
          <Textarea
            placeholder="Write a phrase and use ___ (three underscores) where the student should fill in the blank..."
            value={question}
            onChange={(e) => handleQuestionChange(e.target.value)}
            onBlur={validateQuestion}
            className="min-h-[100px] mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Example: The capital of France is ___.
          </p>
        </div>

        {question && (
          <div className="mt-4 p-4 border rounded-md bg-muted/30">
            <Label className="text-sm font-medium mb-2">
              Preview
            </Label>
            <div 
              className="text-sm mt-1"
              dangerouslySetInnerHTML={{ __html: renderPreview() }}
            />
          </div>
        )}

        <div className="mt-4">
          <Label className="text-sm font-medium mb-2">
            Correct answer
          </Label>
          <Input
            placeholder="Write the word or phrase that correctly fills in the blank..."
            value={answer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            The expected answer that should replace the blank (___).
          </p>
        </div>
      </div>

      <Card className="p-4 bg-muted border-dashed mt-6">
        <h3 className="text-sm font-medium mb-2">About Phrase Completion</h3>
        <p className="text-sm text-muted-foreground">
          Phrase completion questions ask students to fill in missing words in a sentence or paragraph.
          Use three underscores (___) to mark where students should provide their answer.
          Currently this question type supports a single blank space.
        </p>
      </Card>
    </div>
  )
} 