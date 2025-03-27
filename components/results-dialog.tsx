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
import { Trophy, XCircle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

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
  const router = useRouter()
  const passed = score >= minScore
  const percentage = (score / maxScore) * 100

  const handleClose = () => {
    onClose()
    router.push("/")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">
            Resultados del Test
          </DialogTitle>
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              {passed ? (
                <CheckCircle className="h-12 w-12 text-green-500" />
              ) : (
                <XCircle className="h-12 w-12 text-red-500" />
              )}
            </div>
            <div>
              <div className="text-2xl font-bold">
                {score} / {maxScore}
              </div>
              <div className="text-sm text-muted-foreground">
                {passed ? passingMessage : failingMessage}
              </div>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 