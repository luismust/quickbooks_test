"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trophy, XCircle } from "lucide-react"

interface ResultsDialogProps {
  isOpen: boolean
  onClose: () => void
  score: number
  maxScore: number
  minScore: number
  passingMessage: string
  failingMessage: string
}

export function ResultsDialog({
  isOpen,
  onClose,
  score,
  maxScore,
  minScore,
  passingMessage,
  failingMessage,
}: ResultsDialogProps) {
  const passed = score >= minScore

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {passed ? "Congratulations!" : "Test completed"}
          </DialogTitle>
          <DialogDescription className="text-center space-y-4">
            <div className="flex justify-center py-4">
              {passed ? (
                <Trophy className="h-16 w-16 text-yellow-500" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500" />
              )}
            </div>
            <div className="text-xl font-semibold">
              Final score: {score} / {maxScore}
            </div>
            <p className="text-muted-foreground">
              {passed ? passingMessage : failingMessage}
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 