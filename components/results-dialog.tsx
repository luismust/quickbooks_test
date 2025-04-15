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
import { toast } from "sonner"

interface ResultsDialogProps {
  isOpen: boolean
  onClose: () => void
  score: number
  maxScore: number
  minScore: number
  passingMessage: string
  failingMessage: string
  testName: string
  userName: string
}

export function ResultsDialog({
  isOpen,
  onClose,
  score,
  maxScore,
  minScore,
  passingMessage,
  failingMessage,
  testName,
  userName
}: ResultsDialogProps) {
  const passed = score >= minScore
  
  const saveTestResult = async () => {
    try {
      // URL del backend existente
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quickbooks-backend.vercel.app/api';
      
      // Datos a enviar
      const resultData = {
        name: userName,
        test: testName,
        score: `${score}/${maxScore}`,
        status: passed ? "Passed" : "Failed",
        date: new Date().toISOString()
      };
      
      console.log('Saving test result to backend:', resultData);
      
      // Enviar a la API del backend existente
      const response = await fetch(`${API_URL}/test-results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': typeof window !== 'undefined' ? window.location.origin : 'https://tests-system.vercel.app'
        },
        body: JSON.stringify(resultData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to save result: ${errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Test result saved successfully:', result);
      toast.success("El resultado del test ha sido guardado");
      
      // Cerrar el diálogo después de guardar
      onClose();
    } catch (error) {
      console.error('Error saving test result:', error);
      toast.error("Error al guardar el resultado del test");
      
      // Cerrar el diálogo de todas formas
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {passed ? "Congratulations!" : "Test completed"}
          </DialogTitle>
          <div className="text-sm text-muted-foreground text-center space-y-4">
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
            <div className="text-muted-foreground">
              {passed ? passingMessage : failingMessage}
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button 
            onClick={saveTestResult}
            className="w-full"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 