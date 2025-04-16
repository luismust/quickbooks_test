"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

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
    if (onClose) {
      onClose();
    }
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogClose 
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
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
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
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