"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UserNameDialogProps {
  isOpen: boolean
  onSubmit: (name: string) => void
  testName: string
  onClose?: () => void
}

export function UserNameDialog({
  isOpen,
  onSubmit,
  testName,
  onClose
}: UserNameDialogProps) {
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  // Para depuración - registramos cuando se monta, actualiza y desmonta el componente
  useEffect(() => {
    console.log("UserNameDialog mounted/updated, isOpen:", isOpen);
    console.log("onClose function exists:", !!onClose);
    
    return () => {
      console.log("UserNameDialog unmounted");
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError("Please enter your name")
      return
    }
    
    if (name.trim().length < 3) {
      setError("The name must have at least 3 characters")
      return
    }
    
    onSubmit(name.trim())
  }

  const handleClose = () => {
    console.log("Cancel button clicked, calling onClose");
    // Navegar directamente usando window.location.href
    if (typeof window !== 'undefined') {
      window.location.href = '/tests';
      return;
    }
    
    // Como plan B, intentar usar onClose
    if (onClose) {
      onClose();
    } else {
      console.warn("onClose is not defined and window is not available");
    }
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        console.log("Dialog onOpenChange triggered, open:", open);
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl">Welcome to the test</DialogTitle>
            <DialogDescription>
              Please enter your name before starting "{testName}".
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError("")
              }}
              placeholder="Eg. Joe Dean"
              className={error ? "border-red-500" : ""}
              autoFocus
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          
          <DialogFooter className="mt-6">
            <div className="flex gap-2 w-full">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose} 
                className="flex-1"
              >
                Back to Tests
              </Button>
              <Button type="submit" className="flex-1">
                Start Test
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 