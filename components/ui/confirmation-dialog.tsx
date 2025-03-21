import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"
import { Check, AlertCircle } from "lucide-react"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
  type?: "success" | "warning"
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  type = "warning"
}: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "success" ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {type === "warning" ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={onConfirm} variant="destructive">
                Confirmar
              </Button>
            </>
          ) : (
            <Button onClick={onConfirm} variant="default">
              Aceptar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 