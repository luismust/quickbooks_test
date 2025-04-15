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
}

export function UserNameDialog({
  isOpen,
  onSubmit,
  testName
}: UserNameDialogProps) {
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError("Por favor ingresa tu nombre")
      return
    }
    
    if (name.trim().length < 3) {
      setError("El nombre debe tener al menos 3 caracteres")
      return
    }
    
    onSubmit(name.trim())
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl">Bienvenido a la prueba</DialogTitle>
            <DialogDescription>
              Por favor, ingresa tu nombre antes de comenzar "{testName}".
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError("")
              }}
              placeholder="Ej. Juan Pérez"
              className={error ? "border-red-500" : ""}
              autoFocus
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="submit" className="w-full">
              Comenzar Prueba
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 