"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TestViewer } from "@/components/test-viewer"
import { ChevronLeft, Plus, Trash2 } from "lucide-react"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import { useRouter } from "next/navigation"
import type { Test } from "@/lib/test-storage"
import { toast } from "@/components/ui/use-toast"

export default function TestsPage() {
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [tests, setTests] = useLocalStorage<Test[]>('saved-tests', [])
  const router = useRouter()

  const handleDelete = async (e: React.MouseEvent, testId: string) => {
    e.stopPropagation() // Esto es clave para evitar que se abra el test
    if (confirm("¿Estás seguro de que deseas eliminar este test?")) {
      // Eliminar localmente
      setTests(tests.filter(test => test.id !== testId))
      
      // Eliminar en el servidor
      try {
        const response = await fetch('/api/delete-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: testId }),
        });
        
        if (!response.ok) {
          console.error('Error deleting test on server');
        }
      } catch (error) {
        console.error('Error calling delete API:', error);
      }
      
      toast({
        title: "Test eliminado",
        description: "El test se ha eliminado correctamente",
      })
    }
  }

  // Si hay un test seleccionado, mostrar el TestViewer
  if (selectedTest) {
    return (
      <div className="container mx-auto py-8">
        <Button
          variant="outline"
          onClick={() => setSelectedTest(null)}
          className="mb-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to list
        </Button>
        <TestViewer 
          test={selectedTest}
          onFinish={() => setSelectedTest(null)}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="outline"
          onClick={() => router.push("/")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        <h1 className="text-3xl font-bold">Available Tests</h1>
        <div className="w-[100px]" />
      </div>

      {tests.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/20">
          <p className="text-lg text-muted-foreground">No tests available</p>
          <p className="text-sm text-muted-foreground mt-2">
            Go back to the home page to create a new test
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <Card 
              key={test.id}
              className="relative group cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTest(test)}
            >
              <CardHeader>
                <CardTitle>{test.name || "Test without name"}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {test.description || "No description"}
                </p>
                <div className="text-sm text-muted-foreground mt-2">
                  {test.questions.length} questions
                </div>
              </CardHeader>
              
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDelete(e, test.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 