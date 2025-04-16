"use client"

import { useState } from "react"
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && onClose) {
        onClose();
      }
    }}>
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
            <Button type="submit" className="w-full">
              Start Test
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 